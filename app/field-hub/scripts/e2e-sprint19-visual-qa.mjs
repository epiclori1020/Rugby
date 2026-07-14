import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(rootDir, '../..')
const defaultPort = process.env.FIELD_HUB_SPRINT19_E2E_PORT ?? '5182'
const target = resolveSprint19Target(
  process.env.FIELD_HUB_SPRINT19_E2E_BASE_URL ?? `http://127.0.0.1:${defaultPort}/`,
  process.env.FIELD_HUB_SPRINT19_E2E_AUTH_ORIGIN,
)
const baseUrl = target.url
const requireAuth = process.env.FIELD_HUB_SPRINT19_REQUIRE_AUTH === '1'
const screenshotsRequested = process.env.FIELD_HUB_SPRINT19_SCREENSHOTS === '1'
const screenshotsEnabled = screenshotsRequested && !requireAuth
const screenshotsDir = resolve(repoRoot, '.tmp/onfield-qa/r10/after')

const authEmail = process.env.FIELD_HUB_E2E_EMAIL
const authPassword = process.env.FIELD_HUB_E2E_PASSWORD
const themes = ['light', 'dark']

class QaBlockedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'QaBlockedError'
  }
}

export function resolveSprint19Target(rawBaseUrl, allowedAuthOrigin) {
  let url
  try {
    url = new URL(rawBaseUrl)
  } catch {
    throw new QaBlockedError('FIELD_HUB_SPRINT19_E2E_BASE_URL ist keine gueltige URL.')
  }

  if (url.username || url.password) {
    throw new QaBlockedError('Sprint-19-QA-Ziel darf keine Zugangsdaten in der URL enthalten.')
  }

  const isLoopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  if (!isLoopback) {
    if (url.protocol !== 'https:') {
      throw new QaBlockedError('Remote Sprint-19-QA-Ziele muessen HTTPS verwenden.')
    }

    let allowedOrigin
    try {
      allowedOrigin = allowedAuthOrigin ? new URL(allowedAuthOrigin).origin : null
    } catch {
      throw new QaBlockedError('FIELD_HUB_SPRINT19_E2E_AUTH_ORIGIN ist keine gueltige Origin.')
    }
    if (!allowedOrigin || allowedOrigin !== url.origin) {
      throw new QaBlockedError(
        'Remote Sprint-19-QA-Ziel ist nicht freigegeben. Setze FIELD_HUB_SPRINT19_E2E_AUTH_ORIGIN auf die exakte HTTPS-Origin.',
      )
    }
  }

  const safeLogUrl = new URL(url)
  safeLogUrl.search = ''
  safeLogUrl.hash = ''
  return { url: url.href, logUrl: safeLogUrl.href }
}

export function enforceScreenshotPolicy(authRequired, requested) {
  if (authRequired && requested) {
    throw new QaBlockedError('Authentifizierte QA darf keine Screenshots mit potenziellen Accountdaten persistieren.')
  }
}

const viewports = [
  { name: 'iphone-small', label: 'iPhone small', width: 375, height: 667, isMobile: true },
  { name: 'iphone-large', label: 'iPhone large', width: 393, height: 852, isMobile: true },
  { name: 'medium-744', label: 'Medium 744', width: 744, height: 1133, isMobile: true },
  { name: 'ipad-portrait', label: 'iPad portrait', width: 834, height: 1194, isMobile: true },
  { name: 'ipad-landscape', label: 'iPad landscape', width: 1194, height: 834, isMobile: false },
]

