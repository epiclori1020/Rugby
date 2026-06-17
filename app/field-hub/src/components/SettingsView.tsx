import { Cloud, CloudOff, Download, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react'
import type { HubTab } from '../App'
import type { SessionLog } from '../domain/checkIn'
import type { PlayerSyncOverview } from '../domain/sync'
import type { StoragePersistenceState } from '../hooks/useStoragePersistence'
import type { AuthSessionState } from '../lib/auth'
import type { ManualSyncFeedback } from '../lib/syncRepository'
import { pendingCountLabel, syncStatusLabel } from '../lib/syncLabels'
import { AuthPanel } from './AuthPanel'

type SettingsViewProps = {
  authState: AuthSessionState
  backupRecommended: boolean
  isManualSyncing: boolean
  lastExportAt: string | null
  latestCompletedSession: SessionLog | null
  needsAppRefresh: boolean
  onManualSync: () => void
  onNavigate: (tab: HubTab) => void
  onReloadApp: () => void
  storagePersistence: StoragePersistenceState
  syncFeedback: ManualSyncFeedback | null
  syncOverview: PlayerSyncOverview
}

function formatTimestamp(timestamp: string | null) {
  return timestamp ? new Date(timestamp).toLocaleString('de-AT') : 'noch nicht vorhanden'
}

function storageStatusLabel(status: StoragePersistenceState['status']) {
  if (status === 'persisted') {
    return 'dauerhafter Speicher bestaetigt'
  }

  if (status === 'checking') {
    return 'wird geprueft'
  }

  if (status === 'unsupported') {
    return 'nicht unterstuetzt'
  }

  if (status === 'denied') {
    return 'nicht bestaetigt'
  }

  return 'nicht pruefbar'
}

function manualSyncFeedbackClassName(kind: ManualSyncFeedback['kind']) {
  if (kind === 'success') {
    return 'form-success'
  }

  if (kind === 'warning') {
    return 'form-warning'
  }

  return 'form-error'
}

function storageStatusDotClassName(status: StoragePersistenceState['status']) {
  return status === 'persisted' ? 'status-dot online' : 'status-dot'
}

export function SettingsView({
  authState,
  backupRecommended,
  isManualSyncing,
  lastExportAt,
  latestCompletedSession,
  needsAppRefresh,
  onManualSync,
  onNavigate,
  onReloadApp,
  storagePersistence,
  syncFeedback,
  syncOverview,
}: SettingsViewProps) {
  const canManualSync = authState.status === 'signed-in' && syncOverview.isOnline && !isManualSyncing
  const SyncIcon = syncOverview.isOnline ? Cloud : CloudOff

  return (
    <div className="settings-layout">
      <AuthPanel authState={authState} />

      <section className="panel settings-panel" aria-labelledby="settings-sync-heading">
        <div className="status-line">
          <SyncIcon className="nav-icon" aria-hidden />
          <div>
            <h3 id="settings-sync-heading">Synchronisierung</h3>
            <p>Ein Button fuer Spieler, Check-ins, Training, Nachbereitung, Baseline und Returner.</p>
          </div>
        </div>
        <div className="metric-grid mini">
          <div className="metric">
            <span>Status</span>
            <strong>{syncOverview.isOnline ? 'Online' : 'Offline'}</strong>
          </div>
          <div className="metric">
            <span>Aenderungen</span>
            <strong>{syncOverview.pendingCount}</strong>
          </div>
          <div className="metric">
            <span>Sync</span>
            <strong>{syncStatusLabel(syncOverview.status)}</strong>
          </div>
          <div className="metric">
            <span>Letzter Sync</span>
            <strong>{syncOverview.lastSuccessfulSyncAt ? 'vorhanden' : 'offen'}</strong>
            <small>{formatTimestamp(syncOverview.lastSuccessfulSyncAt)}</small>
          </div>
        </div>
        {syncOverview.errorMessage ? <p className="form-error">{syncOverview.errorMessage}</p> : null}
        {syncFeedback ? <p className={manualSyncFeedbackClassName(syncFeedback.kind)}>{syncFeedback.message}</p> : null}
        <button className="primary-action" disabled={!canManualSync} type="button" onClick={onManualSync}>
          <RefreshCw className="nav-icon" aria-hidden />
          <span>{isManualSyncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}</span>
        </button>
        <p className="sync-help">
          {pendingCountLabel(syncOverview.pendingCount)}. Bei Unterschieden zwischen Geraeten zaehlt die zuletzt
          gespeicherte Version.
        </p>
      </section>

      <section className="panel settings-panel" aria-labelledby="settings-backup-heading">
        <div className="status-line">
          <Download className="nav-icon" aria-hidden />
          <div>
            <h3 id="settings-backup-heading">Backup</h3>
            <p>Supabase ist der normale Geraete-Sync. JSON bleibt das zusaetzliche Backup.</p>
          </div>
        </div>
        <div className={backupRecommended ? 'warning-note' : 'sync-mini'}>
          <span className={backupRecommended ? 'status-dot' : 'status-dot online'} aria-hidden />
          <strong>{backupRecommended ? 'Backup empfohlen' : 'Backup-Status ok'}</strong>
          <span>
            Letzter Export: {formatTimestamp(lastExportAt)}.
            {latestCompletedSession ? ` Letzte abgeschlossene Einheit: ${latestCompletedSession.date}.` : ''}
          </span>
        </div>
        <button className="secondary-action" type="button" onClick={() => onNavigate('export')}>
          <Download className="nav-icon" aria-hidden />
          <span>Export & Backup oeffnen</span>
        </button>
      </section>

      <section className="panel settings-panel" aria-labelledby="settings-device-heading">
        <div className="status-line">
          <Smartphone className="nav-icon" aria-hidden />
          <div>
            <h3 id="settings-device-heading">Geraet & Offline</h3>
            <p>Fuer iPad/iPhone bleibt die Home-Screen-PWA die robusteste Nutzungsform.</p>
          </div>
        </div>
        <div className="sync-mini">
          <span className={storageStatusDotClassName(storagePersistence.status)} aria-hidden />
          <strong>Speicherstatus</strong>
          <span>{storageStatusLabel(storagePersistence.status)}</span>
        </div>
      </section>

      <section className="panel settings-panel" aria-labelledby="settings-app-heading">
        <div className="status-line">
          <ShieldCheck className="nav-icon" aria-hidden />
          <div>
            <h3 id="settings-app-heading">App-Version</h3>
            <p>{needsAppRefresh ? 'Neue App-Version bereit.' : 'Keine neue App-Version offen.'}</p>
          </div>
        </div>
        {needsAppRefresh ? (
          <button className="secondary-action" type="button" onClick={onReloadApp}>
            <RefreshCw className="nav-icon" aria-hidden />
            <span>Aktualisieren</span>
          </button>
        ) : null}
      </section>
    </div>
  )
}
