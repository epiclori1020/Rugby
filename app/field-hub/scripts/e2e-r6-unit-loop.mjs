import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(rootDir, '../..')
const defaultPort = process.env.FIELD_HUB_R6_E2E_PORT ?? '5186'
const baseUrl = process.env.FIELD_HUB_R6_E2E_BASE_URL ?? `http://127.0.0.1:${defaultPort}/`
const authEmail = process.env.FIELD_HUB_E2E_EMAIL
const authPassword = process.env.FIELD_HUB_E2E_PASSWORD
const allowedAuthOrigin = process.env.FIELD_HUB_R6_E2E_AUTH_ORIGIN
const screenshotsEnabled = process.env.FIELD_HUB_R6_SCREENSHOTS === '1'
const syntheticFixture = process.env.FIELD_HUB_R6_SYNTHETIC_FIXTURE === '1'
const screenshotsDir = resolve(repoRoot, '.tmp/onfield-r6-evidence/after')

const viewports = [
  { name: 'iphone-375', width: 375, height: 667, isMobile: true },
  { name: 'iphone-393', width: 393, height: 852, isMobile: true },
  { name: 'medium-744', width: 744, height: 1133, isMobile: true },
  { name: 'ipad-834', width: 834, height: 1194, isMobile: true },
  { name: 'ipad-1194', width: 1194, height: 834, isMobile: false },
]

const themes = ['light', 'dark']
const routes = [
  { name: 'check-in', hash: '#/unit/check-in', heading: 'Pre-Session Check-in' },
  { name: 'training', hash: '#/unit/training', heading: 'Training-Ansicht' },
  { name: 'returners', hash: '#/unit/returners', heading: 'Returner-Aufgaben' },
  { name: 'post-session', hash: '#/unit/post-session', heading: 'Nachbereitung' },
]

class QaBlockedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'QaBlockedError'
  }
}

function validateTarget(rawUrl) {
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    throw new QaBlockedError('FIELD_HUB_R6_E2E_BASE_URL ist keine gueltige URL.')
  }

  if (url.username || url.password) {
    throw new QaBlockedError('R6-QA-Ziel darf keine Zugangsdaten in der URL enthalten.')
  }

  const isLoopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  if (!isLoopback && url.protocol !== 'https:') {
    throw new QaBlockedError('Remote R6-QA-Ziele muessen HTTPS verwenden.')
  }
  if (!isLoopback) {
    let allowedOrigin
    try {
      allowedOrigin = allowedAuthOrigin ? new URL(allowedAuthOrigin).origin : null
    } catch {
      throw new QaBlockedError('FIELD_HUB_R6_E2E_AUTH_ORIGIN ist keine gueltige Origin.')
    }
    if (!allowedOrigin || allowedOrigin !== url.origin) {
      throw new QaBlockedError('Remote R6-QA-Ziel ist nicht explizit fuer Auth freigegeben.')
    }
  }

  return url.href
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

function startPreviewIfNeeded() {
  if (process.env.FIELD_HUB_R6_E2E_BASE_URL) return null
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

async function stopProcess(child) {
  if (!child) return
  const targetPid = process.platform === 'win32' ? child.pid : -child.pid
  try {
    process.kill(targetPid, 'SIGTERM')
  } catch {
    return
  }
  await Promise.race([
    new Promise((resolvePromise) => child.once('exit', resolvePromise)),
    new Promise((resolvePromise) => setTimeout(resolvePromise, 1_000)),
  ])
}

async function waitForServer(targetUrl) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30_000) {
    try {
      const response = await fetch(targetUrl)
      if (response.ok) return
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
  }
  throw new Error('R6 Preview-Server ist nicht erreichbar.')
}

async function clickButton(page, label) {
  await page.waitForFunction(
    (expected) => [...document.querySelectorAll('button')].some(
      (button) => !button.disabled && (button.textContent?.trim() === expected || button.getAttribute('aria-label') === expected),
    ),
    { timeout: 20_000 },
    label,
  )
  await page.evaluate((expected) => {
    const button = [...document.querySelectorAll('button')].find(
      (candidate) => !candidate.disabled && (candidate.textContent?.trim() === expected || candidate.getAttribute('aria-label') === expected),
    )
    button?.click()
  }, label)
}

