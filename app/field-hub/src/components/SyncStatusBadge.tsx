import type { PlayerSyncOverview } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'
import { shouldShowSyncAttention } from '../lib/syncLabels'
import { SyncStatus, type SyncStatusTone } from './ui'

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
  const tone: SyncStatusTone =
    !playerSync.isOnline
      ? 'offline'
      : playerSync.status === 'error' || playerSync.errorMessage
        ? 'error'
        : 'pending'

  return (
    <SyncStatus
      detail={playerSync.errorMessage ?? detail}
      label={`${playerSync.isOnline ? 'Online' : 'Offline'} · ${syncLabel}`}
      tone={tone}
    />
  )
}
