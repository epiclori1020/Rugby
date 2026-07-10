import type { ReactNode } from 'react'
import type { ReadinessTone } from './ReadinessDot'

export type ScoreboardMetric = {
  id: string
  label: string
  value: number | string
  detail?: string
  tone: ReadinessTone
  icon?: ReactNode
  assistiveLabel?: string
}

type ScoreboardStripProps = {
  metrics: ScoreboardMetric[]
  primaryMetricId?: string
}

export function ScoreboardStrip({ metrics, primaryMetricId }: ScoreboardStripProps) {
  return (
    <dl className="of-scoreboard-strip" aria-label="Squad heute Scoreboard">
      {metrics.map((metric) => (
        <div
          className={[
            'of-scoreboard-cell',
            `of-scoreboard-cell-${metric.id}`,
            `of-scoreboard-cell-${metric.tone}`,
            metric.id === primaryMetricId ? 'of-scoreboard-cell-primary' : null,
          ]
            .filter(Boolean)
            .join(' ')}
          key={metric.id}
          data-metric-id={metric.id}
        >
          <dt>
            {metric.icon ? <span className="of-scoreboard-icon" aria-hidden>{metric.icon}</span> : null}
            <span>{metric.label}</span>
          </dt>
          <dd className="of-num" aria-label={metric.assistiveLabel}>
            {metric.value}
          </dd>
          {metric.detail ? <dd className="of-scoreboard-detail">{metric.detail}</dd> : null}
        </div>
      ))}
    </dl>
  )
}
