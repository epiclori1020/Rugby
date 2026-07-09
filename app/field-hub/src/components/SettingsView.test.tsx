// @vitest-environment jsdom

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { SessionLog } from '../domain/checkIn'
import type { PlayerSyncOverview } from '../domain/sync'
import type { StoragePersistenceState } from '../hooks/useStoragePersistence'
import type { AuthSessionState } from '../lib/auth'
import type { ThemePreference } from '../lib/themePreference'
import { SettingsView } from './SettingsView'

const signedInAuthState = {
  status: 'signed-in',
  session: { user: { id: 'user-1', email: 'coach@example.com' } },
  user: { id: 'user-1', email: 'coach@example.com' },
  error: null,
} as AuthSessionState

const signedOutAuthState: AuthSessionState = {
  status: 'signed-out',
  session: null,
  user: null,
  error: null,
}

const syncedOverview: PlayerSyncOverview = {
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: '2026-06-18T20:00:00.000Z',
  errorMessage: null,
}

const completedSession: SessionLog = {
  id: 'session-1',
  userId: 'user-1',
  sessionDefinitionId: 'kw25',
  date: '2026-06-18',
  status: 'completed',
  coach: '',
  groupSize: null,
  weatherOrHeatNote: '',
  planChanged: false,
  durationMinutes: null,
  contactIndex: '',
  speedExposureNote: '',
  coachReview: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T20:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T20:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const storagePersistence: StoragePersistenceState = { status: 'persisted' }

function renderSettings(
  authState: AuthSessionState = signedInAuthState,
  overrides: Partial<Parameters<typeof SettingsView>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(SettingsView, {
      authState,
      backupRecommended: true,
      isManualSyncing: false,
      lastExportAt: null,
      latestCompletedSession: completedSession,
      needsAppRefresh: true,
      pwaDisplayMode: 'browser',
      onManualSync: () => undefined,
      onNavigate: () => undefined,
      onReloadApp: () => undefined,
      onThemePreferenceChange: () => undefined,
      storagePersistence,
      syncFeedback: null,
      syncOverview: syncedOverview,
      themePreference: 'system',
      ...overrides,
    }),
  )
}

describe('SettingsView', () => {
  it('centralizes account, manual sync, backup and device status for signed-in coaches', () => {
    const markup = renderSettings()

    expect(markup).toContain('Coach-Session')
    expect(markup).toContain('Logout')
    expect(markup).toContain('Jetzt synchronisieren')
    expect(markup).toContain('Backup empfohlen')
    expect(markup).toContain('Export &amp; Backup oeffnen')
    expect(markup).toContain('Speicherstatus')
    expect(markup).toContain('Darstellung')
    expect(markup).toContain('System')
    expect(markup).toContain('Hell')
    expect(markup).toContain('Field Mode')
    expect(markup).toContain('Browser-Modus')
    expect(markup).toContain('Installiere OnField Coach fuer mehr Platz am Spielfeldrand.')
    expect(markup).toContain('OnField als PWA nutzen')
    expect(markup).toContain('Zum Home-Bildschirm')
    expect(markup).toContain('Neue App-Version bereit')
    expect(markup).toContain('Wartet auf Sync')
    expect(markup).not.toContain('pending write queue')
  })

  it('shows login in settings when signed out', () => {
    const markup = renderSettings(signedOutAuthState)

    expect(markup).toContain('Coach-Login')
    expect(markup).toContain('Einloggen')
  })

  it('renders warning feedback without using success or error styling', () => {
    const markup = renderSettings(signedInAuthState, {
      syncFeedback: { kind: 'warning', message: '2 Aenderungen warten auf Sync.' },
    })

    expect(markup).toContain('class="form-warning"')
    expect(markup).toContain('2 Aenderungen warten auf Sync.')
  })

  it('explains why manual sync is disabled', () => {
    const signedOutMarkup = renderSettings(signedOutAuthState)
    const offlineMarkup = renderSettings(signedInAuthState, {
      syncOverview: { ...syncedOverview, isOnline: false, pendingCount: 2, status: 'pending' },
    })
    const syncingMarkup = renderSettings(signedInAuthState, {
      isManualSyncing: true,
    })

    expect(signedOutMarkup).toContain('Coach-Login noetig.')
    expect(signedOutMarkup).toContain('aria-describedby="manual-sync-disabled-reason"')
    expect(offlineMarkup).toContain('Offline - Aenderungen bleiben lokal gespeichert.')
    expect(offlineMarkup).toContain('2 Aenderungen warten auf Sync.')
    expect(syncingMarkup).toContain('Sync laeuft gerade.')
    expect(syncingMarkup).toContain('Sync laeuft gerade</span>')
  })

  it('uses the green storage indicator only after persistent storage is confirmed', () => {
    const persistedMarkup = renderSettings(signedInAuthState, {
      storagePersistence: { status: 'persisted' },
    })
    const deniedMarkup = renderSettings(signedInAuthState, {
      storagePersistence: { status: 'denied' },
    })

    expect(persistedMarkup).toContain('<span class="status-dot online" aria-hidden="true"></span><strong>Speicherstatus')
    expect(deniedMarkup).toContain('<span class="status-dot" aria-hidden="true"></span><strong>Speicherstatus')
    expect(deniedMarkup).not.toContain('<span class="status-dot online" aria-hidden="true"></span><strong>Speicherstatus')
  })

  it('shows standalone install status without changing iPad feature parity copy', () => {
    const markup = renderSettings(signedInAuthState, {
      pwaDisplayMode: 'standalone',
    })

    expect(markup).toContain('PWA installiert')
    expect(markup).toContain('OnField Coach laeuft im Home-Screen-Modus.')
    expect(markup).toContain('iPadOS: dieselbe PWA, derselbe Funktionsumfang, nur mehr Flaeche.')
    expect(markup).not.toContain('beforeinstallprompt')
  })

  it('keeps the current theme preference pressed and reports changes from the segmented control', async () => {
    const onThemePreferenceChange = vi.fn<(preference: ThemePreference) => void>()
    const container = document.createElement('div')
    const root = createRoot(container)

    try {
      await act(async () => {
        root.render(
          createElement(SettingsView, {
            authState: signedInAuthState,
            backupRecommended: true,
            isManualSyncing: false,
            lastExportAt: null,
            latestCompletedSession: completedSession,
            needsAppRefresh: true,
            pwaDisplayMode: 'browser',
            onManualSync: () => undefined,
            onNavigate: () => undefined,
            onReloadApp: () => undefined,
            onThemePreferenceChange,
            storagePersistence,
            syncFeedback: null,
            syncOverview: syncedOverview,
            themePreference: 'light',
          }),
        )
      })

      const lightButton = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Hell')
      const fieldModeButton = [...container.querySelectorAll('button')].find(
        (button) => button.textContent === 'Field Mode',
      )

      expect(lightButton?.getAttribute('aria-pressed')).toBe('true')
      expect(fieldModeButton?.getAttribute('aria-pressed')).toBe('false')

      await act(async () => {
        fieldModeButton?.click()
      })

      expect(onThemePreferenceChange).toHaveBeenCalledWith('dark')
    } finally {
      await act(async () => {
        root.unmount()
      })
    }
  })
})
