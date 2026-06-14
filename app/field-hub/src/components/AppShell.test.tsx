import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PlayerSyncOverview } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'
import { AppShell } from './AppShell'

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
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

describe('AppShell page title', () => {
  it('renders a tab-specific title for the active tab', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeTab="export"
        authState={signedOutAuthState}
        isManualSyncing={false}
        onManualSync={() => undefined}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Export content</p>
      </AppShell>,
    )

    expect(markup).toContain('Export &amp; Backup')
    expect(markup).not.toContain('Training Operations')
  })

  it('uses a left navigation drawer contract instead of a bottom tab bar', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeTab="spieler"
        authState={signedOutAuthState}
        isManualSyncing={false}
        onManualSync={() => undefined}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Spieler content</p>
      </AppShell>,
    )

    expect(markup).toContain('aria-label="Navigation oeffnen"')
    expect(markup).toContain('aria-controls="app-sidebar"')
    expect(markup).toContain('Hauptnavigation')
    expect(markup).not.toContain('bottom-tab-bar')
  })
})