const screenChecks = [
  {
    name: 'Heute',
    navigate: async () => undefined,
    expectedTexts: ['Squad heute'],
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
    name: 'Einheit / Returner',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Einheit', 'Einheit / Returner')
      await clickButtonByLabelOrText(page, 'Returner', 'Einheit / Returner')
    },
    expectedTexts: ['Einheit / Returner', 'Caps, Reaktionen und Hinweise'],
  },
  {
    name: 'Einheit / Nachbereitung',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Einheit', 'Einheit / Nachbereitung')
      await clickButtonByLabelOrText(page, 'Nachbereitung', 'Einheit / Nachbereitung')
    },
    expectedTexts: ['Einheit / Nachbereitung', 'sRPE, Beschwerden, E2'],
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
    expectedTexts: ['Analyse', 'Kernwerte mit Kontext', 'Belastung und Dosierung im Verlauf'],
  },
  {
    name: 'Mehr / Bibliothek',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Mehr', 'Mehr / Bibliothek')
      await clickButtonByLabelOrText(page, 'Bibliothek', 'Mehr / Bibliothek')
    },
    expectedTexts: ['Referenzbereich', 'Ruhiger Nachschlagebereich'],
  },
  {
    name: 'Mehr / Export & Backup',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Mehr', 'Mehr / Export & Backup')
      await clickButtonByLabelOrText(page, 'Export & Backup', 'Mehr / Export & Backup')
    },
    expectedTexts: ['Export und Backup', 'Komplettes Backup herunterladen', 'CSV-Auswahl öffnen', 'Import-Vorschau'],
  },
  {
    name: 'Mehr / Einstellungen',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Mehr', 'Mehr / Einstellungen')
      await clickButtonByLabelOrText(page, 'Einstellungen', 'Mehr / Einstellungen')
    },
    expectedTexts: ['Synchronisierung', 'Gerät & Offline'],
  },
  {
    name: 'Mehr / Returner',
    navigate: async (page) => {
      await clickButtonByLabelOrText(page, 'Mehr', 'Mehr / Returner')
      await clickButtonByLabelOrText(page, 'Returner', 'Mehr / Returner')
    },
    expectedTexts: ['Mehr / Returner', 'Caps, Reaktionen und nächste Coaching-Schritte'],
  },
]

const forbiddenVisibleTexts = [
  'Copy previous player',
  'Apply to present',
  'Structured Exercise Result',
  'Retry',
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

  throw new Error(`Preview-Server nicht erreichbar: ${target.logUrl}`)
}

