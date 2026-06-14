import type { ReactNode } from 'react'
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

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Hauptnavigation">
        <div className="brand-block">
          <p className="eyebrow">Rugby Donau S&C</p>
          <h1>Field Hub</h1>
          <p>Coach-Dashboard fuer Trainingstage, Sync und Feldorganisation.</p>
        </div>
        <MainNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </aside>

      <main className="shell-main">
        <div className="topbar">
          <div className="page-title">
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
