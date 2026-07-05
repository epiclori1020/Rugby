import { AlertTriangle, Info } from 'lucide-react'
import type { ReactNode } from 'react'

type SafetyNoticeProps = {
  title: string
  children: ReactNode
  tone?: 'info' | 'warning' | 'danger'
  live?: boolean
}

export function SafetyNotice({ children, live, title, tone = 'warning' }: SafetyNoticeProps) {
  const Icon = tone === 'info' ? Info : AlertTriangle

  return (
    <section
      className={`of-safety-notice of-safety-${tone}`}
      role={tone === 'danger' ? 'alert' : live ? 'status' : undefined}
      aria-live={live ? 'polite' : undefined}
    >
      <Icon className="of-status-icon" aria-hidden />
      <div>
        <h3>{title}</h3>
        <div className="of-safety-body">{children}</div>
      </div>
    </section>
  )
}
