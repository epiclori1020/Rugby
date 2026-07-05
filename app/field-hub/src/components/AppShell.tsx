import { Archive, FileDown, HeartPulse, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PlayerSyncOverview } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'
import {
  isMoreSubTab,
  type AppSection,
  type HubTab,
  type MoreSubTab,
} from '../navigation'
import { MainNavigation } from './MainNavigation'
import { SyncStatusBadge } from './SyncStatusBadge'
import { SegmentedControl, type SegmentedControlOption } from './ui'

type AppShellProps = {
  activeSection: AppSection
  activeTab: HubTab
  children: ReactNode
  onSectionChange: (section: AppSection) => void
  onTabChange: (tab: HubTab) => void
  authState: AuthSessionState
  playerSync: PlayerSyncOverview
  transientNotice?: string | null
}

const tabMeta: Record<HubTab, { eyebrow: string; title: string; description: string }> = {
  heute: {
    eyebrow: 'Heute',
    title: 'Heute',
    description: 'Tageslage, offene Aufgaben und schnelle Einstiege.',
  },
  spieler: {
    eyebrow: 'Spieler',
    title: 'Spieler',
    description: 'Stammdaten, Status, Consent und lokale Testwerte im Blick.',
  },
  'check-in': {
    eyebrow: 'Einheit / Check-in',
    title: 'Einheit',
    description: 'Anwesenheit, Belastbarkeit, Schmerz, Returner und Ampel schnell erfassen.',
  },
  training: {
    eyebrow: 'Einheit / Training',
    title: 'Einheit',
    description: 'Timeline, Varianten, Quick Actions und Coach-Beobachtungen.',
  },
  nachbereitung: {
    eyebrow: 'Einheit / Nachbereitung',
    title: 'Einheit',
    description: 'sRPE, Pain, E2, Progression und Follow-ups sichern.',
  },
  returner: {
    eyebrow: 'Mehr / Returner',
    title: 'Mehr',
    description: 'Caps fuer Speed, COD/Decel, Conditioning und Kontakt getrennt fuehren.',
  },
  analysis: {
    eyebrow: 'Analyse',
    title: 'Analyse',
    description: 'Rueckblick, Trends und Quellen getrennt vom Live-Flow auswerten.',
  },
  bibliothek: {
    eyebrow: 'Mehr / Bibliothek',
    title: 'Mehr',
    description: 'Coach-Skripte, Varianten, Briefings und PDF-Fallbacks schnell finden.',
  },
  export: {
    eyebrow: 'Mehr / Export & Backup',
    title: 'Mehr',
    description: 'JSON-Backup, CSV-Dateien und Import-Vorschau fuer sichere Ablage.',
  },
  einstellungen: {
    eyebrow: 'Mehr / Einstellungen',
    title: 'Mehr',
    description: 'Account, Sync, Backup, Geraet und App-Version an einem Ort.',
  },
}

const moreOptions: SegmentedControlOption<MoreSubTab>[] = [
  { value: 'bibliothek', label: 'Bibliothek', icon: <Archive aria-hidden /> },
  { value: 'export', label: 'Export & Backup', icon: <FileDown aria-hidden /> },
  { value: 'einstellungen', label: 'Einstellungen', icon: <Settings aria-hidden /> },
  { value: 'returner', label: 'Returner', icon: <HeartPulse aria-hidden /> },
]

export function AppShell({
  activeSection,
  activeTab,
  children,
  onSectionChange,
  onTabChange,
  authState,
  playerSync,
  transientNotice = null,
}: AppShellProps) {
  const meta = tabMeta[activeTab]
  const activeMoreSubTab = isMoreSubTab(activeTab) ? activeTab : 'bibliothek'

  return (
    <div className="app-shell">
      <aside className="sidebar" id="app-sidebar" aria-label="Hauptnavigation">
        <div className="brand-block">
          <p className="eyebrow">OnField</p>
          <h1>OnField Coach</h1>
          <p>Coach-Operations fuer Trainingstage, Sync und Feldorganisation.</p>
        </div>
        <MainNavigation activeSection={activeSection} onSectionChange={onSectionChange} />
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
            playerSync={playerSync}
          />
        </div>
        {transientNotice ? (
          <p className="app-transient-notice" role="status" aria-live="polite">
            {transientNotice}
          </p>
        ) : null}
        {activeSection === 'mehr' ? (
          <div className="section-subnav">
            <SegmentedControl
              label="Mehr Unterbereiche"
              onChange={onTabChange}
              options={moreOptions}
              value={activeMoreSubTab}
            />
          </div>
        ) : null}

        <div className="content-stack">
          {children}
        </div>
      </main>
    </div>
  )
}