function startPreviewIfNeeded() {
  if (process.env.FIELD_HUB_SPRINT19_E2E_BASE_URL) {
    return null
  }

  const childEnv = { ...process.env }
  delete childEnv.FIELD_HUB_E2E_EMAIL
  delete childEnv.FIELD_HUB_E2E_PASSWORD
  const useProcessGroup = process.platform !== 'win32'
  const child = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', defaultPort], {
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

async function assertSignatureArtwork(page, contextLabel) {
  const backgroundImage = await page.$eval(
    '.brand-surface-artwork-texture',
    (element) => getComputedStyle(element).backgroundImage,
  )
  if (!backgroundImage.includes('onfield-signature')) {
    throw new Error(`${contextLabel}: Signature-Artwork fehlt im berechneten Background.`)
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
    if (window.innerWidth >= 840) {
      return null
    }
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
    const main = document.querySelector('.shell-main')
    const mainPaddingBottom = main ? Number.parseFloat(getComputedStyle(main).paddingBottom) : 0
    const stickyCollisions = [...document.querySelectorAll('.post-session-sticky-closeout')]
      .filter((candidate) => {
        const candidateRect = candidate.getBoundingClientRect()
        const intersectsViewport = candidateRect.top < window.innerHeight && candidateRect.bottom > 0
        return (
          candidateRect.width > 0 &&
          candidateRect.height > 0 &&
          intersectsViewport &&
          candidateRect.bottom > rect.top + 1
        )
      })
      .map((candidate) => candidate.className)
    return {
      bottom: rect.bottom,
      buttons,
      height: rect.height,
      mainPaddingBottom,
      stickyCollisions,
      viewportHeight: window.innerHeight,
    }
  })

  if (!bottomNav) {
    return
  }

  if (bottomNav.height < 44 || bottomNav.bottom > bottomNav.viewportHeight + 1) {
    throw new Error(`${contextLabel}: Bottom Navigation ist nicht PWA-tauglich positioniert.`)
  }
  if (bottomNav.mainPaddingBottom + 1 < bottomNav.height) {
    throw new Error(`${contextLabel}: Content-Clearance ist kleiner als die Bottom Navigation.`)
  }
  if (bottomNav.stickyCollisions.length > 0) {
    throw new Error(`${contextLabel}: Sticky Action ueberlappt die Bottom Navigation.`)
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

async function setTheme(page, theme) {
  await page.evaluate((preference) => localStorage.setItem('fieldHub:themePreference', preference), theme)
  await page.reload({ waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)
  const appliedTheme = await page.evaluate(() => document.documentElement.dataset.theme)
  if (appliedTheme !== theme) {
    throw new Error(`Theme ${theme} wurde nicht stabil angewendet (aktuell: ${appliedTheme ?? 'unset'}).`)
  }
}

async function assertRenderedContrast(page, contextLabel) {
  const failures = await page.evaluate(() => {
    const textSelectors =
      'h1, h2, h3, h4, h5, h6, p, span, small, strong, label, li, dt, dd, button, a, input, select, textarea, [role="status"], [role="alert"]'
    const primaryControlSelectors = new Set([
      '.of-button-primary',
      '.nav-button.active',
      '.of-segmented-option[aria-pressed="true"]',
    ])
    const resolvedTheme = document.documentElement.dataset.theme
    const parseColor = (value) => {
      const parts = value.match(/[\d.]+/g)?.map(Number) ?? []
      return parts.length >= 3 ? { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 } : null
    }
    const luminance = (color) => {
      const channel = (value) => {
        const normalized = value / 255
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
    }
    const composite = (foreground, background) => {
      const alpha = foreground.a + background.a * (1 - foreground.a)
      if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 }
      return {
        r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
        g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
        b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
        a: alpha,
      }
    }
    const effectiveBackground = (element) => {
      const layers = []
      let current = element
      while (current) {
        const color = parseColor(getComputedStyle(current).backgroundColor)
        if (color && color.a > 0) layers.push(color)
        current = current.parentElement
      }
      return layers
        .reverse()
        .reduce((background, foreground) => composite(foreground, background), { r: 255, g: 255, b: 255, a: 1 })
    }
    const results = []
    for (const element of [...document.querySelectorAll(textSelectors)].slice(0, 800)) {
      const rect = element.getBoundingClientRect()
      const hasText = Boolean(element.textContent?.trim()) || ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)
      if (
        !hasText ||
        rect.width <= 1 ||
        rect.height <= 1 ||
        element.matches(':disabled') ||
        element.closest('[aria-hidden="true"]') ||
        element.classList.contains('sr-only')
      ) {
        continue
      }
      const foreground = parseColor(getComputedStyle(element).color)
      const background = effectiveBackground(element)
      if (!foreground) continue
      const lighter = Math.max(luminance(foreground), luminance(background))
      const darker = Math.min(luminance(foreground), luminance(background))
      const ratio = (lighter + 0.05) / (darker + 0.05)
      const isPrimaryControl = [...primaryControlSelectors].some((selector) => element.matches(selector))
      const requiredRatio = resolvedTheme === 'dark' && isPrimaryControl ? 7 : 4.5
      if (ratio < requiredRatio) {
        results.push({
          selector: `${element.tagName.toLocaleLowerCase()}${element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : ''}`,
          ratio: Number(ratio.toFixed(2)),
          requiredRatio: resolvedTheme === 'dark' && isPrimaryControl ? 7 : 4.5,
          foreground: getComputedStyle(element).color,
          background: getComputedStyle(element).backgroundColor,
          effectiveBackground: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
          label: element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 60) ?? '',
        })
      }
    }
    return results
  })

  if (failures.length > 0) {
    throw new Error(
      `${contextLabel}: gerenderter Kontrast unter Zielwert: ${failures
        .map(
          (failure) =>
            `${failure.selector} ${failure.ratio}:1 < ${failure.requiredRatio}:1 (${failure.foreground} on ${failure.effectiveBackground}; own ${failure.background}, ${failure.label})`,
        )
        .join(', ')}`,
    )
  }
}

async function assertKioskFieldMode(page) {
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true })
  await page.evaluate(() => localStorage.setItem('fieldHub:themePreference', 'light'))
  await page.goto(new URL('/#/unit/check-in', baseUrl).toString(), {
    waitUntil: 'networkidle2',
    timeout: 30_000,
  })
  await waitForAppShell(page)
  await clickButtonByLabelOrText(page, 'Kiosk starten', 'Kiosk Field Mode')
  await assertExpectedTexts(page, ['Training Check-in', 'Coach-Modus'], 'Kiosk Field Mode')

  let checkedKioskSurfaces = 0
  for (const viewport of [viewports[1], viewports[3]]) {
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 2,
      isMobile: viewport.isMobile,
    })
    for (const theme of themes) {
      await page.evaluate((resolvedTheme) => {
        document.documentElement.dataset.theme = resolvedTheme
        document.documentElement.dataset.themePreference = resolvedTheme
      }, theme)
      await page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))))
      const contextLabel = `Kiosk Field Mode / ${viewport.label} / ${theme}`
      await assertExpectedTexts(page, ['Training Check-in', 'Coach-Modus'], contextLabel)
      await assertSignatureArtwork(page, contextLabel)
      await assertNoHorizontalOverflow(page, contextLabel)
      await assertRenderedContrast(page, contextLabel)
      await captureScreenshot(page, viewport, theme, 'Kiosk')
      checkedKioskSurfaces += 1
    }
  }

  await page.evaluate(() => localStorage.removeItem('fieldHub:kioskSessionId'))
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)

  return checkedKioskSurfaces
}

