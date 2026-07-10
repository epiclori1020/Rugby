import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
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
      'R5-QA-Testzustand fehlt: benoetigt werden mindestens ein Kaderspieler, ein Check-in und eine sichtbare Aufmerksamkeitszeile.',
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
  await clickButton(page, 'Mehr')
  await clickButton(page, 'Einstellungen')
  await page.waitForSelector('input[type="email"]', { timeout: 20_000 })
  await page.type('input[type="email"]', authEmail)
  await page.type('input[type="password"]', authPassword)
  await clickButton(page, 'Einloggen')
  await page.waitForFunction(() => document.body.innerText.includes('Eingeloggt als'), { timeout: 30_000 })
  await clickButton(page, 'Heute')
  await page.waitForSelector('.today-squad-screen', { timeout: 20_000 })
  return { status: 'checked' }
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

async function main() {
  if (!existsSync(resolve(rootDir, 'dist/index.html'))) {
    throw new QaBlockedError('dist/index.html fehlt. Fuehre zuerst npm run build aus.')
  }
  if (requireAuth && (!authEmail || !authPassword)) {
    throw new QaBlockedError('FIELD_HUB_E2E_EMAIL und FIELD_HUB_E2E_PASSWORD fehlen.')
  }

  const preview = startPreviewIfNeeded()
  let browser
  try {
    await waitForServer()
    browser = await puppeteer.launch({ executablePath: chromeExecutablePath(), headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage()
    const browserErrors = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text())
    })
    const auth = await signIn(page)
    if (auth.status !== 'checked') throw new QaBlockedError('R5-QA benötigt eine eingeloggte Coach-Session.')
    const checks = []
    for (const viewport of viewports) checks.push(await inspectToday(page, viewport))
    if (browserErrors.length > 0) throw new Error(`Browserfehler: ${browserErrors.join('; ')}`)
    console.log(JSON.stringify({ ok: true, baseUrl: target.logUrl, checks }, null, 2))
  } finally {
    await closeBrowser(browser)
    await stopPreview(preview)
  }
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
