import { createClient } from '@supabase/supabase-js'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultPort = process.env.FIELD_HUB_E2E_PORT ?? '5180'
const baseUrl = process.env.FIELD_HUB_E2E_BASE_URL ?? `http://127.0.0.1:${defaultPort}/`
const email = process.env.FIELD_HUB_E2E_EMAIL
const password = process.env.FIELD_HUB_E2E_PASSWORD
const allowRemoteMutation = process.env.FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION === '1'
const requirePreviewServer = process.env.FIELD_HUB_E2E_REQUIRE_PREVIEW === '1'

class QaBlockedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'QaBlockedError'
  }
}

function readDotEnv() {
  const envPath = resolve(rootDir, '.env')
  if (!existsSync(envPath)) {
    return {}
  }

  return Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...valueParts] = line.split('=')
        return [key.trim(), valueParts.join('=').trim().replace(/^["']|["']$/g, '')]
      }),
  )
}

function requireValue(value, label) {
  if (!value) {
    throw new Error(`${label} fehlt.`)
  }

  return value
}

function chromeExecutablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ].filter(Boolean)

  const executablePath = candidates.find((candidate) => existsSync(candidate))
  if (!executablePath) {
    throw new Error('Kein Chromium/Chrome gefunden. Setze PUPPETEER_EXECUTABLE_PATH.')
  }

  return executablePath
}

async function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Server is still starting.
    }
    await new Promise((resolveTimer) => setTimeout(resolveTimer, 250))
  }

  throw new Error(`${requirePreviewServer ? 'Preview' : 'Dev'}-Server nicht erreichbar: ${url}`)
}

function startAppServerIfNeeded() {
  if (process.env.FIELD_HUB_E2E_BASE_URL) {
    return null
  }
  if (requirePreviewServer && !existsSync(resolve(rootDir, 'dist/index.html'))) {
    throw new QaBlockedError('FIELD_HUB_E2E_REQUIRE_PREVIEW=1 gesetzt, aber dist/index.html fehlt. Fuehre zuerst npm run build aus.')
  }

  const childEnv = { ...process.env }
  delete childEnv.FIELD_HUB_E2E_EMAIL
  delete childEnv.FIELD_HUB_E2E_PASSWORD

  const useProcessGroup = process.platform !== 'win32'
  const scriptName = requirePreviewServer ? 'preview' : 'dev'
  const child = spawn('npm', ['run', scriptName, '--', '--host', '127.0.0.1', '--port', defaultPort], {
    cwd: rootDir,
    detached: useProcessGroup,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => {
    if (process.env.FIELD_HUB_E2E_VERBOSE === '1') {
      process.stdout.write(chunk)
    }
  })
  child.stderr.on('data', (chunk) => {
    if (process.env.FIELD_HUB_E2E_VERBOSE === '1') {
      process.stderr.write(chunk)
    }
  })

  return child
}

async function stopDevServer(child) {
  if (!child) {
    return
  }

  let exited = false
  child.once('exit', () => {
    exited = true
  })

  const killTarget = child.spawnargs.length > 0 && process.platform !== 'win32' ? -child.pid : child.pid
  try {
    process.kill(killTarget, 'SIGTERM')
  } catch {
    // Process may already be gone.
  }

  await new Promise((resolveTimer) => {
    const timeout = setTimeout(() => {
      if (!exited) {
        try {
          process.kill(killTarget, 'SIGKILL')
        } catch {
          // Process may already be gone.
        }
      }
      resolveTimer()
    }, 1_000)

    child.once('exit', () => {
      clearTimeout(timeout)
      resolveTimer()
    })
  })
}

async function clickButtonByLabelOrText(page, label, contextLabel = label) {
  try {
    await page.waitForFunction(
      (buttonLabel) =>
        [...document.querySelectorAll('button')].some(
          (button) =>
            !button.disabled &&
            (button.getAttribute('aria-label') === buttonLabel || button.textContent?.trim() === buttonLabel),
        ),
      { timeout: 20_000 },
      label,
    )
  } catch (error) {
    const diagnostics = await page.evaluate(() => ({
      buttons: [...document.querySelectorAll('button')].map((button) => ({
        ariaLabel: button.getAttribute('aria-label'),
        disabled: button.disabled,
        text: button.textContent?.trim(),
      })),
      textPreview: document.body.innerText.slice(0, 800),
    }))
    throw new Error(`${contextLabel}: Button nicht gefunden: ${label}. ${JSON.stringify(diagnostics)}`, { cause: error })
  }

  await page.evaluate((buttonLabel) => {
    const button = [...document.querySelectorAll('button')].find(
      (candidate) =>
        !candidate.disabled &&
        (candidate.getAttribute('aria-label') === buttonLabel || candidate.textContent?.trim() === buttonLabel),
    )
    button?.click()
  }, label)
}

async function waitForText(page, text) {
  await page.waitForFunction((expected) => document.body.innerText.includes(expected), { timeout: 30_000 }, text)
}

async function queryEntryForPlayer(supabase, playerId, timeoutMs = 15_000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const { data, error } = await supabase
      .from('player_session_entries')
      .select('id, readiness, life_flag, pain_score, pain_location, returner_flag, session_reaction, checkin_source')
      .eq('player_id', playerId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }
    if (data?.[0]) {
      return data[0]
    }
    await new Promise((resolveTimer) => setTimeout(resolveTimer, 500))
  }

  throw new Error('Remote Check-in-Entry wurde nach Kiosk-Submit nicht gefunden.')
}

