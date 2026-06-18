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

  throw new Error(`Dev-Server nicht erreichbar: ${url}`)
}

function startDevServerIfNeeded() {
  if (process.env.FIELD_HUB_E2E_BASE_URL) {
    return null
  }

  const childEnv = { ...process.env }
  delete childEnv.FIELD_HUB_E2E_EMAIL
  delete childEnv.FIELD_HUB_E2E_PASSWORD

  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', defaultPort], {
    cwd: rootDir,
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
  if (!child || child.killed) {
    return
  }

  child.kill('SIGTERM')
  await new Promise((resolveTimer) => {
    child.once('exit', resolveTimer)
    setTimeout(resolveTimer, 1_000)
  })
}

async function clickButtonByText(page, text) {
  await page.waitForFunction(
    (label) =>
      [...document.querySelectorAll('button')].some(
        (button) => button.textContent?.trim() === label && !button.disabled,
      ),
    { timeout: 20_000 },
    text,
  )
  await page.evaluate((label) => {
    const button = [...document.querySelectorAll('button')].find(
      (candidate) => candidate.textContent?.trim() === label && !candidate.disabled,
    )
    button?.click()
  }, text)
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

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: e2eEmail,
    password: e2ePassword,
  })
  if (authError || !authData.user) {
    throw authError ?? new Error('Supabase-Login fehlgeschlagen.')
  }

  const now = new Date().toISOString()
  const playerId = randomUUID()
  const playerName = `E2E Kiosk ${Date.now()}`
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

  const devServer = startDevServerIfNeeded()
  let browser
  try {
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
    await clickButtonByText(page, 'Einstellungen')
    await page.waitForSelector('input[type="email"]', { timeout: 20_000 })
    await page.type('input[type="email"]', e2eEmail)
    await page.type('input[type="password"]', e2ePassword)
    await clickButtonByText(page, 'Einloggen')
    await waitForText(page, 'Coach-Session')

    await clickButtonByText(page, 'Check-in')
    await clickButtonByText(page, 'Kiosk starten')
    await waitForText(page, 'Training Check-in')

    await page.waitForSelector('input[placeholder="2-3 Buchstaben tippen"]', { timeout: 20_000 })
    await page.type('input[placeholder="2-3 Buchstaben tippen"]', playerName)
    await clickButtonByText(page, playerName)
    await clickButtonByText(page, '4')
    await clickButtonByText(page, 'Stress')
    await clickButtonByText(page, 'Muskelkater')
    await clickButtonByText(page, '0')

    const submitDisabledBeforeReaction = await page.evaluate(() => {
      const submit = [...document.querySelectorAll('button')].find(
        (button) => button.textContent?.trim() === 'Speichern und weitergeben',
      )
      return submit?.disabled ?? null
    })
    if (submitDisabledBeforeReaction !== false) {
      throw new Error('Submit war ohne explizite Session-Reaktion nicht aktiviert.')
    }

    await clickButtonByText(page, 'Speichern und weitergeben')
    await waitForText(page, 'Check-in gespeichert.')

    const entry = await queryEntryForPlayer(supabase, playerId)
    if (
      entry.readiness !== 4 ||
      entry.life_flag !== 'Stress; Muskelkater' ||
      entry.pain_score !== 0 ||
      entry.pain_location !== '' ||
      entry.returner_flag !== 'offen' ||
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
    await cleanupSeed(supabase, playerId)
    await supabase.auth.signOut()
    await stopDevServer(devServer)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
