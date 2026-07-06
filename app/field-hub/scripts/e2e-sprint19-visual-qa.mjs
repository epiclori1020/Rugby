import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultPort = process.env.FIELD_HUB_SPRINT19_E2E_PORT ?? '5182'
const baseUrl = process.env.FIELD_HUB_SPRINT19_E2E_BASE_URL ?? `http://127.0.0.1:${defaultPort}/`
const screenshotsEnabled = process.env.FIELD_HUB_SPRINT19_SCREENSHOTS === '1'
const requireAuth = process.env.FIELD_HUB_SPRINT19_REQUIRE_AUTH === '1'
const screenshotsDir = resolve(rootDir, 'ux-audit-screenshots')

const authEmail = process.env.FIELD_HUB_E2E_EMAIL
const authPassword = process.env.FIELD_HUB_E2E_PASSWORD

class QaBlockedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'QaBlockedError'
  }
}

const viewports = [
  { name: 'iphone-small', label: 'iPhone small', width: 375, height: 667, isMobile: true },
  { name: 'iphone-large', label: 'iPhone large', width: 393, height: 852, isMobile: true },
  { name: 'ipad-portrait', label: 'iPad portrait', width: 834, height: 1194, isMobile: true },
  { name: 'ipad-landscape', label: 'iPad landscape', width: 1194, height: 834, isMobile: false },
]

const screenChecks = [
  {
    name: 'Heute',
    navigate: async () => undefined,
    expectedTexts: ['Heute', 'Tageslage, offene Aufgaben und schnelle Einstiege.'],
  },
  {
    name: 'Einheit / Check-in',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Einheit', 'Einheit / Check-in')
      await clickButtonByLabelOrText(page, 'Check-in', 'Einheit / Check-in')
    },
    expectedTexts: ['Einheit / Check-in', 'Anwesenheit, Belastbarkeit'],
  },
  {
    name: 'Einheit / Training',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Einheit', 'Einheit / Training')
      await clickButtonByLabelOrText(page, 'Training', 'Einheit / Training')
    },
    expectedTexts: ['Einheit / Training', 'Timeline, Varianten'],
  },
  {
    name: 'Einheit / Nachbereitung',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Einheit', 'Einheit / Nachbereitung')
      await clickButtonByLabelOrText(page, 'Nachbereitung', 'Einheit / Nachbereitung')
    },
    expectedTexts: ['Einheit / Nachbereitung', 'sRPE, Pain, E2'],
  },
  {
    name: 'Spieler',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Spieler', 'Spieler')
    },
    expectedTexts: ['Spieler', 'Stammdaten, Status, Consent'],
  },
  {
    name: 'Analyse',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Analyse', 'Analyse')
    },
    expectedTexts: ['Analyse', 'Rueckblick, Trends und Quellen'],
  },
  {
    name: 'Mehr / Bibliothek',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Mehr', 'Mehr / Bibliothek')
      await clickButtonByLabelOrText(page, 'Bibliothek', 'Mehr / Bibliothek')
    },
    expectedTexts: ['Mehr / Bibliothek', 'Coach-Skripte, Varianten'],
  },
  {
    name: 'Mehr / Export & Backup',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Mehr', 'Mehr / Export & Backup')
      await clickButtonByLabelOrText(page, 'Export & Backup', 'Mehr / Export & Backup')
    },
    expectedTexts: ['Mehr / Export & Backup', 'JSON-Backup, CSV-Dateien'],
  },
  {
    name: 'Mehr / Einstellungen',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Mehr', 'Mehr / Einstellungen')
      await clickButtonByLabelOrText(page, 'Einstellungen', 'Mehr / Einstellungen')
    },
    expectedTexts: ['Mehr / Einstellungen', 'Account, Sync, Backup'],
  },
]

const forbiddenVisibleTexts = [
  'Copy previous player',
  'Apply to present',
  'Structured Exercise Result',
  'medizinische Freigabe',
  'RTP',
  'Return-to-Play',
]

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
      // Preview server is still starting.
    }
    await new Promise((resolveTimer) => setTimeout(resolveTimer, 250))
  }

  throw new Error(`Preview-Server nicht erreichbar: ${url}`)
}

