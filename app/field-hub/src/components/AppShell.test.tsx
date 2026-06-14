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
})
