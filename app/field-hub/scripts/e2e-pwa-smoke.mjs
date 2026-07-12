import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultPort = process.env.FIELD_HUB_PWA_E2E_PORT ?? '5181'
const baseUrl = process.env.FIELD_HUB_PWA_E2E_BASE_URL ?? `http://127.0.0.1:${defaultPort}/`
const smokeRouteUrl = new URL('/pwa-offline-smoke', baseUrl).toString()

const viewports = [
  { name: 'iPhone small', width: 375, height: 667, isMobile: true },
  { name: 'iPhone large', width: 393, height: 852, isMobile: true },
  { name: 'Medium 744', width: 744, height: 1133, isMobile: true },
  { name: 'iPad portrait', width: 834, height: 1194, isMobile: true },
  { name: 'iPad landscape', width: 1194, height: 834, isMobile: false },
]

const lazyScreenViewports = viewports

const lazyScreenChecks = [
  {
    sectionLabel: 'Analyse',
    screenName: 'Analyse',
    expectedTexts: ['Analyse', 'Kernwerte mit Kontext'],
  },
  {
    sectionLabel: 'Mehr',
    subTabLabel: 'Bibliothek',
    screenName: 'Bibliothek',
    expectedTexts: ['Referenzbereich', 'Ruhiger Nachschlagebereich'],
  },
  {
    sectionLabel: 'Mehr',
    subTabLabel: 'Export & Backup',
    screenName: 'Export & Backup',
    expectedTexts: ['Coach-Login noetig', 'Import-Vorschau'],
  },
  {
    sectionLabel: 'Mehr',
    subTabLabel: 'Einstellungen',
    screenName: 'Einstellungen',
    expectedTexts: ['Synchronisierung', 'Geraet & Offline'],
  },
  {
    sectionLabel: 'Mehr',
    subTabLabel: 'Returner',
    screenName: 'Returner',
    expectedTexts: ['Returner-Caps und Verlauf', 'Coach-Login'],
  },
]

const routeSmokeChecks = [
  { hash: '#/today', expectedHash: '#/today', expectedText: 'Heute' },
  { hash: '#/unit/check-in', expectedHash: '#/unit/check-in', expectedText: 'Einheit / Check-in' },
  { hash: '#/unit/training', expectedHash: '#/unit/training', expectedText: 'Einheit / Training' },
  { hash: '#/unit/returners', expectedHash: '#/unit/returners', expectedText: 'Einheit / Returner' },
  { hash: '#/unit/post-session', expectedHash: '#/unit/post-session', expectedText: 'Einheit / Nachbereitung' },
  { hash: '#/players', expectedHash: '#/players', expectedText: 'Spieler' },
  { hash: '#/analysis', expectedHash: '#/analysis', expectedText: 'Analyse' },
  { hash: '#/more/library', expectedHash: '#/more/library', expectedText: 'Mehr / Bibliothek' },
  { hash: '#/more/export', expectedHash: '#/more/export', expectedText: 'Mehr / Export & Backup' },
  { hash: '#/more/settings', expectedHash: '#/more/settings', expectedText: 'Mehr / Einstellungen' },
  { hash: '#/more/returners', expectedHash: '#/more/returners', expectedText: 'Mehr / Returner' },
  { hash: '#/nachbereitung', expectedHash: '#/unit/post-session', expectedText: 'Einheit / Nachbereitung' },
  { hash: '#/bibliothek', expectedHash: '#/more/library', expectedText: 'Mehr / Bibliothek' },
  { hash: '#/returner', expectedHash: '#/unit/returners', expectedText: 'Einheit / Returner' },
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
  if (process.env.FIELD_HUB_PWA_E2E_BASE_URL) {
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

  child.stdout?.destroy()
  child.stderr?.destroy()
  child.unref()
}

async function closeBrowser(browser) {
  if (!browser) {
    return
  }

  let closed = false
  try {
    await Promise.race([
      browser.close().then(() => {
        closed = true
      }),
      new Promise((resolveTimer) => setTimeout(resolveTimer, 2_000)),
    ])
  } finally {
    if (!closed) {
      browser.process()?.kill('SIGKILL')
    }
  }
}

async function cleanupResources(browser, child) {
  await closeBrowser(browser)
  await stopChild(child)
}

async function waitForAppShell(page) {
  await page.waitForSelector('#root', { timeout: 20_000 })
  await page.waitForFunction(() => document.body.innerText.trim().length > 20, { timeout: 20_000 })
}

async function waitForCoachRoute(page, expectedHash, expectedText, contextLabel) {
  try {
    await page.waitForFunction(
      (routeHash, routeText) => {
        const bodyText = document.body.innerText.toLocaleLowerCase('de-AT')
        const hasRouteText = bodyText.includes(routeText.toLocaleLowerCase('de-AT'))
        const hasLazyError = Boolean(document.querySelector('.screen-load-state-error'))
        return window.location.hash === routeHash && hasRouteText && !hasLazyError
      },
      { timeout: 20_000 },
      expectedHash,
      expectedText,
    )
  } catch (error) {
    const diagnostics = await page.evaluate((routeText) => ({
      currentHash: window.location.hash,
      hasRouteText: document.body.innerText.toLocaleLowerCase('de-AT').includes(routeText.toLocaleLowerCase('de-AT')),
      screenError: document.querySelector('.screen-load-state-error')?.textContent?.trim() ?? null,
      textPreview: document.body.innerText.slice(0, 600),
    }), expectedText)

    throw new Error(
      `${contextLabel}: Coach-Route nicht vollstaendig geladen. Erwarteter Hash: ${expectedHash}, aktueller Hash: ${diagnostics.currentHash}. Erwarteter Text: ${expectedText}, gefunden: ${diagnostics.hasRouteText ? 'ja' : 'nein'}. Lazy-Fehler: ${diagnostics.screenError ?? 'nein'}. Sichtbarer Text: ${diagnostics.textPreview}`,
      { cause: error },
    )
  }
}

async function assertNoHorizontalOverflow(page, viewportName) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    throw new Error(
      `${viewportName}: horizontales Overflow (${overflow.scrollWidth}px > ${overflow.clientWidth}px).`,
    )
  }
}

