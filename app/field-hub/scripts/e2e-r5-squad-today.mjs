import { createClient } from '@supabase/supabase-js'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultPort = process.env.FIELD_HUB_R5_E2E_PORT ?? '5185'
const target = resolveR5Target(
  process.env.FIELD_HUB_R5_E2E_BASE_URL ?? `http://127.0.0.1:${defaultPort}/`,
  process.env.FIELD_HUB_R5_E2E_AUTH_ORIGIN,
)
const baseUrl = target.url
const requireAuth = process.env.FIELD_HUB_R5_REQUIRE_AUTH === '1'
const authEmail = process.env.FIELD_HUB_E2E_EMAIL
const authPassword = process.env.FIELD_HUB_E2E_PASSWORD
const allowRemoteMutation = process.env.FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION === '1'
const fixtureMarkerPrefix = 'Temporary R5 E2E seed. Safe to delete.'

const viewports = [
  { label: 'iPhone 375', width: 375, height: 667, isMobile: true, expectsSplit: false },
  { label: 'iPhone 393', width: 393, height: 852, isMobile: true, expectsSplit: false },
  { label: 'Medium 744', width: 744, height: 1133, isMobile: true, expectsSplit: false },
  { label: 'iPad 834', width: 834, height: 1194, isMobile: true, expectsSplit: true },
  { label: 'Sidebar edge 840', width: 840, height: 1180, isMobile: false, expectsSplit: false },
  { label: 'iPad 1194', width: 1194, height: 834, isMobile: false, expectsSplit: true },
]

class QaBlockedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'QaBlockedError'
  }
}

function readDotEnv() {
  const envPath = resolve(rootDir, '.env')
  if (!existsSync(envPath)) return {}

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
  if (!value) throw new QaBlockedError(`${label} fehlt.`)
  return value
}

export function resolveR5Target(rawBaseUrl, allowedAuthOrigin) {
  let url
  try {
    url = new URL(rawBaseUrl)
  } catch {
    throw new QaBlockedError('FIELD_HUB_R5_E2E_BASE_URL ist keine gueltige URL.')
  }

  if (url.username || url.password) {
    throw new QaBlockedError('R5-QA-Ziel darf keine Zugangsdaten in der URL enthalten.')
  }

  const isLoopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  if (!isLoopback) {
    if (url.protocol !== 'https:') {
      throw new QaBlockedError('Remote R5-QA-Ziele muessen HTTPS verwenden.')
    }

    let allowedOrigin
    try {
      allowedOrigin = allowedAuthOrigin ? new URL(allowedAuthOrigin).origin : null
    } catch {
      throw new QaBlockedError('FIELD_HUB_R5_E2E_AUTH_ORIGIN ist keine gueltige Origin.')
    }

    if (!allowedOrigin || allowedOrigin !== url.origin) {
      throw new QaBlockedError(
        'Remote R5-QA-Ziel ist nicht freigegeben. Setze FIELD_HUB_R5_E2E_AUTH_ORIGIN auf die exakte HTTPS-Origin.',
      )
    }
  }

  const safeLogUrl = new URL(url)
  safeLogUrl.search = ''
  safeLogUrl.hash = ''

  return { url: url.href, logUrl: safeLogUrl.href }
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
    throw new QaBlockedError('Kein Chromium/Chrome gefunden. Setze PUPPETEER_EXECUTABLE_PATH.')
  }
  return executablePath
}

async function waitForServer(timeoutMs = 30_000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      // Preview server is still starting.
    }
    await new Promise((resolveTimer) => setTimeout(resolveTimer, 250))
  }
  throw new Error(`Preview-Server nicht erreichbar: ${target.logUrl}`)
}

function startPreviewIfNeeded() {
  if (process.env.FIELD_HUB_R5_E2E_BASE_URL) return null
  const childEnv = { ...process.env }
  delete childEnv.FIELD_HUB_E2E_EMAIL
  delete childEnv.FIELD_HUB_E2E_PASSWORD
  return spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', defaultPort], {
    cwd: rootDir,
    detached: process.platform !== 'win32',
    env: childEnv,
    stdio: 'ignore',
  })
}

export async function stopPreview(child) {
  if (!child) return

  let exited = false
  child.once('exit', () => {
    exited = true
  })

  const killTarget = process.platform === 'win32' ? child.pid : -child.pid
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

  child.stdout?.destroy()
  child.stderr?.destroy()
  child.unref()
}