function startPreviewIfNeeded() {
  if (process.env.FIELD_HUB_SPRINT19_E2E_BASE_URL) {
    return null
  }

  const useProcessGroup = process.platform !== 'win32'
  const child = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', defaultPort], {
    cwd: rootDir,
    detached: useProcessGroup,
    env: process.env,
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

async function stopChild(child) {
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

async function waitForAppShell(page) {
  await page.waitForSelector('#root', { timeout: 20_000 })
  await page.waitForFunction(() => document.body.innerText.trim().length > 20, { timeout: 20_000 })
}

async function clickButtonByLabelOrText(page, label, contextLabel) {
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

  const clicked = await page.evaluate((buttonLabel) => {
    const button = [...document.querySelectorAll('button')].find(
      (candidate) =>
        !candidate.disabled &&
        (candidate.getAttribute('aria-label') === buttonLabel || candidate.textContent?.trim() === buttonLabel),
    )
    button?.click()
    return Boolean(button)
  }, label)

  if (!clicked) {
    throw new Error(`${contextLabel}: Button nicht gefunden: ${label}`)
  }
}

async function assertExpectedTexts(page, expectedTexts, contextLabel) {
  try {
    await page.waitForFunction(
      (texts) => {
        const bodyText = document.body.innerText.toLocaleLowerCase('de-AT')
        return texts.every((text) => bodyText.includes(text.toLocaleLowerCase('de-AT')))
      },
      { timeout: 20_000 },
      expectedTexts,
    )
  } catch (error) {
    const diagnostics = await page.evaluate((texts) => {
      const bodyText = document.body.innerText
      const normalizedBodyText = bodyText.toLocaleLowerCase('de-AT')
      return {
        missingTexts: texts.filter((text) => !normalizedBodyText.includes(text.toLocaleLowerCase('de-AT'))),
        textPreview: bodyText.slice(0, 800),
      }
    }, expectedTexts)

    throw new Error(
      `${contextLabel}: erwartete Texte fehlen: ${diagnostics.missingTexts.join(', ')}. Sichtbarer Text: ${diagnostics.textPreview}`,
      { cause: error },
    )
  }
}

async function assertNoHorizontalOverflow(page, contextLabel) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    throw new Error(`${contextLabel}: horizontales Overflow (${overflow.scrollWidth}px > ${overflow.clientWidth}px).`)
  }
}

async function assertBottomNavigation(page, contextLabel) {
  const bottomNav = await page.evaluate(() => {
    const element = document.querySelector('.bottom-tab-bar')
    if (!element) {
      return null
    }

    const rect = element.getBoundingClientRect()
    const buttons = [...element.querySelectorAll('button')].map((button) => {
      const buttonRect = button.getBoundingClientRect()
      return {
        label: button.getAttribute('aria-label') ?? button.textContent?.trim() ?? 'button',
        height: buttonRect.height,
        width: buttonRect.width,
      }
    })
    return { bottom: rect.bottom, buttons, height: rect.height, viewportHeight: window.innerHeight }
  })

  if (!bottomNav) {
    return
  }

  if (bottomNav.height < 44 || bottomNav.bottom > bottomNav.viewportHeight + 1) {
    throw new Error(`${contextLabel}: Bottom Navigation ist nicht PWA-tauglich positioniert.`)
  }

  const undersizedButtons = bottomNav.buttons.filter((button) => button.height < 44 || button.width < 44)
  if (undersizedButtons.length > 0) {
    throw new Error(
      `${contextLabel}: Bottom Navigation Touch Targets zu klein: ${undersizedButtons
        .map((button) => `${button.label} ${Math.round(button.width)}x${Math.round(button.height)}`)
        .join(', ')}`,
    )
  }
}

async function assertKeyboardFocusVisible(page, contextLabel) {
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press('Tab')
    const hasVisibleFocus = await page.evaluate(() => {
      const activeElement = document.activeElement
      if (!activeElement || activeElement === document.body) {
        return false
      }

      const style = window.getComputedStyle(activeElement)
      const outlineWidth = Number.parseFloat(style.outlineWidth)
      return style.outlineStyle !== 'none' && outlineWidth >= 2
    })

    if (hasVisibleFocus) {
      return
    }
  }

  throw new Error(`${contextLabel}: kein sichtbarer Keyboard-Fokus nach Tab-Navigation.`)
}

async function assertNoForbiddenCopy(page, contextLabel) {
  const found = await page.evaluate((forbiddenTexts) => {
    const bodyText = document.body.innerText
    return forbiddenTexts.filter((text) => bodyText.includes(text))
  }, forbiddenVisibleTexts)

  if (found.length > 0) {
    throw new Error(`${contextLabel}: verbotene oder alte Copy sichtbar: ${found.join(', ')}`)
  }
}

async function captureScreenshot(page, viewport, screenName) {
  if (!screenshotsEnabled) {
    return null
  }

  mkdirSync(screenshotsDir, { recursive: true })
  const filename = `${viewport.name}__${screenName
    .toLocaleLowerCase('de-AT')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}.png`
  const path = resolve(screenshotsDir, filename)
  await page.screenshot({ path, fullPage: true })
  return path
}

async function runScreenMatrix(page, viewport) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    isMobile: viewport.isMobile,
  })

  const checkedScreens = []
  for (const screen of screenChecks) {
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
    await waitForAppShell(page)
    await screen.navigate(page)
    await assertExpectedTexts(page, screen.expectedTexts, `${viewport.label} / ${screen.name}`)
    await assertNoHorizontalOverflow(page, `${viewport.label} / ${screen.name}`)
    await assertBottomNavigation(page, `${viewport.label} / ${screen.name}`)
    await assertNoForbiddenCopy(page, `${viewport.label} / ${screen.name}`)
    const screenshotPath = await captureScreenshot(page, viewport, screen.name)
    checkedScreens.push({ screen: screen.name, screenshotPath })
  }

  await assertKeyboardFocusVisible(page, viewport.label)
  return checkedScreens
}

