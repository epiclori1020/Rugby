import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PlayerSyncOverview } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'
import { routes } from '../navigation'
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
  it('lets the Today screen own its header while preserving the shared interactive sync status', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeRoute={routes.today}
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onNavigate={() => undefined}
        playerSync={syncedOverview}
        syncStatusSlot={<button type="button">Gemeinsamer Sync</button>}
        topbarMode="screen-owned"
      >
        <header>Squad heute · Gemeinsamer Sync</header>
      </AppShell>,
    )

    expect(markup).not.toContain('Tageslage, offene Aufgaben und schnelle Einstiege.')
    expect(markup.match(/Gemeinsamer Sync/g)).toHaveLength(1)
    expect(markup).toContain('Squad heute')
  })

  it('renders a tab-specific title for the active tab', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeRoute={routes.moreExport}
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onNavigate={() => undefined}
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
        activeRoute={routes.players}
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onNavigate={() => undefined}
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
    expect(markup).toContain('<h1 class="onfield-wordmark"')
    expect(markup).toContain('<span class="onfield-wordmark-name">OnField</span>')
    expect(markup).toContain('<span class="onfield-wordmark-product">Coach</span>')
  })

  it('renders the settings title without a permanent sync button when data is synced', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeRoute={routes.moreSettings}
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onNavigate={() => undefined}
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
        activeRoute={routes.analysis}
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onNavigate={() => undefined}
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
        activeRoute={routes.today}
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onNavigate={() => undefined}
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
        activeRoute={routes.unitTraining}
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onNavigate={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Training content</p>
      </AppShell>,
    )

    expect(markup).not.toContain('aria-label="Einheit Unterbereiche"')
    expect(markup).not.toContain('Nachbereitung')
    expect(markup).toContain('Training content')
  })

  it('presents Returner as an Einheit route', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeRoute={routes.unitReturners}
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onNavigate={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Returner content</p>
      </AppShell>,
    )

    expect(markup).toContain('Einheit / Returner')
    expect(markup).toContain('Hinweise für Coaching-Entscheidungen')
    expect(markup).not.toContain('aria-label="Mehr Unterbereiche"')
  })

  it('renders more subnavigation with Returner as a utility, not a top-level tab', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        activeRoute={routes.moreReturners}
        authState={signedOutAuthState}
        onSectionChange={() => undefined}
        onNavigate={() => undefined}
        playerSync={syncedOverview}
      >
        <p>Returner content</p>
      </AppShell>,
    )

    expect(markup).toContain('aria-label="Mehr Unterbereiche"')
    expect(markup).toContain('section-subnav more-subnav')
    expect(markup).toContain('Bibliothek')
    expect(markup).toContain('Export &amp; Backup')
    expect(markup).toContain('Einstellungen')
    expect(markup).toContain('Returner')
    expect(markup).toContain('Primärer Arbeitsort: Einheit')
  })
})
