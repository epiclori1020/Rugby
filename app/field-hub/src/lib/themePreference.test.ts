// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyThemePreference,
  getStoredThemePreference,
  resolveThemePreference,
  setStoredThemePreference,
  subscribeToSystemThemePreferenceChanges,
  themePreferenceStorageKey,
  type ThemePreference,
} from './themePreference'

function createMatchMedia(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const mediaQueryList = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'change' && typeof listener === 'function') {
        listeners.add(listener as (event: MediaQueryListEvent) => void)
      }
    }),
    removeEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'change' && typeof listener === 'function') {
        listeners.delete(listener as (event: MediaQueryListEvent) => void)
      }
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as MediaQueryList

  return {
    matchMedia: vi.fn(() => mediaQueryList),
    setMatches(nextMatches: boolean) {
      matches = nextMatches
      listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent))
    },
  }
}

function createBrokenStorage() {
  return {
    length: 0,
    clear: vi.fn(),
    getItem: vi.fn(() => {
      throw new Error('storage unavailable')
    }),
    key: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(() => {
      throw new Error('storage unavailable')
    }),
  } satisfies Storage
}

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-theme-preference')
  vi.restoreAllMocks()
})

describe('themePreference', () => {
  it('defaults to system when no valid stored preference exists', () => {
    expect(getStoredThemePreference()).toBe('system')

    window.localStorage.setItem(themePreferenceStorageKey, 'sepia')

    expect(getStoredThemePreference()).toBe('system')
  })

  it.each<ThemePreference>(['system', 'light', 'dark'])('persists only the raw %s preference', (preference) => {
    setStoredThemePreference(preference)

    expect(window.localStorage.getItem(themePreferenceStorageKey)).toBe(preference)
    expect(getStoredThemePreference()).toBe(preference)
  })

  it('falls back to system when storage is unavailable', () => {
    const brokenStorage = createBrokenStorage()

    expect(getStoredThemePreference(brokenStorage)).toBe('system')
    expect(() => setStoredThemePreference('dark', brokenStorage)).not.toThrow()
  })

  it('resolves system preference from the operating system theme', () => {
    const lightSystem = createMatchMedia(false)
    const darkSystem = createMatchMedia(true)

    expect(resolveThemePreference('system', lightSystem.matchMedia)).toBe('light')
    expect(resolveThemePreference('system', darkSystem.matchMedia)).toBe('dark')
  })

  it('lets manual light and dark choices override the operating system theme', () => {
    const darkSystem = createMatchMedia(true)
    const lightSystem = createMatchMedia(false)

    expect(resolveThemePreference('light', darkSystem.matchMedia)).toBe('light')
    expect(resolveThemePreference('dark', lightSystem.matchMedia)).toBe('dark')
  })

  it('sets resolved data-theme and raw data-theme-preference attributes', () => {
    const darkSystem = createMatchMedia(true)

    const resolved = applyThemePreference('system', {
      matchMedia: darkSystem.matchMedia,
      root: document.documentElement,
    })

    expect(resolved).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.dataset.themePreference).toBe('system')
  })

  it('notifies system theme changes so system mode can live-update', () => {
    const systemTheme = createMatchMedia(false)
    const onChange = vi.fn()

    const unsubscribe = subscribeToSystemThemePreferenceChanges(onChange, systemTheme.matchMedia)
    systemTheme.setMatches(true)
    unsubscribe()
    systemTheme.setMatches(false)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('dark')
  })
})