async function assertR8ResponsiveContracts(page, viewport, contextLabel) {
  const failures = await page.evaluate((width) => {
    const visible = (selector) => {
      const element = document.querySelector(selector)
      if (!element) return false
      const style = getComputedStyle(element)
      return style.display !== 'none' && element.getBoundingClientRect().width > 0
    }
    const problems = []
    if (document.querySelector('.analysis-layout')) {
      if (document.querySelector('.analysis-table, .analysis-table-wrap')) problems.push('legacy analysis table present')
      if (width < 600 && !visible('.analysis-compact-filter-trigger')) problems.push('compact filter trigger missing')
      if (width < 600 && visible('.analysis-filter-panel-expanded')) problems.push('desktop filters visible on compact')
      if (width >= 600 && !visible('.analysis-filter-panel-expanded')) problems.push('filter panel missing on medium/expanded')
      if (!document.querySelector('.analysis-trend-charts')) problems.push('R10 trend charts missing')
      if (document.querySelectorAll('.analysis-trend-charts svg[role="img"]').length !== 2) problems.push('R10 chart accessibility contract missing')
    }
    if (document.querySelector('.library-layout') && width < 600 && document.querySelector('.library-detail-pane')) {
      problems.push('library detail pane rendered on compact')
    }
    const moreNav = document.querySelector('.more-subnav .of-segmented-control')
    if (moreNav) {
      const columns = getComputedStyle(moreNav).gridTemplateColumns.split(' ').filter(Boolean).length
      const expectedColumns = width < 600 ? 2 : 4
      if (columns !== expectedColumns) problems.push(`more navigation has ${columns} instead of ${expectedColumns} columns`)
    }
    const settings = document.querySelector('.settings-utility-workspace')
    if (settings && settings.querySelectorAll('.of-button-primary').length !== 1) {
      problems.push('settings primary action count is not one')
    }
    const exportPanel = document.querySelector('.export-panel')
    if (exportPanel) {
      const csvDetails = exportPanel.querySelector('.export-csv-details')
      if (!exportPanel.querySelector('.export-backup-primary .of-button-primary')) problems.push('R10 full backup hierarchy missing')
      if (!csvDetails || csvDetails.hasAttribute('open')) problems.push('R10 CSV hierarchy is not default closed')
    }
    return problems
  }, viewport.width)

  if (failures.length > 0) {
    throw new Error(`${contextLabel}: R8-Layoutvertrag verletzt: ${failures.join(', ')}`)
  }
}

