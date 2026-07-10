import { AlertTriangle, CheckCircle2, CircleDashed, Cloud, CloudOff, Info, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'
export type TrafficTone = 'green' | 'yellow' | 'red' | 'open'

const statusIcons: Record<Exclude<StatusTone, 'neutral'>, ReactNode> = {
  success: <CheckCircle2 />,
  warning: <AlertTriangle />,
  danger: <AlertTriangle />,
  info: <Info />,
}

const trafficIcons: Record<TrafficTone, ReactNode> = {
  green: <CheckCircle2 />,
  yellow: <AlertTriangle />,
  red: <AlertTriangle />,
  open: <CircleDashed />,
}

type StatusChipProps = {
  label: string
  tone?: StatusTone
  icon?: ReactNode
}

export function StatusChip({ icon, label, tone = 'neutral' }: StatusChipProps) {
  const effectiveIcon = icon ?? (tone === 'neutral' ? null : statusIcons[tone])

  return (
    <span className={`of-status-chip of-status-chip-${tone}`}>
      {effectiveIcon ? <span className="of-status-icon" aria-hidden>{effectiveIcon}</span> : null}
      <span>{label}</span>
    </span>
  )
}

type TrafficLightChipProps = {
  tone: TrafficTone
  label: string
  reason?: string
}

export function TrafficLightChip({ label, reason, tone }: TrafficLightChipProps) {
  return (
    <span className={`of-traffic-chip of-traffic-${tone}`} aria-label={reason ? `${label}: ${reason}` : label}>
      <span className="of-traffic-icon" aria-hidden>{trafficIcons[tone]}</span>
      <span>{label}</span>
      {reason ? <span>· {reason}</span> : null}
    </span>
  )
}

export type SyncStatusTone = 'synced' | 'pending' | 'error' | 'offline' | 'syncing'

type SyncStatusProps = {
  label: string
  detail?: string
  tone: SyncStatusTone
}

const syncIcon: Record<SyncStatusTone, ReactNode> = {
  synced: <Cloud />,
  pending: <Cloud />,
  syncing: <RefreshCw />,
  error: <AlertTriangle />,
  offline: <CloudOff />,
}

const syncDotTone: Record<SyncStatusTone, string> = {
  synced: 'of-status-dot-success',
  pending: '',
  syncing: 'of-status-dot-info',
  error: 'of-status-dot-danger',
  offline: '',
}

export function SyncStatus({ detail, label, tone }: SyncStatusProps) {
  return (
    <section className="of-sync-status" aria-label="Sync Status" role="status" aria-live="polite">
      <div className="of-sync-line">
        <span className={`of-status-dot ${syncDotTone[tone]}`} aria-hidden />
        <span className="of-status-icon" aria-hidden>{syncIcon[tone]}</span>
        <span>{label}</span>
      </div>
      {detail ? <p>{detail}</p> : null}
    </section>
  )
}

type OfflineBannerProps = {
  message: string
  detail?: string
}

export function OfflineBanner({ detail, message }: OfflineBannerProps) {
  return (
    <section className="of-offline-banner" role="status" aria-live="polite">
      <div className="of-offline-banner-line">
        <CloudOff className="of-status-icon" aria-hidden />
        <strong>{message}</strong>
      </div>
      {detail ? <p>{detail}</p> : null}
    </section>
  )
}