async function assertBottomNavigationClearance(page, viewportName) {
  const bottomNav = await page.evaluate(() => {
    const element = document.querySelector('.bottom-tab-bar')
    if (!element) {
      return null
    }

    const rect = element.getBoundingClientRect()
    return { bottom: rect.bottom, height: rect.height, viewportHeight: window.innerHeight }
  })

  if (!bottomNav) {
    return
  }

  if (bottomNav.height < 44 || bottomNav.bottom > bottomNav.viewportHeight + 1) {
    throw new Error(`${viewportName}: Bottom Navigation ist nicht PWA-tauglich positioniert.`)
  }
}

async function assertKeyboardFocusVisible(page, viewportName) {
  for (let index = 0; index < 8; index += 1) {
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

  throw new Error(`${viewportName}: kein sichtbarer Keyboard-Fokus nach Tab-Navigation.`)
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

async function assertLazyScreensLoad(page, viewport) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    isMobile: viewport.isMobile,
  })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)

  for (const check of lazyScreenChecks) {
    await clickButtonByLabelOrText(page, check.sectionLabel, viewport.name)

    if (check.subTabLabel) {
      await clickButtonByLabelOrText(page, check.subTabLabel, viewport.name)
    }

    try {
      await page.waitForFunction(
        (expectedTexts) => {
          const bodyText = document.body.innerText.toLocaleLowerCase('de-AT')
          const hasScreenTexts = expectedTexts.every((text) => bodyText.includes(text.toLocaleLowerCase('de-AT')))
          const hasLazyError = Boolean(document.querySelector('.screen-load-state-error'))
          return hasScreenTexts && !hasLazyError
        },
        { timeout: 20_000 },
        check.expectedTexts,
      )
    } catch (error) {
      const diagnostics = await page.evaluate((expectedTexts) => {
        const bodyText = document.body.innerText
        const normalizedBodyText = bodyText.toLocaleLowerCase('de-AT')
        return {
          missingTexts: expectedTexts.filter((text) => !normalizedBodyText.includes(text.toLocaleLowerCase('de-AT'))),
          screenError: document.querySelector('.screen-load-state-error')?.textContent?.trim() ?? null,
          textPreview: bodyText.slice(0, 600),
        }
      }, check.expectedTexts)

      throw new Error(
        `${viewport.name}: ${check.screenName} wurde nicht vollstaendig geladen. Fehlende Texte: ${diagnostics.missingTexts.join(
          ', ',
        ) || 'keine'}. Lazy-Fehler: ${diagnostics.screenError ?? 'nein'}. Sichtbarer Text: ${diagnostics.textPreview}`,
        { cause: error },
      )
    }

    const hasLazyError = await page.evaluate(() => Boolean(document.querySelector('.screen-load-state-error')))
    if (hasLazyError) {
      throw new Error(`${viewport.name}: ${check.screenName} hat den Lazy-Fehlerzustand angezeigt.`)
    }
  }
}

