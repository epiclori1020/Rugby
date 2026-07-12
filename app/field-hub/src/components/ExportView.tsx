import { AlertTriangle, Download, FileDown, FileJson, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AuthSessionState } from '../lib/auth'
import {
  createFieldHubBackup,
  importFieldHubBackup,
  previewFieldHubBackupImport,
  setLastExportAt,
  type FieldHubBackupV1,
  type ImportPreview,
} from '../lib/backupRepository'
import {
  buildBaselineCsv,
  buildCheckInsCsv,
  buildExerciseResultsCsv,
  buildExposureSummariesCsv,
  buildMetricResultsCsv,
  buildPlayersCsv,
  buildProgressCsv,
  buildSessionBlocksCsv,
  downloadTextFile,
} from '../lib/csvExport'
import { MetricTile } from './onfield'
import { PrimaryButton, SecondaryButton, Sheet } from './ui'

type CsvExportKind = 'players' | 'checkIns' | 'progress' | 'baseline' | 'sessionBlocks' | 'exposures' | 'exercises' | 'metrics'

type ExportViewProps = {
  authState: AuthSessionState
  lastExportAt: string | null
  onDataChanged: () => Promise<void>
  onExportComplete: (exportedAt: string) => void
}

type ExportSummary = {
  players: number
  sessionLogs: number
  playerSessionEntries: number
  progressEntries: number
  baselineEntries: number
  returnerEntries: number
  sessionBlockLogs: number
  playerExposureSummaries: number
  exerciseResults: number
  metricResults: number
}

const emptySummary: ExportSummary = {
  players: 0,
  sessionLogs: 0,
  playerSessionEntries: 0,
  progressEntries: 0,
  baselineEntries: 0,
  returnerEntries: 0,
  sessionBlockLogs: 0,
  playerExposureSummaries: 0,
  exerciseResults: 0,
  metricResults: 0,
}

const csvExportActions: Array<{ kind: CsvExportKind; label: string; resultLabel: string }> = [
  { kind: 'players', label: 'Spieler', resultLabel: 'Spieler' },
  { kind: 'checkIns', label: 'Check-ins', resultLabel: 'Check-ins' },
  { kind: 'progress', label: 'Progression', resultLabel: 'Progression' },
  { kind: 'baseline', label: 'Baseline/Testwerte', resultLabel: 'Baseline/Testwerte' },
  { kind: 'sessionBlocks', label: 'Blockstatus', resultLabel: 'Blockstatus' },
  { kind: 'exposures', label: 'Belastungsübersichten', resultLabel: 'Belastungsübersichten' },
  { kind: 'exercises', label: 'Übungsergebnisse', resultLabel: 'Übungsergebnisse' },
  { kind: 'metrics', label: 'Flexible Messwerte', resultLabel: 'Flexible Messwerte' },
]

const summaryMetrics: Array<{ key: keyof ExportSummary; label: string }> = [
  { key: 'players', label: 'Spieler' },
  { key: 'sessionLogs', label: 'Einheiten' },
  { key: 'playerSessionEntries', label: 'Check-ins' },
  { key: 'progressEntries', label: 'Progression' },
  { key: 'baselineEntries', label: 'Baseline' },
  { key: 'returnerEntries', label: 'Returner' },
  { key: 'sessionBlockLogs', label: 'Blockstatus' },
  { key: 'playerExposureSummaries', label: 'Belastungsübersichten' },
  { key: 'exerciseResults', label: 'Übungsergebnisse' },
  { key: 'metricResults', label: 'Flexible Messwerte' },
]

function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