async function assertPublicCheckInErrorState(page) {
  await page.goto(new URL('/#/checkin/e2e-sprint19-invalid-token', baseUrl).toString(), {
    waitUntil: 'networkidle2',
    timeout: 30_000,
  })
  await assertExpectedTexts(page, ['Training Check-in', 'Check-in-Link'], 'Public Check-in error state')
  await assertNoHorizontalOverflow(page, 'Public Check-in error state')
}

async function assertLazyLoadErrorState(browser) {
  const page = await browser.newPage()
  await page.setCacheEnabled(false)
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)

  let abortedLazyScript = false
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const url = request.url()
    if (!abortedLazyScript && request.resourceType() === 'script' && url.includes('/assets/')) {
      abortedLazyScript = true
      request.abort()
      return
    }
    request.continue()
  })

  await clickButtonByLabelOrText(page, 'Analyse', 'Lazy error state')
  await new Promise((resolveTimer) => setTimeout(resolveTimer, 1_000))
  if (!abortedLazyScript) {
    await page.close()
    return { status: 'skipped', reason: 'Lazy chunk was already loaded or preloaded before request interception.' }
  }
  await assertExpectedTexts(page, ['Analyse konnte nicht geladen werden.', 'App neu laden'], 'Lazy error state')
  await page.close()
  return { status: 'checked' }
}

async function runSignedInSmoke(page) {
  if (!authEmail || !authPassword) {
    if (requireAuth) {
      return { status: 'blocked', reason: 'FIELD_HUB_E2E_EMAIL und FIELD_HUB_E2E_PASSWORD fehlen.' }
    }
    return { status: 'skipped', reason: 'FIELD_HUB_E2E_EMAIL/FIELD_HUB_E2E_PASSWORD nicht gesetzt.' }
  }

  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)
  await clickButtonByLabelOrText(page, 'Mehr', 'Signed-in smoke')
  await clickButtonByLabelOrText(page, 'Einstellungen', 'Signed-in smoke')
  await page.waitForSelector('input[type="email"]', { timeout: 20_000 })
  await page.type('input[type="email"]', authEmail)
  await page.type('input[type="password"]', authPassword)
  await clickButtonByLabelOrText(page, 'Einloggen', 'Signed-in smoke')
  await assertExpectedTexts(page, ['Coach-Session', 'Eingeloggt als'], 'Signed-in smoke')
  await clickButtonByLabelOrText(page, 'Spieler', 'Signed-in player profile smoke')
  await assertExpectedTexts(page, ['Kader', 'Spieler'], 'Signed-in player profile smoke')
  await assertNoHorizontalOverflow(page, 'Signed-in player profile smoke')

  return { status: 'checked' }
}

async function main() {
  if (!existsSync(resolve(rootDir, 'dist/index.html'))) {
    throw new Error('dist/index.html fehlt. Fuehre vor dem Sprint-19-Smoke npm run build aus.')
  }
  if (requireAuth && (!authEmail || !authPassword)) {
    throw new QaBlockedError('FIELD_HUB_E2E_EMAIL und FIELD_HUB_E2E_PASSWORD fehlen.')
  }

  const previewServer = startPreviewIfNeeded()
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
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) {
        consoleMessages.push(`${message.type()}: ${message.text()}`)
      }
    })
    page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`))

    const lazyError = await assertLazyLoadErrorState(browser)
    const screenResults = []
    for (const viewport of viewports) {
      screenResults.push({ viewport: viewport.label, screens: await runScreenMatrix(page, viewport) })
    }
    await assertPublicCheckInErrorState(page)
    const signedIn = await runSignedInSmoke(page)
    if (signedIn.status === 'blocked') {
      throw new QaBlockedError(signedIn.reason)
    }

    const browserErrors = consoleMessages.filter(
      (message) =>
        message.startsWith('pageerror:') ||
        (message.startsWith('error:') && !message.includes('Download the React DevTools')),
    )
    if (browserErrors.length > 0) {
      throw new Error(`Browser-Konsole enthaelt Fehler: ${browserErrors.join('\n')}`)
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          screenshots: screenshotsEnabled ? screenshotsDir : 'disabled',
          signedIn,
          lazyError,
          viewports: screenResults.map((result) => ({
            viewport: result.viewport,
            screenCount: result.screens.length,
          })),
        },
        null,
        2,
      ),
    )
  } finally {
    if (browser) {
      await browser.close()
    }
    await stopChild(previewServer)
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
    process.exitCode = 1
    return
  }
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
