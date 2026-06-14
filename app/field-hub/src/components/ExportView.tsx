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
  buildPlayersCsv,
  buildProgressCsv,
  downloadTextFile,
} from '../lib/csvExport'
import { AuthPanel } from './AuthPanel'

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
}

const emptySummary: ExportSummary = {
  players: 0,
  sessionLogs: 0,
  playerSessionEntries: 0,
  progressEntries: 0,
  baselineEntries: 0,
  returnerEntries: 0,
}

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
  }
}

function downloadJson(filename: string, payload: unknown) {
  downloadTextFile(filename, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8')
}

export function ExportView({
  authState,
  lastExportAt,
  onDataChanged,
  onExportComplete,
}: ExportViewProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [importPayload, setImportPayload] = useState<unknown>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [summary, setSummary] = useState<ExportSummary>(emptySummary)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const userId = authState.status === 'signed-in' ? authState.user.id : null

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
        <AuthPanel authState={authState} />
        <section className="placeholder" aria-labelledby="export-locked-heading">
          <FileDown className="placeholder-icon" aria-hidden />
          <h2 id="export-locked-heading">Export</h2>
          <p>Backups und CSV-Exporte sind nach Coach-Login verfuegbar.</p>
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

    const backup = await createFieldHubBackup(userId)
    downloadJson(`field-hub-backup-${todayStamp()}.json`, backup)
    await markExportComplete(userId)
  }

  async function handleCsvExport(kind: 'players' | 'checkIns' | 'progress' | 'baseline') {
    if (!userId) {
      return
    }

    const backup = await createFieldHubBackup(userId)
    const filename = `field-hub-${kind}-${todayStamp()}.csv`
    const content =
      kind === 'players'
        ? buildPlayersCsv(backup.data.players)
        : kind === 'checkIns'
          ? buildCheckInsCsv(backup.data.playerSessionEntries, backup.data.players, backup.data.sessionLogs)
          : kind === 'progress'
            ? buildProgressCsv(backup.data.progressEntries, backup.data.players, backup.data.sessionLogs)
            : buildBaselineCsv(backup.data.baselineEntries, backup.data.players, backup.data.sessionLogs)

    downloadTextFile(filename, content, 'text/csv;charset=utf-8')
    await markExportComplete(userId)
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
      setImportResult(`${result.importedRecords} Datensaetze lokal importiert und fuer Sync vorgemerkt.`)
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
              Vollstaendiges JSON-Backup fuer Wiederherstellung; CSV-Dateien fuer Weiterverarbeitung.
              Profilfotos bleiben im privaten Supabase-Storage und werden nicht als Bilddatei exportiert.
            </p>
          </div>
        </div>

        <div className="metric-grid">
          <div className="metric">
            <span>Spieler</span>
            <strong>{summary.players}</strong>
          </div>
          <div className="metric">
            <span>Einheiten</span>
            <strong>{summary.sessionLogs}</strong>
          </div>
          <div className="metric">
            <span>Check-ins</span>
            <strong>{summary.playerSessionEntries}</strong>
          </div>
          <div className="metric">
            <span>Progression</span>
            <strong>{summary.progressEntries}</strong>
          </div>
          <div className="metric">
            <span>Baseline</span>
            <strong>{summary.baselineEntries}</strong>
          </div>
          <div className="metric">
            <span>Returner</span>
            <strong>{summary.returnerEntries}</strong>
          </div>
        </div>

        <div className="export-actions">
          <button className="primary-action" type="button" onClick={() => void handleJsonExport()}>
            <FileJson className="nav-icon" aria-hidden />
            <span>Komplettes JSON-Backup</span>
          </button>
          <button className="secondary-action" type="button" onClick={() => void handleCsvExport('players')}>
            <Download className="nav-icon" aria-hidden />
            <span>CSV Spieler</span>
          </button>
          <button className="secondary-action" type="button" onClick={() => void handleCsvExport('checkIns')}>
            <Download className="nav-icon" aria-hidden />
            <span>CSV Check-ins</span>
          </button>
          <button className="secondary-action" type="button" onClick={() => void handleCsvExport('progress')}>
            <Download className="nav-icon" aria-hidden />
            <span>CSV Progression</span>
          </button>
          <button className="secondary-action" type="button" onClick={() => void handleCsvExport('baseline')}>
            <Download className="nav-icon" aria-hidden />
            <span>CSV Baseline/Testwerte</span>
          </button>
        </div>

        <div className="warning-note">
          <AlertTriangle className="nav-icon" aria-hidden />
          <span>
            Letzter Export:{' '}
            {lastExportAt ? new Date(lastExportAt).toLocaleString('de-AT') : 'noch kein Export auf diesem Geraet'}.
            Daten liegen in Supabase und lokal im Geraete-Cache. Export ist ein Zusatzbackup, kein Ersatz fuer Sync.
          </span>
        </div>
      </section>

      <section className="panel export-panel" aria-labelledby="import-heading">
        <div className="status-line">
          <Upload className="nav-icon" aria-hidden />
          <div>
            <h3 id="import-heading">JSON-Import</h3>
            <p>
              Import fuehrt einen Merge aus: neue IDs werden ergaenzt, vorhandene IDs werden erst nach Warnung
              per client_updated_at / last-write-wins uebernommen. Es wird nichts automatisch geloescht.
            </p>
          </div>
        </div>

        <label className="file-upload-control">
          <span>Backup-Datei waehlen</span>
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
              {importPreview.totals.skippedOlderRecords} lokale neuere Datensaetze bleiben erhalten.
            </p>
            {importPreview.errors.length > 0 ? (
              <ul className="compact-list">
                {importPreview.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
            <button
              className="primary-action"
              disabled={!importPreview.valid}
              type="button"
              onClick={() => void confirmImport()}
            >
              Import mit Warnung bestaetigen
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
