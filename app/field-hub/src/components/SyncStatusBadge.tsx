import { AlertTriangle, Cloud, CloudOff } from 'lucide-react'
import type { PlayerSyncOverview } from '../domain/sync'
import type { AuthSessionState } from '../lib/auth'

type SyncStatusBadgeProps = {
  authState: AuthSessionState
  isManualSyncing: boolean
  onManualSync: () => void
  playerSync: PlayerSyncOverview
  syncNotice?: string | null
}

export function SyncStatusBadge({
  authState,
  isManualSyncing,
  onManualSync,
  playerSync,
  syncNotice = null,
}: SyncStatusBadgeProps) {
  const syncLabel =
    authState.status === 'missing-config'
      ? 'Setup offen'
      : authState.status === 'signed-in'
        ? !playerSync.isOnline
          ? 'lokal gespeichert'
          : playerSync.status === 'error' || playerSync.errorMessage
            ? 'Sync-Fehler'
            : playerSync.status === 'pending' || playerSync.pendingCount > 0
              ? 'Aenderungen offen'
              : 'synchronisiert'
        : 'Login offen'

  const detail =
    authState.status === 'missing-config'
      ? 'Supabase URL und publishable key fehlen lokal.'
      : authState.status === 'signed-in'
        ? `${playerSync.pendingCount} Aenderungen offen${
            playerSync.lastSuccessfulSyncAt ? ` · letzter Sync ${new Date(playerSync.lastSuccessfulSyncAt).toLocaleString('de-AT')}` : ''
          }`
        : 'Dynamische Daten werden erst nach Login geladen.'
  const canSync = authState.status === 'signed-in' && playerSync.isOnline && !isManualSyncing
  const StatusIcon =
    authState.status === 'signed-in' && (playerSync.status === 'error' || playerSync.errorMessage)
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
      {syncNotice ? <p className="form-success sync-notice">{syncNotice}</p> : null}
      {authState.status === 'signed-in' ? (
        <p className="sync-conflict-note">
          Sync-Hinweis: Bei Unterschieden zwischen Geraeten zaehlt die zuletzt gespeicherte Version.
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
