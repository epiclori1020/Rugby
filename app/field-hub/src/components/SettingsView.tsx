import { Cloud, CloudOff, Download, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { routes, type AppRoute } from '../navigation'
import type { SessionLog } from '../domain/checkIn'
import type { PlayerSyncOverview } from '../domain/sync'
import type { StoragePersistenceState } from '../hooks/useStoragePersistence'
import type { AuthSessionState } from '../lib/auth'
import type { ManualSyncFeedback } from '../lib/syncRepository'
import { pendingCountLabel, syncStatusLabel } from '../lib/syncLabels'
import type { ThemePreference } from '../lib/themePreference'
import { AuthPanel } from './AuthPanel'
import { BrandSurface } from './onfield'
import { ErrorState, PrimaryButton, SecondaryButton, SegmentedControl, type SegmentedControlOption } from './ui'

type SettingsViewProps = {
  authState: AuthSessionState
  backupRecommended: boolean
  isManualSyncing: boolean
  lastExportAt: string | null
  latestCompletedSession: SessionLog | null
  needsAppRefresh: boolean
  pwaDisplayMode: 'browser' | 'standalone'
  onManualSync: () => void
  onNavigate: (route: AppRoute) => void
  onReloadApp: () => void
  onThemePreferenceChange: (preference: ThemePreference) => void
  storagePersistence: StoragePersistenceState
  syncFeedback: ManualSyncFeedback | null
  syncOverview: PlayerSyncOverview
  themePreference: ThemePreference
}

const themePreferenceOptions: SegmentedControlOption<ThemePreference>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Field Mode' },
]

function formatTimestamp(timestamp: string | null) {
  return timestamp ? new Date(timestamp).toLocaleString('de-AT') : 'noch nicht vorhanden'
}