async function captureScreenshot(page, viewport, theme, screenName) {
  if (!screenshotsEnabled) {
    return null
  }

  const themeDir = resolve(screenshotsDir, theme)
  mkdirSync(themeDir, { recursive: true })
  const filename = `${viewport.name}__${screenName
    .toLocaleLowerCase('de-AT')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}.png`
  const path = resolve(themeDir, filename)
  await page.screenshot({ path, fullPage: true })
  return path
}

async function runScreenMatrix(page, viewport, theme) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    isMobile: viewport.isMobile,
  })

  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)
  if (requireAuth) {
    await page.waitForSelector('.app-shell', { timeout: 20_000 })
  }
  await setTheme(page, theme)

  const checkedScreens = []
  for (const screen of screenChecks) {
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
    await waitForAppShell(page)
    if (requireAuth) {
      await page.waitForSelector('.app-shell', { timeout: 20_000 })
    }
    await screen.navigate(page)
    const contextLabel = `${viewport.label} / ${theme} / ${screen.name}`
    await assertExpectedTexts(page, screen.expectedTexts, contextLabel)
    await assertNoHorizontalOverflow(page, contextLabel)
    await assertBottomNavigation(page, contextLabel)
    await assertNoForbiddenCopy(page, contextLabel)
    await assertR8ResponsiveContracts(page, viewport, contextLabel)
    await assertRenderedContrast(page, contextLabel)
    const screenshotPath = await captureScreenshot(page, viewport, theme, screen.name)
    checkedScreens.push({ screen: screen.name, screenshotPath })
  }

  await assertKeyboardFocusVisible(page, `${viewport.label} / ${theme}`)
  return checkedScreens
}

async function runWelcomeMatrix(page, viewport, theme) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    isMobile: viewport.isMobile,
  })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)
  await setTheme(page, theme)

  const contextLabel = `${viewport.label} / ${theme} / Welcome`
  await assertExpectedTexts(page, ['Trainingstag vorbereiten', '1. Login', '3. Check-in öffnen'], contextLabel)
  await assertNoHorizontalOverflow(page, contextLabel)
  await assertNoForbiddenCopy(page, contextLabel)
  await assertRenderedContrast(page, contextLabel)
  const screenshotPath = await captureScreenshot(page, viewport, theme, 'Welcome')
  await assertKeyboardFocusVisible(page, contextLabel)
  return [{ screen: 'Welcome', screenshotPath }]
}

async function assertPublicCheckInErrorState(page, viewport, theme) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 2,
    isMobile: viewport.isMobile,
  })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)
  await setTheme(page, theme)
  await page.goto(new URL('/#/checkin/e2e-sprint19-invalid-token', baseUrl).toString(), {
    waitUntil: 'networkidle2',
    timeout: 30_000,
  })
  const contextLabel = `Public Check-in error state / ${viewport.label} / ${theme}`
  await assertExpectedTexts(page, ['Training Check-in', 'Check-in-Link'], contextLabel)
  const errorArtwork = await page.$eval('.brand-surface', (element) => ({
    hasNoneClass: element.classList.contains('brand-surface-artwork-none'),
    backgroundImage: getComputedStyle(element).backgroundImage,
  }))
  if (!errorArtwork.hasNoneClass || errorArtwork.backgroundImage.includes('onfield-signature')) {
    throw new Error(`${contextLabel}: Error-State darf kein Signature-Artwork tragen.`)
  }
  const errorText = await page.evaluate(() => document.body.innerText)
  if (errorText.includes('Link wird geprueft.') || errorText.includes('Know squad status before the whistle.')) {
    throw new Error(`${contextLabel}: Error-State zeigt widersprüchliche Loading-/Marketing-Copy.`)
  }
  await assertNoHorizontalOverflow(page, contextLabel)
  await assertRenderedContrast(page, contextLabel)
  await captureScreenshot(page, viewport, theme, 'Public Check-in Fehler')
}

