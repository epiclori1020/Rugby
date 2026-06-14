import { FileDown, X } from 'lucide-react'
import type { HubTab } from '../App'
import type { SessionLog } from '../domain/checkIn'

type BackupReminderBannerProps = {
  lastExportAt: string | null
  onDismiss: () => void
  onNavigate: (tab: HubTab) => void
  sessionLog: SessionLog
}

export function BackupReminderBanner({
  lastExportAt,
  onDismiss,
  onNavigate,
  sessionLog,
}: BackupReminderBannerProps) {
  return (
    <section className="backup-reminder" aria-label="Backup Hinweis">
      <div className="status-line">
        <FileDown className="nav-icon" aria-hidden />
        <div>
          <strong>Einheit abgeschlossen, Backup offen</strong>
          <p>
            Letzter Export:{' '}
            {lastExportAt ? new Date(lastExportAt).toLocaleString('de-AT') : 'noch kein Export auf diesem Geraet'}.
            Daten liegen in Supabase und lokal im Geraete-Cache; JSON bleibt das zusaetzliche Backup.
          </p>
        </div>
      </div>
      <div className="button-row compact">
        <button className="primary-action compact-action" type="button" onClick={() => onNavigate('export')}>
          <FileDown className="nav-icon" aria-hidden />
          <span>Export oeffnen</span>
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={`Backup-Hinweis fuer ${sessionLog.date} vorlaeufig ausblenden`}
          onClick={onDismiss}
        >
          <X className="nav-icon" aria-hidden />
        </button>
      </div>
    </section>
  )
}