export async function closeBrowser(browser) {
  if (!browser) return

  let closed = false
  try {
    await Promise.race([
      browser.close().then(() => {
        closed = true
      }),
      new Promise((resolveTimer) => setTimeout(resolveTimer, 2_000)),
    ])
  } finally {
    if (!closed) browser.process()?.kill('SIGKILL')
  }
}

export function validateR5Fixture({ squad, present, playerIds }) {
  if (squad < 1 || present < 1 || playerIds.length < 1) {
    throw new QaBlockedError(
      `R5-QA-Testzustand fehlt: squad=${squad}, present=${present}, attentionRows=${playerIds.length}.`,
    )
  }
}

async function clickButton(page, label) {
  await page.waitForFunction(
    (expected) =>
      [...document.querySelectorAll('button')].some(
        (button) =>
          !button.disabled &&
          (button.getAttribute('aria-label') === expected || button.textContent?.trim() === expected),
      ),
    { timeout: 20_000 },
    label,
  )
  await page.evaluate((expected) => {
    const button = [...document.querySelectorAll('button')].find(
      (candidate) =>
        !candidate.disabled &&
        (candidate.getAttribute('aria-label') === expected || candidate.textContent?.trim() === expected),
    )
    button?.click()
  }, label)
}

async function signIn(page) {
  if (!authEmail || !authPassword) {
    if (requireAuth) throw new QaBlockedError('FIELD_HUB_E2E_EMAIL und FIELD_HUB_E2E_PASSWORD fehlen.')
    return { status: 'skipped' }
  }
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await page.waitForSelector('input[type="email"]', { timeout: 20_000 })
  await page.type('input[type="email"]', authEmail)
  await page.type('input[type="password"]', authPassword)
  await clickButton(page, 'Einloggen')
  await page.waitForSelector('.today-squad-screen', { timeout: 20_000 })
  return { status: 'checked' }
}

async function signOut(page) {
  await page.goto(new URL('/#/more/settings', baseUrl).toString(), { waitUntil: 'networkidle2', timeout: 30_000 })
  await page.waitForSelector('.app-shell', { timeout: 20_000 })
  await clickButton(page, 'Logout')
  await page.waitForSelector('.welcome-page', { timeout: 20_000 })
}

async function inspectToday(page, viewport) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    isMobile: viewport.isMobile,
  })
  await page.reload({ waitUntil: 'networkidle2', timeout: 30_000 })
  await page.waitForFunction(
    () =>
      Boolean(
        document.querySelector('.today-squad-screen [data-metric-id="squad"] dd') &&
          document.querySelector('.sync-status-trigger'),
      ),
    { timeout: 20_000 },
  )

  const result = await page.evaluate(() => {
    const metricValue = (id) =>
      Number(document.querySelector(`[data-metric-id="${id}"] dd`)?.textContent?.trim() ?? Number.NaN)
    const main = document.querySelector('.today-squad-main')?.getBoundingClientRect()
    const context = document.querySelector('.today-context-column')?.getBoundingClientRect()
    const cta = document.querySelector('[data-testid="today-quick-action-check-in"]')?.getBoundingClientRect()
    const bottomNavElement = document.querySelector('.bottom-tab-bar')
    const bottomNav =
      bottomNavElement && window.getComputedStyle(bottomNavElement).position === 'fixed'
        ? bottomNavElement.getBoundingClientRect()
        : null
    const playerIds = [...document.querySelectorAll('.today-attention-list [data-player-id]')]
      .map((row) => row.getAttribute('data-player-id'))
      .filter(Boolean)
    return {
      headingCount: document.querySelectorAll('#today-heading').length,
      heading: document.querySelector('#today-heading')?.textContent?.trim(),
      syncCount: document.querySelectorAll('.sync-status-trigger').length,
      squad: metricValue('squad'),
      present: metricValue('present'),
      playerIds,
      noOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      split: Boolean(main && context && Math.abs(main.top - context.top) < 4 && context.left > main.left),
      ctaVisibleAboveNavigation: Boolean(
        cta &&
          cta.top >= 0 &&
          cta.bottom <= (bottomNav?.top ?? window.innerHeight) + 1,
      ),
    }
  })

  if (result.headingCount !== 1 || result.heading !== 'Squad heute') {
    throw new Error(`${viewport.label}: erwartet genau einen Screen-Header „Squad heute“.`)
  }
  if (result.syncCount !== 1) {
    throw new Error(`${viewport.label}: erwartet genau einen Sync-Status, erhalten ${result.syncCount}.`)
  }
  if (!Number.isFinite(result.squad) || !Number.isFinite(result.present) || result.present > result.squad) {
    throw new Error(`${viewport.label}: unplausible Kader-/Anwesenheitswerte ${result.present}/${result.squad}.`)
  }
  validateR5Fixture(result)
  if (new Set(result.playerIds).size !== result.playerIds.length || result.playerIds.length > result.present) {
    throw new Error(`${viewport.label}: Aufmerksamkeitsliste ist nicht eindeutig pro anwesendem Spieler.`)
  }
  if (!result.noOverflow || result.split !== viewport.expectsSplit) {
    throw new Error(`${viewport.label}: Responsive-Layout entspricht nicht dem R5-Vertrag.`)
  }
  if (!result.ctaVisibleAboveNavigation) {
    throw new Error(`${viewport.label}: primäre Check-in-Aktion liegt beim Start nicht oberhalb der Navigation.`)
  }

  return { viewport: viewport.label, squad: result.squad, present: result.present, attentionRows: result.playerIds.length }
}

