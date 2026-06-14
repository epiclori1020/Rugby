import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { HubTab } from '../App'
import type { PlayerSyncOverview } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'
import { MainNavigation } from './MainNavigation'
import { SyncStatusBadge } from './SyncStatusBadge'

type AppShellProps = {
  activeTab: HubTab
  children: ReactNode
  isManualSyncing: boolean
  onManualSync: () => void
  onTabChange: (tab: HubTab) => void
  authState: AuthSessionState
  playerSync: PlayerSyncOverview
  syncNotice?: string | null
}

const tabMeta: Record<HubTab, { eyebrow: string; title: string; description: string }> = {
  heute: {
    eyebrow: 'Heute',
    title: 'Trainingssteuerung',
    description: 'Naechste Einheit, offene Hinweise und schnelle Wege in die Arbeitsbereiche.',
  },
  spieler: {
    eyebrow: 'Kader & Verfuegbarkeit',
    title: 'Spieler',
    description: 'Stammdaten, Status, Consent und lokale Testwerte im Blick.',
  },
  'check-in': {
    eyebrow: 'Vor dem Training',
    title: 'Check-in',
    description: 'Anwesenheit, Readiness, Schmerz, Returner und Ampel schnell erfassen.',
  },
  training: {
    eyebrow: 'Am Feld',
    title: 'Training',
    description: 'Timeline, Varianten, Quick Actions und Coach-Beobachtungen.',
  },
  nachbereitung: {
    eyebrow: 'Nach dem Training',
    title: 'Nachbereitung',
    description: 'sRPE, Pain, E2, Progression und Follow-ups sichern.',
  },
  returner: {
    eyebrow: 'Returner-Steuerung',
    title: 'Returner',
    description: 'Caps fuer Speed, COD/Decel, Conditioning und Kontakt getrennt fuehren.',
  },
  bibliothek: {
    eyebrow: 'Unterlagen',
    title: 'Bibliothek',
    description: 'Coach-Skripte, Varianten, Briefings und PDF-Fallbacks schnell finden.',
  },
  export: {
    eyebrow: 'Backup',
    title: 'Export & Backup',
    description: 'JSON-Backup, CSV-Dateien und Import-Vorschau fuer sichere Ablage.',
  },
}

export function AppShell({
  activeTab,
  children,
  isManualSyncing,
  onManualSync,
  onTabChange,
  authState,
  playerSync,
  syncNotice = null,
}: AppShellProps) {
  const meta = tabMeta[activeTab]
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)

  const closeNavigation = useCallback(() => {
    setIsNavigationOpen(false)
  }, [])

  const handleTabChange = useCallback(
    (tab: HubTab) => {
      onTabChange(tab)
      closeNavigation()
    },
    [closeNavigation, onTabChange],
  )

  useEffect(() => {
    if (!isNavigationOpen) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeNavigation()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeNavigation, isNavigationOpen])

  return (
    <div className="app-shell">
      <aside
        className={isNavigationOpen ? 'sidebar sidebar-open' : 'sidebar'}
        id="app-sidebar"
        aria-label="Hauptnavigation"
      >
        <div className="brand-block">
          <p className="eyebrow">Rugby Donau S&C</p>
          <h1>Field Hub</h1>
          <p>Coach-Dashboard fuer Trainingstage, Sync und Feldorganisation.</p>
        </div>
        <MainNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </aside>
      {isNavigationOpen ? (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Navigation schliessen"
          onClick={closeNavigation}
        />
      ) : null}

      <main className="shell-main">
        <div className="topbar">
          <div className="page-title">
            <button
              className="mobile-menu-button"
              type="button"
              aria-controls="app-sidebar"
              aria-expanded={isNavigationOpen}
              aria-label={isNavigationOpen ? 'Navigation schliessen' : 'Navigation oeffnen'}
              onClick={() => setIsNavigationOpen((currentValue) => !currentValue)}
            >
              {isNavigationOpen ? <X className="nav-icon" aria-hidden /> : <Menu className="nav-icon" aria-hidden />}
            </button>
            <p className="eyebrow">{meta.eyebrow}</p>
            <h2>{meta.title}</h2>
            <p>{meta.description}</p>
          </div>
          <SyncStatusBadge
            authState={authState}
            isManualSyncing={isManualSyncing}
            onManualSync={onManualSync}
            playerSync={playerSync}
            syncNotice={syncNotice}
          />
        </div>

        <div className="content-stack">
          {children}
        </div>
      </main>
    </div>
  )
}
