import { AlertTriangle, Cloud, CloudOff } from 'lucide-react'
import type { PlayerSyncOverview } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'
import { shouldShowSyncAttention } from '../lib/syncLabels'

type SyncStatusBadgeProps = {
  authState: AuthSessionState
  playerSync: PlayerSyncOverview
}

export function SyncStatusBadge({
  authState,
  playerSync,
}: SyncStatusBadgeProps) {
  if (authState.status !== 'signed-in' || !shouldShowSyncAttention(playerSync)) {
    return null
  }

  const syncLabel =
    !playerSync.isOnline
      ? 'lokal gespeichert'
      : playerSync.status === 'error' || playerSync.errorMessage
        ? 'Sync-Fehler'
        : 'Aenderungen offen'

  const detail = `${playerSync.pendingCount} Aenderungen offen${
    playerSync.lastSuccessfulSyncAt ? ` · letzter Sync ${new Date(playerSync.lastSuccessfulSyncAt).toLocaleString('de-AT')}` : ''
  }`
  const StatusIcon =
    playerSync.status === 'error' || playerSync.errorMessage
      ? AlertTriangle
      : playerSync.isOnline
        ? Cloud
        : CloudOff

  return (
    <section className="sync-status" aria-label="Sync Status">
      <div className="status-line">
        <span
          className={playerSync.isOnline && playerSync.status !== 'error' ? 'status-dot online' : 'status-dot'}
          aria-hidden
        />
        <StatusIcon className="nav-icon" aria-hidden />
        <span>{playerSync.isOnline ? 'Online' : 'Offline'} · {syncLabel}</span>
      </div>
      <p>{playerSync.errorMessage ?? detail}</p>
    </section>
  )
}
