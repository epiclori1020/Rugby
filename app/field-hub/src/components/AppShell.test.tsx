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

  it('renders the settings title without a permanent sync button when data is synced', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeTab="einstellungen"
        authState={signedOutAuthState}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Settings content</p>
      </AppShell>,
    )

    expect(markup).toContain('Einstellungen')
    expect(markup).not.toContain('Jetzt synchronisieren')
  })

  it('renders analysis metadata for the team analysis tab', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeTab="analysis"
        authState={signedOutAuthState}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Analysis content</p>
      </AppShell>,
    )

    expect(markup).toContain('Analyse')
    expect(markup).toContain('Lokale Team-Trends fuer Planung, Load, Exposures und Planned-vs-Actual.')
  })

  it('renders app-level transient notices as polite status feedback', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeTab="heute"
        authState={signedOutAuthState}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
        transientNotice="Check-in geöffnet."
      >
        <p>Heute content</p>
      </AppShell>,
    )

    expect(markup).toContain('Heute zählt, Aufpassen, Material und schnelle Wege in die Arbeitsbereiche.')
    expect(markup).toContain('role="status"')
    expect(markup).toContain('aria-live="polite"')
    expect(markup).toContain('Check-in geöffnet.')
  })
})