function sessionDateFromDefinitionId(sessionDefinitionId) {
  const match = sessionDefinitionId.match(/(\d{4}-\d{2}-\d{2})$/)
  if (!match) {
    throw new QaBlockedError(`Session-Datum kann nicht aus der gewählten Session abgeleitet werden: ${sessionDefinitionId}`)
  }
  return match[1]
}

async function createTemporaryFixture(supabase, userId, sessionDefinitionId) {
  const now = new Date().toISOString()
  const fixture = {
    playerId: randomUUID(),
    sessionLogIds: [],
    createdSessionLogId: null,
    entryIds: [],
    marker: `${fixtureMarkerPrefix} Run ${randomUUID()}`,
  }

  try {
    const existingSessionLogs = await supabase
      .from('session_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('session_definition_id', sessionDefinitionId)
      .is('deleted_at', null)
    if (existingSessionLogs.error) throw existingSessionLogs.error
    fixture.sessionLogIds = (existingSessionLogs.data ?? []).map((sessionLog) => sessionLog.id)

    const playerInsert = await supabase.from('players').insert({
      id: fixture.playerId,
      user_id: userId,
      name: `E2E R5 ${Date.now()}`,
      position: 'E2E',
      cluster: 'offen',
      active: true,
      consent_status: 'unklar',
      photo_consent_status: 'not_asked',
      returner_status: 'nein',
      notes: fixture.marker,
      created_at: now,
      updated_at: now,
      client_updated_at: now,
      deleted_at: null,
    })
    if (playerInsert.error) throw playerInsert.error

    if (fixture.sessionLogIds.length === 0) {
      fixture.createdSessionLogId = randomUUID()
      fixture.sessionLogIds = [fixture.createdSessionLogId]
      const sessionInsert = await supabase.from('session_logs').insert({
        id: fixture.createdSessionLogId,
        user_id: userId,
        session_definition_id: sessionDefinitionId,
        date: sessionDateFromDefinitionId(sessionDefinitionId),
        status: 'in_progress',
        coach: 'E2E',
        created_at: now,
        updated_at: now,
        client_updated_at: now,
        deleted_at: null,
      })
      if (sessionInsert.error) throw sessionInsert.error
    }

    fixture.entryIds = fixture.sessionLogIds.map(() => randomUUID())
    const entryInsert = await supabase.from('player_session_entries').insert(
      fixture.sessionLogIds.map((sessionLogId, index) => ({
        id: fixture.entryIds[index],
        user_id: userId,
        session_log_id: sessionLogId,
        player_id: fixture.playerId,
        present: true,
        readiness: 2,
        life_flag: 'Stress',
        pain_score: 0,
        pain_location: '',
        returner_flag: 'nein',
        traffic_light: 'yellow',
        limits: [],
        observation: fixture.marker,
        session_reaction: 'none',
        checkin_source: 'coach',
        created_at: now,
        updated_at: now,
        client_updated_at: now,
        deleted_at: null,
      })),
    )
    if (entryInsert.error) throw entryInsert.error

    return fixture
  } catch (error) {
    await cleanupTemporaryFixture(supabase, fixture)
    throw error
  }
}

async function assertRowsAbsent(supabase, table, ids) {
  if (ids.length === 0) return
  const result = await supabase.from(table).select('id').in('id', ids)
  if (result.error) throw result.error
  if (result.data?.length) {
    throw new Error(`Remote-Cleanup unvollständig: ${table} enthält noch ${result.data.length} temporäre Zeile(n).`)
  }
}

async function cleanupTemporaryFixture(supabase, fixture) {
  if (!fixture) return

  const entryDelete =
    fixture.entryIds.length > 0
      ? await supabase.from('player_session_entries').delete().in('id', fixture.entryIds)
      : { error: null }
  const sessionDelete = fixture.createdSessionLogId
    ? await supabase.from('session_logs').delete().eq('id', fixture.createdSessionLogId)
    : { error: null }
  const playerDelete = await supabase.from('players').delete().eq('id', fixture.playerId)
  const cleanupError = entryDelete.error ?? sessionDelete.error ?? playerDelete.error
  if (cleanupError) throw cleanupError

  await assertRowsAbsent(supabase, 'player_session_entries', fixture.entryIds)
  await assertRowsAbsent(supabase, 'session_logs', fixture.createdSessionLogId ? [fixture.createdSessionLogId] : [])
  await assertRowsAbsent(supabase, 'players', [fixture.playerId])
  const markerVerify = await supabase.from('players').select('id').eq('notes', fixture.marker)
  if (markerVerify.error) throw markerVerify.error
  if (markerVerify.data?.length) {
    throw new Error('Remote-Cleanup unvollständig: R5-Fixture-Marker ist noch vorhanden.')
  }
}

async function main() {
  if (!existsSync(resolve(rootDir, 'dist/index.html'))) {
    throw new QaBlockedError('dist/index.html fehlt. Fuehre zuerst npm run build aus.')
  }
  if (requireAuth && (!authEmail || !authPassword)) {
    throw new QaBlockedError('FIELD_HUB_E2E_EMAIL und FIELD_HUB_E2E_PASSWORD fehlen.')
  }
  if (!allowRemoteMutation) {
    throw new QaBlockedError('FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1 fehlt für die temporäre R5-Fixture.')
  }

  const localEnv = readDotEnv()
  const supabaseUrl = requireValue(process.env.VITE_SUPABASE_URL ?? localEnv.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')
  const supabaseKey = requireValue(
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? localEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  )
  const e2eEmail = requireValue(authEmail, 'FIELD_HUB_E2E_EMAIL')
  const e2ePassword = requireValue(authPassword, 'FIELD_HUB_E2E_PASSWORD')
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const preview = startPreviewIfNeeded()
  let browser
  let page
  let signedIn = false
  let apiSignedIn = false
  let fixture = null
  let checks = []
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: e2eEmail,
      password: e2ePassword,
    })
    if (authError || !authData.user) throw authError ?? new Error('Supabase-Login fehlgeschlagen.')
    apiSignedIn = true

    await waitForServer()
    browser = await puppeteer.launch({ executablePath: chromeExecutablePath(), headless: true, args: ['--no-sandbox'] })
    page = await browser.newPage()
    const browserErrors = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text())
    })
    const auth = await signIn(page)
    if (auth.status !== 'checked') throw new QaBlockedError('R5-QA benötigt eine eingeloggte Coach-Session.')
    signedIn = true
    const sessionDefinitionId = await page.evaluate(() => localStorage.getItem('fieldHub:selectedSessionId'))
    if (!sessionDefinitionId) throw new QaBlockedError('Gewählte Session ist im Browser nicht verfügbar.')
    fixture = await createTemporaryFixture(supabase, authData.user.id, sessionDefinitionId)
    await page.reload({ waitUntil: 'networkidle2', timeout: 30_000 })
    for (const viewport of viewports) checks.push(await inspectToday(page, viewport))
    if (browserErrors.length > 0) throw new Error(`Browserfehler: ${browserErrors.join('; ')}`)
  } finally {
    let cleanupError = null
    const runCleanupStep = async (step) => {
      try {
        await step()
      } catch (error) {
        cleanupError ??= error
      }
    }

    await runCleanupStep(() => cleanupTemporaryFixture(supabase, fixture))
    await runCleanupStep(async () => {
      if (signedIn && page) await signOut(page)
    })
    await runCleanupStep(() => closeBrowser(browser))
    await runCleanupStep(async () => {
      if (!apiSignedIn) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    })
    await runCleanupStep(() => stopPreview(preview))
    if (cleanupError) throw cleanupError
  }

  console.log(
    JSON.stringify(
      { ok: true, baseUrl: target.logUrl, fixture: 'temporary-r5', cleanup: 'remote-absence-verified', checks },
      null,
      2,
    ),
  )
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(
      JSON.stringify(
        { ok: false, status: error instanceof QaBlockedError ? 'blocked' : 'failed', reason: error.message },
        null,
        2,
      ),
    )
    process.exitCode = error instanceof QaBlockedError ? 2 : 1
  })
}