async function assertCoachRouteDeepLinks(page, viewport) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    isMobile: viewport.isMobile,
  })

  for (const check of routeSmokeChecks) {
    await page.goto(`${baseUrl}${check.hash}`, { waitUntil: 'networkidle2', timeout: 30_000 })
    await waitForAppShell(page)
    await waitForCoachRoute(page, check.expectedHash, check.expectedText, `${viewport.name}: ${check.hash}`)
  }
}

async function assertCoachRouteHistory(page, viewport) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    isMobile: viewport.isMobile,
  })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)

  await clickButtonByLabelOrText(page, 'Einheit', viewport.name)
  await clickButtonByLabelOrText(page, 'Training', viewport.name)
  await waitForCoachRoute(page, '#/unit/training', 'Einheit / Training', `${viewport.name}: Training route`)

  await clickButtonByLabelOrText(page, 'Mehr', viewport.name)
  await clickButtonByLabelOrText(page, 'Einstellungen', viewport.name)
  await waitForCoachRoute(page, '#/more/settings', 'Mehr / Einstellungen', `${viewport.name}: Settings route`)

  await page.goBack({ waitUntil: 'domcontentloaded' })
  await waitForCoachRoute(page, '#/more/library', 'Mehr / Bibliothek', `${viewport.name}: history back to more default`)

  await page.goBack({ waitUntil: 'domcontentloaded' })
  await waitForCoachRoute(page, '#/unit/training', 'Einheit / Training', `${viewport.name}: history back to unit`)

  await page.goForward({ waitUntil: 'domcontentloaded' })
  await waitForCoachRoute(page, '#/more/library', 'Mehr / Bibliothek', `${viewport.name}: history forward to more default`)

  await page.goForward({ waitUntil: 'domcontentloaded' })
  await waitForCoachRoute(page, '#/more/settings', 'Mehr / Einstellungen', `${viewport.name}: history forward to settings`)
}

async function prepareServiceWorker(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker API nicht verfuegbar.')
    }

    await navigator.serviceWorker.ready
  })
  await page.reload({ waitUntil: 'networkidle2', timeout: 30_000 })
}

async function assertOfflineFallback(page) {
  await prepareServiceWorker(page)
  await page.setOfflineMode(true)

  try {
    await page.goto(smokeRouteUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await waitForAppShell(page)

    const bodyText = await page.evaluate(() => document.body.innerText)
    if (/this site can.t be reached|err_internet_disconnected/i.test(bodyText)) {
      throw new Error('Browser-Offline-Fehlerseite statt App-Shell.')
    }
  } finally {
    await page.setOfflineMode(false)
  }
}

async function main() {
  if (!existsSync(resolve(rootDir, 'dist/index.html'))) {
    throw new Error('dist/index.html fehlt. Fuehre vor dem PWA-Smoke npm run build aus.')
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

    for (const viewport of viewports) {
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 2,
        isMobile: viewport.isMobile,
      })
      await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
      await waitForAppShell(page)
      await assertNoHorizontalOverflow(page, viewport.name)
      await assertBottomNavigationClearance(page, viewport.name)
      await assertKeyboardFocusVisible(page, viewport.name)
    }

    for (const viewport of lazyScreenViewports) {
      await assertLazyScreensLoad(page, viewport)
    }

    for (const viewport of lazyScreenViewports) {
      await assertCoachRouteDeepLinks(page, viewport)
      await assertCoachRouteHistory(page, viewport)
    }

    await assertOfflineFallback(page)

    const browserErrors = consoleMessages.filter(
      (message) =>
        message.startsWith('pageerror:') ||
        (message.startsWith('error:') && !message.includes('Download the React DevTools')),
    )
    if (browserErrors.length > 0) {
      throw new Error(`Browser-Konsole enthaelt Fehler: ${browserErrors.join('\n')}`)
    }
    if (consoleMessages.length > 0 && process.env.FIELD_HUB_E2E_VERBOSE === '1') {
      console.warn(consoleMessages.join('\n'))
    }

    console.log(
      `PWA smoke passed for ${viewports.map((viewport) => viewport.name).join(', ')}; lazy screens passed for ${lazyScreenViewports
        .map((viewport) => viewport.name)
        .join(', ')}; coach route deep links and history passed for ${lazyScreenViewports
        .map((viewport) => viewport.name)
        .join(', ')}.`,
    )
  } finally {
    await Promise.race([cleanupResources(browser, previewServer), new Promise((resolveTimer) => setTimeout(resolveTimer, 3_000))])
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
