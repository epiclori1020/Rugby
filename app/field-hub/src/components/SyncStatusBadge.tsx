import { CloudOff } from 'lucide-react'
import type { PlayerSyncOverview } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'

type SyncStatusBadgeProps = {
  authState: AuthSessionState
  isManualSyncing: boolean
  onManualSync: () => void
  playerSync: PlayerSyncOverview
}

export function SyncStatusBadge({
  authState,
  isManualSyncing,
  onManualSync,
  playerSync,
}: SyncStatusBadgeProps) {
  const syncLabel =
    authState.status === 'missing-config'
      ? 'Setup offen'
      : authState.status === 'signed-in'
        ? playerSync.isOnline
          ? playerSync.status
          : 'offline'
        : 'Login offen'

  const detail =
    authState.status === 'missing-config'
      ? 'Supabase URL und publishable key fehlen lokal.'
      : authState.status === 'signed-in'
        ? `${playerSync.pendingCount} pending${
            playerSync.lastSuccessfulSyncAt ? ` · letzter Sync ${new Date(playerSync.lastSuccessfulSyncAt).toLocaleString('de-AT')}` : ''
          }`
        : 'Dynamische Daten werden erst nach Login geladen.'
  const canSync = authState.status === 'signed-in' && playerSync.isOnline && !isManualSyncing

  return (
    <section className="sync-status" aria-label="Sync Status">
      <div className="status-line">
        <span
          className={playerSync.isOnline && playerSync.status !== 'error' ? 'status-dot online' : 'status-dot'}
          aria-hidden
        />
        <CloudOff className="nav-icon" aria-hidden />
        <span>{playerSync.isOnline ? 'Online' : 'Offline'} · {syncLabel}</span>
      </div>
      <p>{playerSync.errorMessage ?? detail}</p>
      {authState.status === 'signed-in' ? (
        <p className="sync-conflict-note">
          Konflikt-MVP: Bei iPad/iPhone-Abweichungen gewinnt der neuere client_updated_at-Stand.
        </p>
      ) : null}
      {authState.status === 'signed-in' ? (
        <button className="secondary-action compact-action" disabled={!canSync} type="button" onClick={onManualSync}>
          {isManualSyncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
        </button>
      ) : null}
    </section>
  )
}
