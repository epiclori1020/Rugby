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
        activeSection="mehr"
        activeTab="export"
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Export content</p>
      </AppShell>,
    )

    expect(markup).toContain('Export &amp; Backup')
    expect(markup).not.toContain('Training Operations')
  })

  it('uses a five-item app shell navigation without a hamburger-only contract', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeSection="spieler"
        activeTab="spieler"
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Spieler content</p>
      </AppShell>,
    )

    expect(markup).toContain('bottom-tab-bar')
    expect(markup).toContain('Hauptnavigation')
    expect(markup).not.toContain('Navigation oeffnen')
    expect(markup).not.toContain('aria-controls="app-sidebar"')
    expect(markup).not.toContain('Field Hub')
    expect(markup).toContain('OnField Coach')
  })

  it('renders the settings title without a permanent sync button when data is synced', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeSection="mehr"
        activeTab="einstellungen"
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
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
        activeSection="analysis"
        activeTab="analysis"
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Analysis content</p>
      </AppShell>,
    )

    expect(markup).toContain('Analyse')
    expect(markup).toContain('Rueckblick, Trends und Quellen getrennt vom Live-Flow auswerten.')
  })

  it('renders app-level transient notices as polite status feedback', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeSection="heute"
        activeTab="heute"
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
        transientNotice="Check-in geöffnet."
      >
        <p>Heute content</p>
      </AppShell>,
    )

    expect(markup).toContain('Tageslage, offene Aufgaben und schnelle Einstiege.')
    expect(markup).toContain('role="status"')
    expect(markup).toContain('aria-live="polite"')
    expect(markup).toContain('Check-in geöffnet.')
  })

  it('leaves unit subnavigation to the Einheit workspace', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeSection="einheit"
        activeTab="training"
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Training content</p>
      </AppShell>,
    )

    expect(markup).not.toContain('aria-label="Einheit Unterbereiche"')
    expect(markup).not.toContain('Nachbereitung')
    expect(markup).toContain('Training content')
  })

  it('renders more subnavigation with Returner as a utility, not a top-level tab', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeSection="mehr"
        activeTab="returner"
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onTabChange={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Returner content</p>
      </AppShell>,
    )

    expect(markup).toContain('aria-label="Mehr Unterbereiche"')
    expect(markup).toContain('Bibliothek')
    expect(markup).toContain('Export &amp; Backup')
    expect(markup).toContain('Einstellungen')
    expect(markup).toContain('Returner')
  })
})
