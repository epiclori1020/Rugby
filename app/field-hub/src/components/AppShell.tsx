import { Archive, FileDown, HeartPulse, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PlayerSyncOverview, SyncDetailSummary } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'
import type { ManualSyncFeedback } from '../lib/syncRepository'
import {
  routeForMore,
  routeKey,
  routes,
  type AppRoute,
  type AppSection,
  type MoreRoute,
} from '../navigation'
import { MainNavigation } from './MainNavigation'
import { SyncStatusBadge } from './SyncStatusBadge'
import { SegmentedControl, type SegmentedControlOption } from './ui'

type AppShellProps = {
  activeRoute: AppRoute
  children: ReactNode
  onSectionChange: (section: AppSection) => void
  onNavigate: (route: AppRoute) => void
  authState: AuthSessionState
  backupRecommended?: boolean
  isManualSyncing?: boolean
  lastExportAt?: string | null
  onManualSync?: () => void
  playerSync: PlayerSyncOverview
  syncDetails?: SyncDetailSummary | null
  syncFeedback?: ManualSyncFeedback | null
  transientNotice?: string | null
}

const routeMeta: Record<ReturnType<typeof routeKey>, { eyebrow: string; title: string; description: string }> = {
  today: {
    eyebrow: 'Heute',
    title: 'Heute',
    description: 'Tageslage, offene Aufgaben und schnelle Einstiege.',
  },
  players: {
    eyebrow: 'Spieler',
    title: 'Spieler',
    description: 'Stammdaten, Status, Consent und lokale Testwerte im Blick.',
  },
  'unit/check-in': {
    eyebrow: 'Einheit / Check-in',
    title: 'Einheit',
    description: 'Anwesenheit, Belastbarkeit, Schmerz, Returner und Ampel schnell erfassen.',
  },
  'unit/training': {
    eyebrow: 'Einheit / Training',
    title: 'Einheit',
    description: 'Timeline, Varianten, Quick Actions und Coach-Beobachtungen.',
  },
  'unit/post-session': {
    eyebrow: 'Einheit / Nachbereitung',
    title: 'Einheit',
    description: 'sRPE, Pain, E2, Progression und Follow-ups sichern.',
  },
  'more/returners': {
    eyebrow: 'Mehr / Returner',
    title: 'Mehr',
    description: 'Caps fuer Speed, COD/Decel, Conditioning und Kontakt getrennt fuehren.',
  },
  analysis: {
    eyebrow: 'Analyse',
    title: 'Analyse',
    description: 'Rueckblick, Trends und Quellen getrennt vom Live-Flow auswerten.',
  },
  'more/library': {
    eyebrow: 'Mehr / Bibliothek',
    title: 'Mehr',
    description: 'Coach-Skripte, Varianten, Briefings und PDF-Fallbacks schnell finden.',
  },
  'more/export': {
    eyebrow: 'Mehr / Export & Backup',
    title: 'Mehr',
    description: 'JSON-Backup, CSV-Dateien und Import-Vorschau fuer sichere Ablage.',
  },
  'more/settings': {
    eyebrow: 'Mehr / Einstellungen',
    title: 'Mehr',
    description: 'Account, Sync, Backup, Geraet und App-Version an einem Ort.',
  },
}

const moreOptions: SegmentedControlOption<MoreRoute>[] = [
  { value: 'library', label: 'Bibliothek', icon: <Archive aria-hidden /> },
  { value: 'export', label: 'Export & Backup', icon: <FileDown aria-hidden /> },
  { value: 'settings', label: 'Einstellungen', icon: <Settings aria-hidden /> },
  { value: 'returners', label: 'Returner', icon: <HeartPulse aria-hidden /> },
]

export function AppShell({
  activeRoute,
  children,
  onSectionChange,
  onNavigate,
  authState,
  backupRecommended = false,
  isManualSyncing = false,
  lastExportAt = null,
  onManualSync = () => undefined,
  playerSync,
  syncDetails = null,
  syncFeedback = null,
  transientNotice = null,
}: AppShellProps) {
  const meta = routeMeta[routeKey(activeRoute)]
  const activeSection = activeRoute.section
  const activeMoreRoute = activeRoute.section === 'more' ? activeRoute.moreRoute : routes.moreLibrary.moreRoute

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
            backupRecommended={backupRecommended}
            isManualSyncing={isManualSyncing}
            lastExportAt={lastExportAt}
            onManualSync={onManualSync}
            playerSync={playerSync}
            syncDetails={syncDetails}
            syncFeedback={syncFeedback}
          />
        </div>
        {transientNotice ? (
          <p className="app-transient-notice" role="status" aria-live="polite">
            {transientNotice}
          </p>
        ) : null}
        {activeSection === 'more' ? (
          <div className="section-subnav">
            <SegmentedControl
              label="Mehr Unterbereiche"
              onChange={(moreRoute) => onNavigate(routeForMore(moreRoute))}
              options={moreOptions}
              value={activeMoreRoute}
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
