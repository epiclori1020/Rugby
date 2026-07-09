import type { ReactNode } from 'react'

export type SessionHeaderMetric = {
  label: string
  value: string
}

type SessionHeaderProps = {
  title: string
  subtitle?: string
  meta?: string[]
  metrics?: SessionHeaderMetric[]
  action?: ReactNode
}

export function SessionHeader({ action, meta = [], metrics = [], subtitle, title }: SessionHeaderProps) {
  return (
    <section className="of-session-header" aria-label="Einheit">
      <div className="of-session-header-main">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {meta.length > 0 ? (
        <div className="of-session-header-meta">
          {meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
      {metrics.length > 0 ? (
        <div className="of-session-header-metrics">
          {metrics.map((metric) => (
            <div className="of-session-header-metric" key={metric.label}>
              <strong className="of-num">{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