async function signIn(page, targetUrl) {
  if (!authEmail || !authPassword) {
    throw new QaBlockedError('R6-QA braucht FIELD_HUB_E2E_EMAIL und FIELD_HUB_E2E_PASSWORD.')
  }

  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await clickButton(page, 'Mehr')
  await clickButton(page, 'Einstellungen')
  await page.waitForSelector('input[type="email"]', { timeout: 20_000 })
  await page.type('input[type="email"]', authEmail)
  await page.type('input[type="password"]', authPassword)
  await clickButton(page, 'Einloggen')
  await page.waitForFunction(() => document.body.innerText.includes('Eingeloggt als'), { timeout: 30_000 })
}

async function inspectRoute(page, targetUrl, viewport, theme, route) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    isMobile: viewport.isMobile,
  })
  await page.evaluate((preference) => localStorage.setItem('fieldHub:themePreference', preference), theme)
  await page.reload({ waitUntil: 'networkidle2', timeout: 30_000 })
  await page.goto(`${targetUrl}${route.hash}`, { waitUntil: 'networkidle2', timeout: 30_000 })
  await page.waitForFunction(
    (expectedHash, expectedHeading) =>
      window.location.hash === expectedHash && document.body.innerText.includes(expectedHeading),
    { timeout: 20_000 },
    route.hash,
    route.heading,
  )

  const result = await page.evaluate((routeName, expectedTheme) => {
    const workspace = document.querySelector('.session-workspace')
    const primaryActions = document.querySelectorAll('.session-workspace-body .of-button-primary')
    const unitOptions = document.querySelectorAll('[aria-label="Einheit Unterbereiche"] button')
    return {
      theme: document.documentElement.dataset.theme,
      hasWorkspace: Boolean(workspace),
      primaryActionCount: primaryActions.length,
      unitOptionCount: unitOptions.length,
      noOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      hasTrainingOverflow: routeName !== 'training' || Boolean(document.querySelector('.training-toolbar-overflow')),
      hasPostCloseout: routeName !== 'post-session' || Boolean(document.querySelector('.post-session-sticky-closeout')),
      hasReturnerTasks: routeName !== 'returners' || document.body.innerText.includes('Returner-Aufgaben'),
      themeMatches: document.documentElement.dataset.theme === expectedTheme,
    }
  }, route.name, theme)

  if (!result.hasWorkspace || result.unitOptionCount !== 4 || result.primaryActionCount !== 1 || !result.noOverflow) {
    throw new Error(`${viewport.name}/${theme}/${route.name}: Einheit-Layoutvertrag verletzt.`)
  }
  if (!result.hasTrainingOverflow || !result.hasPostCloseout || !result.hasReturnerTasks || !result.themeMatches) {
    throw new Error(`${viewport.name}/${theme}/${route.name}: R6-spezifischer Zustand fehlt.`)
  }

  if (screenshotsEnabled) {
    const themeDir = resolve(screenshotsDir, theme)
    mkdirSync(themeDir, { recursive: true })
    await page.screenshot({ path: resolve(themeDir, `${viewport.name}-${route.name}.png`), fullPage: true })
  }

  return { viewport: viewport.name, theme, route: route.name }
}

async function main() {
  if (!existsSync(resolve(rootDir, 'dist/index.html'))) {
    throw new QaBlockedError('dist/index.html fehlt. Fuehre zuerst npm run build aus.')
  }
  if (screenshotsEnabled && !syntheticFixture) {
    throw new QaBlockedError('Screenshots sind nur mit FIELD_HUB_R6_SYNTHETIC_FIXTURE=1 erlaubt.')
  }

  const targetUrl = validateTarget(baseUrl)
  const preview = startPreviewIfNeeded()
  let browser
  try {
    await waitForServer(targetUrl)
    browser = await puppeteer.launch({ executablePath: chromeExecutablePath(), headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage()
    const browserErrors = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text())
    })
    await signIn(page, targetUrl)

    const checks = []
    for (const viewport of viewports) {
      for (const theme of themes) {
        for (const route of routes) {
          checks.push(await inspectRoute(page, targetUrl, viewport, theme, route))
        }
      }
    }

    if (browserErrors.length > 0) {
      throw new Error(`Browserfehler: ${browserErrors.join('; ')}`)
    }
    console.log(JSON.stringify({ ok: true, status: 'checked', screenshots: screenshotsEnabled, checks }, null, 2))
  } finally {
    await browser?.close().catch(() => browser?.process()?.kill('SIGKILL'))
    await stopProcess(preview)
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    status: error instanceof QaBlockedError ? 'blocked' : 'failed',
    reason: error.message,
  }, null, 2))
  process.exitCode = error instanceof QaBlockedError ? 2 : 1
})
