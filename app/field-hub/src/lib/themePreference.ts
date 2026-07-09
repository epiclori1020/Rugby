export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const themePreferenceStorageKey = 'fieldHub:themePreference'

const systemDarkMediaQuery = '(prefers-color-scheme: dark)'
const themePreferences = new Set<ThemePreference>(['system', 'light', 'dark'])

type ThemePreferenceOptions = {
  matchMedia?: typeof window.matchMedia
  root?: HTMLElement
  storage?: Storage
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && themePreferences.has(value as ThemePreference)
}

function getSafeStorage(storage?: Storage) {
  if (storage) {
    return storage
  }

  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function getSafeMatchMedia(matchMedia?: typeof window.matchMedia) {
  if (matchMedia) {
    return matchMedia
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia.bind(window)
  }

  return null
}

function getSafeRoot(root?: HTMLElement) {
  if (root) {
    return root
  }

  if (typeof document === 'undefined') {
    return null
  }

  return document.documentElement
}

export function getStoredThemePreference(storage?: Storage): ThemePreference {
  const safeStorage = getSafeStorage(storage)
  if (!safeStorage) {
    return 'system'
  }

  try {
    const storedValue = safeStorage.getItem(themePreferenceStorageKey)
    return isThemePreference(storedValue) ? storedValue : 'system'
  } catch {
    return 'system'
  }
}

export function setStoredThemePreference(preference: ThemePreference, storage?: Storage) {
  const safeStorage = getSafeStorage(storage)
  if (!safeStorage) {
    return
  }

  try {
    safeStorage.setItem(themePreferenceStorageKey, preference)
  } catch {
    // Theme selection is a UI preference; storage failures must not block app use.
  }
}

export function resolveThemePreference(
  preference: ThemePreference,
  matchMedia?: typeof window.matchMedia,
): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') {
    return preference
  }

  const safeMatchMedia = getSafeMatchMedia(matchMedia)
  if (!safeMatchMedia) {
    return 'light'
  }

  try {
    return safeMatchMedia(systemDarkMediaQuery).matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyThemePreference(preference: ThemePreference, options: ThemePreferenceOptions = {}) {
  const resolvedTheme = resolveThemePreference(preference, options.matchMedia)
  const root = getSafeRoot(options.root)

  if (root) {
    root.dataset.theme = resolvedTheme
    root.dataset.themePreference = preference
  }

  return resolvedTheme
}

export function bootstrapThemePreference(options: ThemePreferenceOptions = {}) {
  const preference = getStoredThemePreference(options.storage)
  const resolvedTheme = applyThemePreference(preference, options)

  return { preference, resolvedTheme }
}

export function subscribeToSystemThemePreferenceChanges(
  onChange: (resolvedTheme: ResolvedTheme) => void,
  matchMedia?: typeof window.matchMedia,
) {
  const safeMatchMedia = getSafeMatchMedia(matchMedia)
  if (!safeMatchMedia) {
    return () => undefined
  }

  let mediaQueryList: MediaQueryList
  try {
    mediaQueryList = safeMatchMedia(systemDarkMediaQuery)
  } catch {
    return () => undefined
  }

  const handleChange = () => onChange(mediaQueryList.matches ? 'dark' : 'light')
  const legacyMediaQueryList = mediaQueryList as MediaQueryList & {
    addListener?: (listener: (event: MediaQueryListEvent) => void) => void
    removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
  }

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', handleChange)

    return () => mediaQueryList.removeEventListener('change', handleChange)
  }

  legacyMediaQueryList.addListener?.(handleChange)

  return () => legacyMediaQueryList.removeListener?.(handleChange)
}
