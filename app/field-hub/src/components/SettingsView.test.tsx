import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SessionLog } from '../domain/checkIn'
import type { PlayerSyncOverview } from '../domain/sync'
import type { StoragePersistenceState } from '../hooks/useStoragePersistence'
import type { AuthSessionState } from '../lib/auth'
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
      onManualSync: () => undefined,
      onNavigate: () => undefined,
      onReloadApp: () => undefined,
      storagePersistence,
      syncFeedback: null,
      syncOverview: syncedOverview,
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
    expect(markup).toContain('Neue App-Version bereit')
  })

  it('shows login in settings when signed out', () => {
    const markup = renderSettings(signedOutAuthState)

    expect(markup).toContain('Coach-Login')
    expect(markup).toContain('Einloggen')
  })

  it('renders warning feedback without using success or error styling', () => {
    const markup = renderSettings(signedInAuthState, {
      syncFeedback: { kind: 'warning', message: 'Sync offen: 2 Aenderungen noch nicht synchronisiert.' },
    })

    expect(markup).toContain('class="form-warning"')
    expect(markup).toContain('Sync offen: 2 Aenderungen noch nicht synchronisiert.')
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
})
