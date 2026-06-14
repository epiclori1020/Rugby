import { RefreshCw } from 'lucide-react'

type PwaUpdateNoticeProps = {
  onReload: () => void
}

export function PwaUpdateNotice({ onReload }: PwaUpdateNoticeProps) {
  return (
    <div className="pwa-update-notice" role="status" aria-live="polite">
      <span>Neue App-Version bereit</span>
      <button className="secondary-action compact-action" type="button" onClick={onReload}>
        <RefreshCw className="nav-icon" aria-hidden />
        <span>Aktualisieren</span>
      </button>
    </div>
  )
}
