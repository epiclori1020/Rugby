import { AlertTriangle, CheckCircle2, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import type { PlayerSyncOverview, SyncDetailGroup, SyncDetailSummary } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'
import type { ManualSyncFeedback } from '../lib/syncRepository'
import { formatSyncTimestamp, syncBadgeDetail, syncBadgeLabel } from '../lib/syncLabels'
import { TaskQueueRow } from './onfield'
import { PrimaryButton, SecondaryButton, Sheet, StatusChip } from './ui'

type SyncStatusBadgeProps = {
  authState: AuthSessionState
  backupRecommended?: boolean
  isManualSyncing?: boolean
  lastExportAt?: string | null
  onManualSync?: () => void
  playerSync: PlayerSyncOverview
  syncDetails?: SyncDetailSummary | null
  syncFeedback?: ManualSyncFeedback | null
}

function syncDisabledReason({
  authState,
  isManualSyncing,
  isOnline,
}: {
  authState: AuthSessionState
  isManualSyncing: boolean
  isOnline: boolean
}) {
  if (isManualSyncing) {
    return 'Sync laeuft gerade.'
  }

  if (authState.status !== 'signed-in') {
    return 'Coach-Login noetig.'
  }

  if (!isOnline) {
    return 'Offline - Aenderungen bleiben lokal gespeichert.'
  }

  return null
}

function triggerTone(overview: PlayerSyncOverview, isManualSyncing: boolean) {
  if (isManualSyncing) {
    return 'syncing'
  }

  if (!overview.isOnline) {
    return 'offline'
  }

  if (overview.status === 'error' || overview.errorMessage) {
    return 'error'
  }

  if (overview.status === 'pending' || overview.pendingCount > 0) {
    return 'pending'
  }

  return 'synced'
}

function triggerIcon(overview: PlayerSyncOverview, isManualSyncing: boolean) {
  const tone = triggerTone(overview, isManualSyncing)

  if (tone === 'syncing') {
    return <RefreshCw aria-hidden />
  }

  if (tone === 'offline') {
    return <CloudOff aria-hidden />
  }

  if (tone === 'error') {
    return <AlertTriangle aria-hidden />
  }

  if (tone === 'synced') {
    return <CheckCircle2 aria-hidden />
  }

  return <Cloud aria-hidden />
}

function groupTone(group: SyncDetailGroup) {
  if (group.status === 'conflict' || group.status === 'error') {
    return 'danger'
  }

  if (group.status === 'pending') {
    return 'warning'
  }

  return 'success'
}

function groupMeta(group: SyncDetailGroup) {
  return [
    group.pendingCount > 0 ? `${group.pendingCount} wartet auf Sync` : null,
    group.errorCount > 0 ? `${group.errorCount} erneut versuchen` : null,
    group.conflictCount > 0 ? `${group.conflictCount} Konflikt pruefen` : null,
  ].filter((item): item is string => Boolean(item))
}

function feedbackClassName(kind: ManualSyncFeedback['kind']) {
  if (kind === 'success') {
    return 'form-success'
  }

  if (kind === 'warning') {
    return 'form-warning'
  }

  return 'form-error'
}

function formatExportTimestamp(timestamp: string | null) {
  return timestamp ? formatSyncTimestamp(timestamp) : 'noch kein Export'
}

export function SyncStatusBadge({
  authState,
  backupRecommended = false,
  isManualSyncing = false,
  lastExportAt = null,
  onManualSync = () => undefined,
  playerSync,
  syncDetails = null,
  syncFeedback = null,
}: SyncStatusBadgeProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  if (authState.status !== 'signed-in') {
    return null
  }

  const disabledReason = syncDisabledReason({
    authState,
    isManualSyncing,
    isOnline: playerSync.isOnline,
  })
  const canManualSync = disabledReason === null
  const label = syncBadgeLabel(playerSync, isManualSyncing)
  const detail = syncBadgeDetail(playerSync, isManualSyncing)
  const tone = triggerTone(playerSync, isManualSyncing)
  const groups = syncDetails?.groups ?? []

  return (
    <>
      <button
        className={`sync-status-trigger sync-status-trigger-${tone}`}
        type="button"
        aria-label={`Sync Status: ${label}. ${detail}`}
        onClick={() => setIsDetailOpen(true)}
      >
        <span className="sync-status-trigger-line">
          <span className="sync-status-trigger-icon">{triggerIcon(playerSync, isManualSyncing)}</span>
          <span>{label}</span>
        </span>
        <span>{detail}</span>
      </button>

      {isDetailOpen ? (
        <Sheet
          title="Sync und Backup"
          description="Lokaler Speicher bleibt die erste Sicherung. Sync gleicht Geraete ab, JSON ist Zusatzbackup."
          onClose={() => setIsDetailOpen(false)}
        >
          <div className="sync-detail-stack">
            <section className="sync-detail-summary" aria-label="Sync Zusammenfassung">
              <StatusChip label={playerSync.isOnline ? 'Online' : 'offline'} tone={playerSync.isOnline ? 'success' : 'warning'} />
              <StatusChip label={label} tone={tone === 'error' ? 'danger' : tone === 'synced' ? 'success' : 'warning'} />
              <p>{detail}</p>
              <p>Zuletzt synchronisiert: {formatSyncTimestamp(playerSync.lastSuccessfulSyncAt)}.</p>
            </section>

            {groups.length > 0 ? (
              <div className="sync-detail-groups" aria-label="Offene Sync Bereiche">
                {groups.map((group) => (
                  <TaskQueueRow
                    detail={group.detail}
                    key={group.id}
                    meta={groupMeta(group)}
                    title={group.label}
                    tone={groupTone(group)}
                  />
                ))}
              </div>
            ) : (
              <TaskQueueRow
                detail="Keine offenen Aenderungen oder Konflikte."
                title="Alle Bereiche"
                tone="success"
              />
            )}

            <TaskQueueRow
              detail={`Letzter Export: ${formatExportTimestamp(lastExportAt)}.`}
              meta={[backupRecommended ? 'Backup empfohlen' : 'Backup ok']}
              title="Backup"
              tone={backupRecommended ? 'warning' : 'success'}
            />

            {syncFeedback ? <p className={feedbackClassName(syncFeedback.kind)}>{syncFeedback.message}</p> : null}

            <div className="sync-detail-actions">
              <PrimaryButton
                disabled={!canManualSync}
                disabledReason={disabledReason ?? undefined}
                icon={<RefreshCw aria-hidden />}
                isLoading={isManualSyncing}
                loadingLabel="Sync laeuft"
                onClick={onManualSync}
              >
                Jetzt synchronisieren
              </PrimaryButton>
              <SecondaryButton onClick={() => setIsDetailOpen(false)}>
                Schliessen
              </SecondaryButton>
            </div>
          </div>
        </Sheet>
      ) : null}
    </>
  )
}
