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
}

export function AppShell({
  activeTab,
  children,
  isManualSyncing,
  onManualSync,
  onTabChange,
  authState,
  playerSync,
}: AppShellProps) {
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
            <p className="eyebrow">Heute zuerst</p>
            <h2>Training Operations</h2>
            <p>Persoenliches iPad-Dashboard, keine Spieler-App und keine PDF-Ablage.</p>
          </div>
          <SyncStatusBadge
            authState={authState}
            isManualSyncing={isManualSyncing}
            onManualSync={onManualSync}
            playerSync={playerSync}
          />
        </div>

        <div className="content-stack">
          {children}
        </div>
      </main>
    </div>
  )
}