function storageStatusLabel(status: StoragePersistenceState['status']) {
  if (status === 'persisted') {
    return 'dauerhafter Speicher bestätigt'
  }

  if (status === 'checking') {
    return 'wird geprüft'
  }

  if (status === 'unsupported') {
    return 'nicht unterstützt'
  }

  if (status === 'denied') {
    return 'nicht bestätigt'
  }

  return 'nicht prüfbar'
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

function manualSyncDisabledReason({
  authState,
  isManualSyncing,
  isOnline,
}: {
  authState: AuthSessionState
  isManualSyncing: boolean
  isOnline: boolean
}) {
  if (isManualSyncing) {
    return 'Sync läuft gerade.'
  }

  if (authState.status !== 'signed-in') {
    return 'Coach-Login nötig.'
  }

  if (!isOnline) {
    return 'Offline – Änderungen bleiben lokal gespeichert.'
  }

  return null
}

export function SettingsView({
  authState,
  backupRecommended,
  isManualSyncing,
  lastExportAt,
  latestCompletedSession,
  needsAppRefresh,
  pwaDisplayMode,
  onManualSync,
  onNavigate,
  onReloadApp,
  onThemePreferenceChange,
  storagePersistence,
  syncFeedback,
  syncOverview,
  themePreference,
}: SettingsViewProps) {
  const [installStepsVisible, setInstallStepsVisible] = useState(false)
  const syncDisabledReason = manualSyncDisabledReason({
    authState,
    isManualSyncing,
    isOnline: syncOverview.isOnline,
  })
  const canManualSync = syncDisabledReason === null
  const ManualSyncButton = authState.status === 'signed-in' ? PrimaryButton : SecondaryButton
  const SyncIcon = syncOverview.isOnline ? Cloud : CloudOff
  const pwaModeLabel = pwaDisplayMode === 'standalone' ? 'PWA installiert' : 'Browser-Modus'
  const pwaModeDescription =
    pwaDisplayMode === 'standalone'
      ? 'OnField Coach läuft im Home-Screen-Modus.'
      : 'Installiere OnField Coach für mehr Platz am Spielfeldrand.'

  return (
    <div className="settings-layout settings-utility-workspace">
      <section className="panel settings-panel" aria-labelledby="settings-sync-heading">
        <div className="status-line">
          <SyncIcon className="nav-icon" aria-hidden />
          <div>
            <h3 id="settings-sync-heading">Synchronisierung</h3>
            <p>Coach-nahe Ablage für Spieler, Check-ins, Training, Nachbereitung, Baseline und Returner.</p>
          </div>
        </div>
        <dl className="settings-sync-strip">
          <div>
            <dt>Status</dt>
            <dd>{syncOverview.isOnline ? 'Online' : 'Offline'}</dd>
          </div>
          <div>
            <dt>Wartet auf Sync</dt>
            <dd className="of-num">{syncOverview.pendingCount}</dd>
          </div>
          <div>
            <dt>Sync</dt>
            <dd>{syncStatusLabel(syncOverview.status)}</dd>
          </div>
          <div>
            <dt>Letzter Sync</dt>
            <dd>{syncOverview.lastSuccessfulSyncAt ? 'vorhanden' : 'offen'}</dd>
            <small>{formatTimestamp(syncOverview.lastSuccessfulSyncAt)}</small>
          </div>
        </dl>
        {syncOverview.errorMessage ? (
          <ErrorState
            appearance="inline"
            title="Synchronisierung nicht abgeschlossen"
            body="Lokale Änderungen bleiben erhalten. Nutze die Synchronisierung unten erneut."
          />
        ) : null}
        {syncFeedback ? <p className={manualSyncFeedbackClassName(syncFeedback.kind)}>{syncFeedback.message}</p> : null}
        <ManualSyncButton
          disabled={!canManualSync}
          disabledReason={syncDisabledReason ?? undefined}
          icon={<RefreshCw aria-hidden />}
          id="manual-sync"
          isLoading={isManualSyncing}
          loadingLabel="Sync läuft gerade"
          onClick={onManualSync}
        >
          Jetzt synchronisieren
        </ManualSyncButton>
        <p className="sync-help">
          {syncOverview.pendingCount > 0
            ? `${pendingCountLabel(syncOverview.pendingCount)}.`
            : `${pendingCountLabel(syncOverview.pendingCount)}.`}{' '}
          Bei Unterschieden zwischen Geräten zählt die zuletzt gespeicherte Version.
        </p>
      </section>

      <AuthPanel authState={authState} />

      <section className="panel settings-panel" aria-labelledby="settings-backup-heading">
        <div className="status-line">
          <Download className="nav-icon" aria-hidden />
          <div>
            <h3 id="settings-backup-heading">Backup</h3>
            <p>Supabase ist der normale Geräte-Sync. JSON bleibt das zusätzliche Wiederherstellungsbackup.</p>
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
        <button className="secondary-action" type="button" onClick={() => onNavigate(routes.moreExport)}>
          <Download className="nav-icon" aria-hidden />
          <span>Export & Backup öffnen</span>
        </button>
      </section>

      <section className="panel settings-panel" aria-labelledby="settings-device-heading">
        <div className="status-line">
          <Smartphone className="nav-icon" aria-hidden />
          <div>
            <h3 id="settings-device-heading">Gerät & Offline</h3>
            <p>Für iPad/iPhone bleibt die Home-Screen-PWA die robusteste Nutzungsform.</p>
          </div>
        </div>
        <div className="sync-mini">
          <span className={storageStatusDotClassName(storagePersistence.status)} aria-hidden />
          <strong>Speicherstatus</strong>
          <span>{storageStatusLabel(storagePersistence.status)}</span>
        </div>
        <div className="sync-mini">
          <span className={pwaDisplayMode === 'standalone' ? 'status-dot online' : 'status-dot'} aria-hidden />
          <strong>{pwaModeLabel}</strong>
          <span>{pwaModeDescription}</span>
        </div>
        <div className="settings-theme-control">
          <div className="settings-theme-copy">
            <strong>Darstellung</strong>
            <span>System folgt dem Gerät. Field Mode nutzt die dunkle Sideline-Darstellung.</span>
          </div>
          <SegmentedControl
            label="Darstellung"
            onChange={onThemePreferenceChange}
            options={themePreferenceOptions}
            value={themePreference}
          />
        </div>
      </section>

      {pwaDisplayMode === 'standalone' ? (
        <BrandSurface
          body="OnField Coach läuft im Home-Screen-Modus. iPhone und iPad behalten denselben Funktionsumfang."
          className="settings-panel install-surface"
          meta={<p>Offline-Hinweise und App-Updates bleiben direkt in OnField sichtbar.</p>}
          title="OnField ist installiert"
          variant="compact"
        />
      ) : (
        <BrandSurface
          artwork="hero"
          body="Installiere OnField Coach auf iPhone oder iPad über den Home-Bildschirm. So startet die PWA mit App-Name, Icon und mehr Platz für den Trainingstag."
          className="settings-panel install-surface"
          claim="Know squad status before the whistle."
          meta={installStepsVisible ? (
            <ol className="install-steps">
              <li><strong>1.</strong> OnField in Safari öffnen.</li>
              <li><strong>2.</strong> Teilen wählen.</li>
              <li><strong>3.</strong> „Zum Home-Bildschirm“ wählen und hinzufügen.</li>
            </ol>
          ) : <p>Eine Anleitung gilt für iPhone und iPad; der Funktionsumfang bleibt gleich.</p>}
          primaryAction={
            <SecondaryButton onClick={() => setInstallStepsVisible((visible) => !visible)}>
              {installStepsVisible ? 'Installationsschritte schließen' : 'Installationsschritte anzeigen'}
            </SecondaryButton>
          }
          title="OnField als PWA nutzen"
          variant="install"
        />
      )}

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
