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
  { name: 'iPad portrait', width: 834, height: 1194, isMobile: true },
  { name: 'iPad landscape', width: 1194, height: 834, isMobile: false },
]

const lazyScreenViewports = [
  { name: 'iPhone small lazy screens', width: 375, height: 667, isMobile: true },
  { name: 'iPad landscape lazy screens', width: 1194, height: 834, isMobile: false },
]

const lazyScreenChecks = [
  {
    sectionLabel: 'Analyse',
    screenName: 'Analyse',
    expectedTexts: ['Filter einstellen', 'Kernwerte mit Kontext'],
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
}

async function waitForAppShell(page) {
  await page.waitForSelector('#root', { timeout: 20_000 })
  await page.waitForFunction(() => document.body.innerText.trim().length > 20, { timeout: 20_000 })
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

    await assertOfflineFallback(page)

    if (consoleMessages.length > 0 && process.env.FIELD_HUB_E2E_VERBOSE === '1') {
      console.warn(consoleMessages.join('\n'))
    }

    console.log(
      `PWA smoke passed for ${viewports.map((viewport) => viewport.name).join(', ')}; lazy screens passed for ${lazyScreenViewports
        .map((viewport) => viewport.name)
        .join(', ')}.`,
    )
  } finally {
    if (browser) {
      await browser.close()
    }
    await stopChild(previewServer)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