async function cleanupSeed(supabase, playerId) {
  const entryDelete = await supabase.from('player_session_entries').delete().eq('player_id', playerId)
  const playerDelete = await supabase.from('players').delete().eq('id', playerId)

  if (entryDelete.error || playerDelete.error) {
    throw new Error(
      `Cleanup unvollstaendig: ${entryDelete.error?.message ?? 'entries ok'}; ${playerDelete.error?.message ?? 'player ok'}`,
    )
  }
}

async function main() {
  if (!allowRemoteMutation) {
    throw new QaBlockedError('FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1 fehlt fuer den Kiosk-Remote-Test.')
  }

  const localEnv = readDotEnv()
  const supabaseUrl = requireValue(process.env.VITE_SUPABASE_URL ?? localEnv.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')
  const supabaseKey = requireValue(
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? localEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  )
  const e2eEmail = requireValue(email, 'FIELD_HUB_E2E_EMAIL')
  const e2ePassword = requireValue(password, 'FIELD_HUB_E2E_PASSWORD')
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const appServer = startAppServerIfNeeded()
  let browser
  let playerId = null
  let playerName = null
  let signedIn = false
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: e2eEmail,
      password: e2ePassword,
    })
    if (authError || !authData.user) {
      throw authError ?? new Error('Supabase-Login fehlgeschlagen.')
    }
    signedIn = true

    const now = new Date().toISOString()
    playerId = randomUUID()
    playerName = `E2E Kiosk ${Date.now()}`
    const { error: seedError } = await supabase.from('players').insert({
      id: playerId,
      user_id: authData.user.id,
      name: playerName,
      position: 'E2E',
      cluster: 'offen',
      active: true,
      consent_status: 'unklar',
      photo_consent_status: 'not_asked',
      photo_path: null,
      photo_updated_at: null,
      returner_status: 'nein',
      notes: 'Temporary kiosk E2E seed. Safe to delete.',
      created_at: now,
      updated_at: now,
      client_updated_at: now,
      deleted_at: null,
    })
    if (seedError) {
      throw seedError
    }

    await waitForServer(baseUrl)
    browser = await puppeteer.launch({
      executablePath: chromeExecutablePath(),
      headless: true,
      args: ['--no-sandbox'],
    })
    const page = await browser.newPage()
    const consoleMessages = []
    page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }))
    page.on('pageerror', (error) => consoleMessages.push({ type: 'pageerror', text: error.message }))

    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
    await clickButtonByLabelOrText(page, 'Mehr', 'Coach login navigation')
    await clickButtonByLabelOrText(page, 'Einstellungen', 'Coach login navigation')
    await page.waitForSelector('input[type="email"]', { timeout: 20_000 })
    await page.type('input[type="email"]', e2eEmail)
    await page.type('input[type="password"]', e2ePassword)
    await clickButtonByLabelOrText(page, 'Einloggen', 'Coach login')
    await waitForText(page, 'Coach-Session')

    await clickButtonByLabelOrText(page, 'Einheit', 'Kiosk navigation')
    await clickButtonByLabelOrText(page, 'Check-in', 'Kiosk navigation')
    await clickButtonByLabelOrText(page, 'Kiosk starten', 'Kiosk navigation')
    await waitForText(page, 'Training Check-in')

    await page.waitForSelector('input[placeholder="2-3 Buchstaben tippen"]', { timeout: 20_000 })
    await page.type('input[placeholder="2-3 Buchstaben tippen"]', playerName)
    await clickButtonByLabelOrText(page, playerName, 'Kiosk player selection')
    await clickButtonByLabelOrText(page, 'Weiter', 'Kiosk player selection')
    await clickButtonByLabelOrText(page, '4', 'Kiosk readiness')
    await clickButtonByLabelOrText(page, 'Weiter', 'Kiosk readiness')
    await clickButtonByLabelOrText(page, 'Stress', 'Kiosk life flags')
    await clickButtonByLabelOrText(page, 'Muskelkater', 'Kiosk life flags')
    await clickButtonByLabelOrText(page, 'Weiter', 'Kiosk life flags')
    await clickButtonByLabelOrText(page, '0', 'Kiosk pain')
    await clickButtonByLabelOrText(page, 'Weiter', 'Kiosk pain')

    const submitDisabledBeforeReaction = await page.evaluate(() => {
      const next = [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Weiter')
      return next?.disabled ?? null
    })
    if (submitDisabledBeforeReaction !== true) {
      throw new Error('Weiter war ohne explizite Session-Reaktion aktiviert.')
    }

    await clickButtonByLabelOrText(page, 'Nein', 'Kiosk reaction')
    await clickButtonByLabelOrText(page, 'Weiter', 'Kiosk reaction')
    await clickButtonByLabelOrText(page, 'Speichern und weitergeben', 'Kiosk review')
    await waitForText(page, 'Gespeichert')

    const entry = await queryEntryForPlayer(supabase, playerId)
    if (
      entry.readiness !== 4 ||
      entry.life_flag !== 'Stress; Muskelkater' ||
      entry.pain_score !== 0 ||
      entry.pain_location !== '' ||
      entry.returner_flag !== 'nein' ||
      entry.session_reaction !== 'none' ||
      entry.checkin_source !== 'player_kiosk'
    ) {
      throw new Error(`Remote Check-in-Entry unerwartet: ${JSON.stringify(entry)}`)
    }

    const errorMessages = consoleMessages.filter(
      (message) =>
        message.type === 'pageerror' ||
        (message.type === 'error' && !message.text.includes('Download the React DevTools')),
    )
    if (errorMessages.length > 0) {
      throw new Error(`Browser-Konsole enthaelt Fehler: ${JSON.stringify(errorMessages)}`)
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          seededPlayer: playerName,
          verifiedEntry: {
            readiness: entry.readiness,
            lifeFlag: entry.life_flag,
            painScore: entry.pain_score,
            painLocation: entry.pain_location,
            returnerFlag: entry.returner_flag,
            sessionReaction: entry.session_reaction,
            checkInSource: entry.checkin_source,
          },
        },
        null,
        2,
      ),
    )
  } finally {
    if (browser) {
      await browser.close()
    }
    if (playerId) {
      await cleanupSeed(supabase, playerId)
    }
    if (signedIn) {
      await supabase.auth.signOut()
    }
    await stopDevServer(appServer)
  }
}

main().catch((error) => {
  if (error instanceof QaBlockedError) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          status: 'blocked',
          reason: error.message,
        },
        null,
        2,
      ),
    )
    process.exit(1)
  }
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
