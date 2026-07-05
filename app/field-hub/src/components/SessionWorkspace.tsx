import { Activity, ClipboardCheck, Dumbbell } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SessionDefinition, SessionType } from '../content/types'
import { deriveAttendanceStatus, type PlayerSessionEntry, type PlayerWarning } from '../domain/checkIn'
import type { PostSessionCompletion } from '../domain/postSessionCompletion'
import type { ReturnerCapSummary } from '../domain/returners'
import type { PlayerSyncOverview } from '../domain/sync'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import type { UnitSubTab } from '../navigation'
import { SessionPicker } from './SessionPicker'
import { SessionHeader } from './onfield/SessionHeader'
import { SegmentedControl, StatusChip, type SegmentedControlOption, type StatusTone } from './ui'

type SessionWorkspaceProps = {
  activeSubTab: UnitSubTab
  children: ReactNode
  entries: PlayerSessionEntry[]
  onSessionChange: (sessionId: string) => void
  onSubTabChange: (tab: UnitSubTab) => void
  postSessionCompletion: PostSessionCompletion
  returnerCaps: ReturnerCapSummary[]
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
  syncOverview: PlayerSyncOverview
  warnings: PlayerWarning[]
}

const unitOptions: SegmentedControlOption<UnitSubTab>[] = [
  { value: 'check-in', label: 'Check-in', icon: <ClipboardCheck aria-hidden /> },
  { value: 'training', label: 'Training', icon: <Dumbbell aria-hidden /> },
  { value: 'nachbereitung', label: 'Nachbereitung', icon: <Activity aria-hidden /> },
]

const sessionTypeLabel: Record<SessionType, string> = {
  baseline: 'Baseline',
  recheck: 'Re-Check',
  training: 'Training',
  transition: 'Transition',
}

const completionLabel: Record<PostSessionCompletion['status'], string> = {
  abgeschlossen: 'abgeschlossen',
  offen: 'offen',
  teilweise_abgeschlossen: 'teilweise offen',
}

function countOpenWarnings(entries: PlayerSessionEntry[], warnings: PlayerWarning[]) {
  const flaggedPlayerIds = new Set<string>()

  for (const entry of entries) {
    if (!entry.playerId || entry.deletedAt) {
      continue
    }

    const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
    const hasEntryWarning =
      trafficLight === 'yellow' ||
      trafficLight === 'red' ||
      entry.redFlag !== 'none' ||
      entry.movementConcern ||
      entry.limits.length > 0

    if (hasEntryWarning) {
      flaggedPlayerIds.add(entry.playerId)
    }
  }

  for (const warning of warnings) {
    if (warning.playerId) {
      flaggedPlayerIds.add(warning.playerId)
    }
  }

  return flaggedPlayerIds.size
}

function countPresentEntries(entries: PlayerSessionEntry[]) {
  return entries.filter((entry) => !entry.deletedAt && deriveAttendanceStatus(entry) === 'present').length
}

function countReturnerHints(returnerCaps: ReturnerCapSummary[]) {
  return new Set(returnerCaps.map((cap) => cap.playerId).filter(Boolean)).size
}

function syncTone(syncOverview: PlayerSyncOverview): StatusTone {
  if (!syncOverview.isOnline) {
    return 'warning'
  }

  if (syncOverview.status === 'error') {
    return 'danger'
  }

  if (syncOverview.status === 'pending' || syncOverview.pendingCount > 0) {
    return 'warning'
  }

  return 'success'
}

export function SessionWorkspace({
  activeSubTab,
  children,
  entries,
  onSessionChange,
  onSubTabChange,
  postSessionCompletion,
  returnerCaps,
  selectedSession,
  selectedSessionId,
  sessions,
  syncOverview,
  warnings,
}: SessionWorkspaceProps) {
  const warningCount = countOpenWarnings(entries, warnings)
  const presentCount = countPresentEntries(entries)
  const returnerHintCount = countReturnerHints(returnerCaps)
  const openPostSessionCount = postSessionCompletion.blockers.length + postSessionCompletion.advisories.length
  const hasSyncAttention = shouldShowSyncAttention(syncOverview)
  const syncDetail = syncOverview.errorMessage ?? pendingCountLabel(syncOverview.pendingCount)

  return (
    <section className="session-workspace" aria-label="Einheit Workspace">
      <SessionHeader
        action={
          <SessionPicker
            onSessionChange={onSessionChange}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
        }
        meta={[
          selectedSession.kw,
          selectedSession.date,
          sessionTypeLabel[selectedSession.type],
          `${selectedSession.timeline.length} Bloecke`,
        ]}
        metrics={[
          { label: 'Anwesend', value: `${presentCount}` },
          { label: 'Hinweise', value: `${warningCount}` },
          { label: 'Nachbereitung', value: completionLabel[postSessionCompletion.status] },
          { label: 'Returner', value: `${returnerHintCount}` },
        ]}
        subtitle={selectedSession.summary}
        title={selectedSession.title}
      />

      <div className="session-workspace-context" aria-label="Einheit Kontext">
        <span className="session-workspace-sync-status" role="status" aria-live="polite">
          <StatusChip
            label={`Sync: ${syncOverview.isOnline ? syncStatusLabel(syncOverview.status) : 'offline'}`}
            tone={syncTone(syncOverview)}
          />
          {hasSyncAttention ? <span className="session-workspace-context-detail">{syncDetail}</span> : null}
        </span>
        <StatusChip
          label={warningCount === 1 ? '1 Hinweis offen' : `${warningCount} Hinweise offen`}
          tone={warningCount > 0 ? 'warning' : 'success'}
        />
        <StatusChip
          label={openPostSessionCount === 1 ? '1 Nachbereitungspunkt offen' : `${openPostSessionCount} Nachbereitungspunkte offen`}
          tone={openPostSessionCount > 0 ? 'warning' : 'success'}
        />
        <StatusChip
          label={returnerHintCount === 1 ? '1 Returner-Hinweis' : `${returnerHintCount} Returner-Hinweise`}
          tone={returnerHintCount > 0 ? 'info' : 'neutral'}
        />
      </div>

      <div className="session-workspace-subnav">
        <SegmentedControl
          label="Einheit Unterbereiche"
          onChange={onSubTabChange}
          options={unitOptions}
          value={activeSubTab}
        />
      </div>

      <div className="session-workspace-body">
        {children}
      </div>
    </section>
  )
}