async function assertLazyLoadErrorState(browser) {
  const page = await browser.newPage()
  await page.setBypassServiceWorker(true)
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

async function runSignedInSmoke(page, browser) {
  if (!authEmail || !authPassword) {
    if (requireAuth) {
      return { status: 'blocked', reason: 'FIELD_HUB_E2E_EMAIL und FIELD_HUB_E2E_PASSWORD fehlen.' }
    }
    return { status: 'skipped', reason: 'FIELD_HUB_E2E_EMAIL/FIELD_HUB_E2E_PASSWORD nicht gesetzt.' }
  }

  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)
  await page.waitForSelector('input[type="email"]', { timeout: 20_000 })
  await page.type('input[type="email"]', authEmail)
  await page.type('input[type="password"]', authPassword)
  await clickButtonByLabelOrText(page, 'Einloggen', 'Signed-in smoke')
  await page.waitForSelector('.app-shell', { timeout: 20_000 })
  await page.goto(new URL('/#/more/settings', baseUrl).toString(), { waitUntil: 'networkidle2', timeout: 30_000 })
  await assertExpectedTexts(page, ['Coach-Session', 'Eingeloggt als'], 'Signed-in smoke')
  let checkedScreens = 0
  for (const viewport of viewports) {
    for (const theme of themes) {
      checkedScreens += (await runScreenMatrix(page, viewport, theme)).length
    }
  }

  const checkedKioskSurfaces = await assertKioskFieldMode(page)
  const routeContracts = await assertSignedInRouteContracts(page)
  const offlineResume = await assertSignedInOfflineResume(browser)

  return { status: 'checked', checkedScreens, checkedKioskSurfaces, routeContracts, offlineResume }
}

async function assertSignedInOfflineResume(browser) {
  const offlinePage = await browser.newPage()
  try {
    await offlinePage.goto(new URL('#/today', baseUrl).toString(), { waitUntil: 'networkidle2', timeout: 30_000 })
    await offlinePage.evaluate(async () => {
      if (!('serviceWorker' in navigator)) throw new Error('Service Worker API fehlt.')
      await navigator.serviceWorker.ready
    })
    await offlinePage.reload({ waitUntil: 'networkidle2', timeout: 30_000 })
    await offlinePage.setOfflineMode(true)
    await offlinePage.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 })
    await offlinePage.waitForSelector('.app-shell', { timeout: 20_000 })
    await assertExpectedTexts(offlinePage, ['Squad heute'], 'Signed-in offline resume')
  } finally {
    await offlinePage.setOfflineMode(false)
    await offlinePage.close()
  }
  return { status: 'checked' }
}

async function waitForRoute(page, expectedHash, expectedText, contextLabel) {
  try {
    await page.waitForFunction(
      (hash, text) =>
        window.location.hash === hash &&
        document.body.innerText.toLocaleLowerCase('de-AT').includes(text.toLocaleLowerCase('de-AT')),
      { timeout: 20_000 },
      expectedHash,
      expectedText,
    )
  } catch (error) {
    const diagnostics = await page.evaluate(() => ({
      hash: window.location.hash,
      textPreview: document.body.innerText.slice(0, 600),
    }))
    throw new Error(`${contextLabel}: Route ${expectedHash} nicht stabil. ${JSON.stringify(diagnostics)}`, { cause: error })
  }
}

