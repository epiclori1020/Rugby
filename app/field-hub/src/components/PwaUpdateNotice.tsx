import { RefreshCw } from 'lucide-react'
import { SafetyNotice, SecondaryButton } from './ui'

type PwaUpdateNoticeProps = {
  onReload: () => void
}

export function PwaUpdateNotice({ onReload }: PwaUpdateNoticeProps) {
  return (
    <div className="pwa-update-notice" role="status" aria-live="polite">
      <SafetyNotice title="Neue App-Version bereit" tone="info">
        Aktualisieren, wenn gerade kein Eintrag offen ist.
      </SafetyNotice>
      <SecondaryButton compact icon={<RefreshCw />} onClick={onReload}>
        Aktualisieren
      </SecondaryButton>
    </div>
  )
}