function summaryFromBackup(backup: FieldHubBackupV1): ExportSummary {
  return {
    players: backup.data.players.length,
    sessionLogs: backup.data.sessionLogs.length,
    playerSessionEntries: backup.data.playerSessionEntries.length,
    progressEntries: backup.data.progressEntries.length,
    baselineEntries: backup.data.baselineEntries.length,
    returnerEntries: backup.data.returnerEntries.length,
    sessionBlockLogs: backup.data.sessionBlockLogs?.length ?? 0,
    playerExposureSummaries: backup.data.playerExposureSummaries?.length ?? 0,
    exerciseResults: backup.data.exerciseResults?.length ?? 0,
    metricResults: backup.data.metricResults?.length ?? 0,
  }
}

function downloadJson(filename: string, payload: unknown) {
  downloadTextFile(filename, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8')
}

function csvLabelForKind(kind: CsvExportKind) {
  return csvExportActions.find((action) => action.kind === kind)?.resultLabel ?? 'CSV'
}

export function ExportView({
  authState,
  lastExportAt,
  onDataChanged,
  onExportComplete,
}: ExportViewProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null)
  const [importPayload, setImportPayload] = useState<unknown>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [exportResult, setExportResult] = useState<string | null>(null)
  const [summary, setSummary] = useState<ExportSummary>(emptySummary)
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const userId = authState.status === 'signed-in' ? authState.user.id : null
  const totalRecords = Object.values(summary).reduce((total, count) => total + count, 0)

  useEffect(() => {
    if (!userId) {
      return
    }

    Promise.resolve()
      .then(() => createFieldHubBackup(userId))
      .then((backup) => setSummary(summaryFromBackup(backup)))
      .catch(() => undefined)
  }, [userId])

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <section className="placeholder" aria-labelledby="export-locked-heading">
          <FileDown className="placeholder-icon" aria-hidden />
          <h2 id="export-locked-heading">Export & Backup</h2>
          <p>Coach-Login noetig. Danach sind Backup, CSV-Tabellen und Import-Vorschau hier verfuegbar.</p>
        </section>
      </div>
    )
  }

  async function markExportComplete(userId: string) {
    const exportedAt = await setLastExportAt(userId)
    onExportComplete(exportedAt)
    setSummary(summaryFromBackup(await createFieldHubBackup(userId)))
  }

  async function handleJsonExport() {
    if (!userId) {
      return
    }

    setExportErrorMessage(null)
    setExportResult(null)

    try {
      const backup = await createFieldHubBackup(userId)
      downloadJson(`onfield-coach-backup-${todayStamp()}.json`, backup)
      await markExportComplete(userId)
      setExportResult('JSON-Backup: Download gestartet.')
    } catch (caughtError) {
      setExportErrorMessage(caughtError instanceof Error ? caughtError.message : 'JSON-Backup konnte nicht exportiert werden.')
    }
  }

  async function handleCsvExport(kind: CsvExportKind) {
    if (!userId) {
      return
    }

    setExportErrorMessage(null)
    setExportResult(null)

    try {
      const backup = await createFieldHubBackup(userId)
      const filename = `onfield-coach-${kind}-${todayStamp()}.csv`
      const content =
        kind === 'players'
          ? buildPlayersCsv(backup.data.players)
          : kind === 'checkIns'
            ? buildCheckInsCsv(backup.data.playerSessionEntries, backup.data.players, backup.data.sessionLogs)
            : kind === 'progress'
              ? buildProgressCsv(backup.data.progressEntries, backup.data.players, backup.data.sessionLogs)
              : kind === 'baseline'
                ? buildBaselineCsv(backup.data.baselineEntries, backup.data.players, backup.data.sessionLogs)
                : kind === 'sessionBlocks'
                  ? buildSessionBlocksCsv(backup.data.sessionBlockLogs ?? [], backup.data.sessionLogs)
                  : kind === 'exposures'
                    ? buildExposureSummariesCsv(backup.data.playerExposureSummaries ?? [], backup.data.players, backup.data.sessionLogs)
                    : kind === 'exercises'
                      ? buildExerciseResultsCsv(backup.data.exerciseResults ?? [], backup.data.players, backup.data.sessionLogs)
                      : buildMetricResultsCsv(backup.data.metricResults ?? [], backup.data.players, backup.data.sessionLogs)

      downloadTextFile(filename, content, 'text/csv;charset=utf-8')
      await markExportComplete(userId)
      setExportResult(`CSV ${csvLabelForKind(kind)}: Download gestartet.`)
    } catch (caughtError) {
      setExportErrorMessage(caughtError instanceof Error ? caughtError.message : 'CSV konnte nicht exportiert werden.')
    }
  }

  async function handleImportFile(file: File) {
    if (!userId) {
      return
    }

    setErrorMessage(null)
    setImportResult(null)

    try {
      const text = await file.text()
      const parsedPayload = JSON.parse(text) as unknown
      const preview = await previewFieldHubBackupImport(userId, parsedPayload)
      setImportPayload(parsedPayload)
      setImportPreview(preview)
    } catch (caughtError) {
      setImportPayload(null)
      setImportPreview(null)
      setErrorMessage(caughtError instanceof Error ? caughtError.message : 'Backup-Datei konnte nicht gelesen werden.')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function confirmImport() {
    if (!userId || !importPayload || !importPreview?.valid) {
      return
    }

    try {
      const result = await importFieldHubBackup(userId, importPayload, { confirmOverwrite: true })
      const localOnlyRecords = result.preview?.totals.localOnlyRecords ?? importPreview.totals.localOnlyRecords
      setImportResult(
        localOnlyRecords > 0
          ? `${result.importedRecords} Datensaetze lokal importiert. ${localOnlyRecords} historische Eintraege bleiben nur lokal; andere Aenderungen warten auf Sync.`
          : `${result.importedRecords} Datensaetze lokal importiert. Aenderungen warten auf Sync.`,
      )
      setImportPayload(null)
      setImportPreview(null)
      setSummary(summaryFromBackup(await createFieldHubBackup(userId)))
      await onDataChanged()
    } catch (caughtError) {
      setErrorMessage(caughtError instanceof Error ? caughtError.message : 'Import fehlgeschlagen.')
    }
  }

  return (
    <div className="content-stack">
      <section className="panel export-panel" aria-labelledby="export-heading">
        <div className="status-line">
          <FileDown className="nav-icon" aria-hidden />
          <div>
            <h3 id="export-heading">Export und Backup</h3>
            <p>
              Werkzeugbereich fuer sichere Ablage: JSON stellt OnField-Daten wieder her, CSV-Dateien
              sind Tabellen fuer Analyse und Weitergabe. Profilfotos bleiben im privaten Supabase-Storage
              und werden nicht als Bilddatei exportiert.
            </p>
          </div>
        </div>

        <div className="export-summary-metrics">
          <MetricTile label="Spieler" value={summary.players} detail="im Backup" />
          <MetricTile label="Einheiten" value={summary.sessionLogs} detail="lokal erfasst" />
          <MetricTile label="Datensätze gesamt" value={totalRecords} detail="ohne Foto-Dateien" />
        </div>

        <details className="export-coverage-details">
          <summary>Datenumfang im Detail</summary>
          <dl className="export-coverage-list">
            {summaryMetrics.map((metric) => (
              <div key={metric.key}>
                <dt>{metric.label}</dt>
                <dd className="of-num">{summary[metric.key]}</dd>
              </div>
            ))}
          </dl>
        </details>

        <div className="export-utility-grid">
          <section className="export-utility-section" aria-labelledby="backup-export-heading">
            <div>
              <p className="eyebrow">Komplettes Backup</p>
              <h4 id="backup-export-heading">JSON-Backup</h4>
              <p className="sync-help">Vollstaendige Wiederherstellung fuer dieses Coach-Konto.</p>
            </div>
            <PrimaryButton icon={<FileJson aria-hidden />} onClick={() => void handleJsonExport()}>
              Komplettes Backup herunterladen
            </PrimaryButton>
          </section>

          <section className="export-utility-section" aria-labelledby="csv-export-heading">
            <div>
              <p className="eyebrow">CSV-Tabellen</p>
              <h4 id="csv-export-heading">Arbeitsdaten exportieren</h4>
              <p className="sync-help">Tabellen funktionieren auch mit leeren Daten und bleiben ohne Foto-Dateien.</p>
            </div>
            <div className="export-action-list">
              {csvExportActions.map((action) => (
                <div className="export-action-row" key={action.kind}>
                  <span>{action.label}</span>
                  <SecondaryButton
                    compact
                    icon={<Download aria-hidden />}
                    onClick={() => void handleCsvExport(action.kind)}
                  >
                    CSV {action.label}
                  </SecondaryButton>
                </div>
              ))}
            </div>
          </section>
        </div>

        {exportResult ? <p className="form-success">{exportResult}</p> : null}
        {exportErrorMessage ? <p className="form-error">{exportErrorMessage}</p> : null}

        <div className="warning-note">
          <AlertTriangle className="nav-icon" aria-hidden />
          <span>
            Letzter Export:{' '}
            {lastExportAt ? new Date(lastExportAt).toLocaleString('de-AT') : 'noch kein Export auf diesem Geraet'}.
            Daten liegen in Supabase und lokal im Geraete-Cache. Export ist ein Zusatzbackup, kein Ersatz fuer Sync.
          </span>
        </div>
      </section>

      <section className="panel export-panel export-import-entry" aria-labelledby="import-heading">
        <div className="status-line">
          <Upload className="nav-icon" aria-hidden />
          <div>
            <p className="eyebrow">Import-Vorschau</p>
            <h3 id="import-heading">Import pruefen</h3>
            <p>
              Backup-Datei in einem fokussierten Schritt prüfen. Erst die Vorschau, dann die bewusste Bestätigung.
            </p>
          </div>
        </div>
        <SecondaryButton icon={<Upload aria-hidden />} onClick={() => setIsImportSheetOpen(true)}>
          Backup-Datei pruefen
        </SecondaryButton>
      </section>

      {isImportSheetOpen ? (
        <Sheet
          title="Import-Vorschau"
          description="Es wird nichts automatisch gelöscht."
          onClose={() => setIsImportSheetOpen(false)}
        >
          <div className="export-import-sheet">
            <label className="file-upload-control">
              <span>Backup-Datei pruefen</span>
              <input
                accept="application/json,.json"
                ref={fileInputRef}
                type="file"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (file) {
                    void handleImportFile(file)
                  }
                }}
              />
            </label>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            {importResult ? <p className="form-success">{importResult}</p> : null}

            {importPreview ? (
              <div className={importPreview.valid ? 'import-preview' : 'import-preview danger'}>
                <strong>{importPreview.valid ? 'Import-Vorschau' : 'Import blockiert'}</strong>
                <p>
                  {importPreview.totals.totalRecords} Datensaetze in Datei · {importPreview.totals.newRecords} neu ·{' '}
                  {importPreview.totals.overwriteCandidates} moegliche Ueberschreibungen ·{' '}
                  {importPreview.totals.skippedOlderRecords} lokale neuere Datensaetze bleiben erhalten
                  {importPreview.totals.localOnlyRecords > 0
                    ? ` · ${importPreview.totals.localOnlyRecords} historische Eintraege bleiben nur lokal`
                    : ''}
                </p>
                {importPreview.errors.length > 0 ? (
                  <ul className="compact-list">
                    {importPreview.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                ) : null}
                <PrimaryButton
                  disabled={!importPreview.valid}
                  disabledReason={!importPreview.valid ? 'Behebe zuerst die Fehler in der Import-Vorschau.' : undefined}
                  onClick={() => void confirmImport()}
                >
                  Import bestaetigen
                </PrimaryButton>
              </div>
            ) : null}
          </div>
        </Sheet>
      ) : null}
    </div>
  )
}