async function assertSignedInRouteContracts(page) {
  const deepLinks = [
    ['#/today', 'Squad heute'],
    ['#/unit/training', 'Einheit / Training'],
    ['#/players', 'Spieler'],
    ['#/analysis', 'Analyse'],
    ['#/more/settings', 'Einstellungen'],
  ]
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true })
  for (const [hash, text] of deepLinks) {
    await page.goto(new URL(hash, baseUrl).toString(), { waitUntil: 'networkidle2', timeout: 30_000 })
    await waitForAppShell(page)
    await waitForRoute(page, hash, text, `Signed-in deep link ${hash}`)
  }

  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
  await clickButtonByLabelOrText(page, 'Einheit', 'Signed-in history')
  await clickButtonByLabelOrText(page, 'Training', 'Signed-in history')
  await waitForRoute(page, '#/unit/training', 'Einheit / Training', 'Signed-in history training')
  await clickButtonByLabelOrText(page, 'Mehr', 'Signed-in history')
  await clickButtonByLabelOrText(page, 'Einstellungen', 'Signed-in history')
  await waitForRoute(page, '#/more/settings', 'Einstellungen', 'Signed-in history settings')
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await waitForRoute(page, '#/more/library', 'Referenzbereich', 'Signed-in history back to more')
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await waitForRoute(page, '#/unit/training', 'Einheit / Training', 'Signed-in history back to unit')
  await page.goForward({ waitUntil: 'domcontentloaded' })
  await waitForRoute(page, '#/more/library', 'Referenzbereich', 'Signed-in history forward to more')
  await page.goForward({ waitUntil: 'domcontentloaded' })
  await waitForRoute(page, '#/more/settings', 'Einstellungen', 'Signed-in history forward to settings')
  return { deepLinks: deepLinks.length, historyTransitions: 4 }
}

async function signOutAfterSmoke(page) {
  await page.goto(new URL('/#/more/settings', baseUrl).toString(), { waitUntil: 'networkidle2', timeout: 30_000 })
  await waitForAppShell(page)
  await clickButtonByLabelOrText(page, 'Logout', 'Signed-in cleanup')
  await assertExpectedTexts(page, ['Trainingstag vorbereiten', 'Coach-Login'], 'Signed-in cleanup')
}

async function main() {
  if (!existsSync(resolve(rootDir, 'dist/index.html'))) {
    throw new Error('dist/index.html fehlt. Fuehre vor dem Sprint-19-Smoke npm run build aus.')
  }
  if (requireAuth && (!authEmail || !authPassword)) {
    throw new QaBlockedError('FIELD_HUB_E2E_EMAIL und FIELD_HUB_E2E_PASSWORD fehlen.')
  }
  enforceScreenshotPolicy(requireAuth, screenshotsRequested)

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
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    const consoleMessages = []
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) {
        consoleMessages.push(`${message.type()}: ${message.text()}`)
      }
    })
    page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`))

    const screenResults = []
    let signedIn
    let lazyError
    if (requireAuth) {
      signedIn = await runSignedInSmoke(page, browser)
      if (signedIn.status === 'blocked') {
        throw new QaBlockedError(signedIn.reason)
      }
      lazyError = await assertLazyLoadErrorState(browser)
      if (lazyError.status !== 'checked') {
        throw new QaBlockedError(`Lazy-Load-Fehlerzustand wurde nicht geprüft: ${lazyError.reason}`)
      }
      await signOutAfterSmoke(page)
    } else {
      lazyError = { status: 'checked', contract: 'Welcome auth gate; authenticated lazy-screen coverage remains in qa:beta.' }
      signedIn = { status: 'not-run-local', reason: 'qa:local verifies the signed-out Welcome contract.' }
      for (const viewport of viewports) {
        for (const theme of themes) {
          screenResults.push({ viewport: viewport.label, theme, screens: await runWelcomeMatrix(page, viewport, theme) })
        }
      }
    }
    for (const viewport of [viewports[1], viewports[3]]) {
      for (const theme of themes) {
        await assertPublicCheckInErrorState(page, viewport, theme)
      }
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
          baseUrl: target.logUrl,
          screenshots: screenshotsEnabled ? screenshotsDir : 'disabled',
          signedIn,
          lazyError,
          viewports: screenResults.map((result) => ({
            viewport: result.viewport,
            theme: result.theme,
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
