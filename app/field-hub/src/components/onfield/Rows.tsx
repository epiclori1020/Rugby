import type { ReactNode } from 'react'
import { ReadinessDot, type ReadinessTone } from './ReadinessDot'

type AthleteRowProps = {
  playerId?: string
  name: string
  meta?: string[]
  status?: ReactNode
  traffic?: ReactNode
  action?: ReactNode
  note?: string
  readinessTone?: ReadinessTone
  readinessLabel?: string
  trendLabel?: string
  compact?: boolean
  className?: string
}

export function AthleteRow({
  action,
  className,
  compact,
  meta = [],
  name,
  note,
  playerId,
  readinessLabel,
  readinessTone,
  status,
  traffic,
  trendLabel,
}: AthleteRowProps) {
  const rowClassName = [
    'of-athlete-row',
    readinessTone ? `of-athlete-row-${readinessTone}` : null,
    compact ? 'of-athlete-row-compact' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={rowClassName} data-player-id={playerId}>
      {readinessTone ? (
        <ReadinessDot
          label={readinessLabel ?? `Status ${readinessTone}`}
          size={compact ? 'sm' : 'md'}
          tone={readinessTone}
        />
      ) : null}
      <div className="of-athlete-row-main">
        <div>
          <h3>{name}</h3>
          {note ? <p>{note}</p> : null}
        </div>
        {meta.length > 0 ? (
          <div className="of-athlete-row-meta">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
        {trendLabel ? <span className="of-athlete-row-trend">{trendLabel}</span> : null}
        {status || traffic ? (
          <div className="of-athlete-row-status">
            {traffic}
            {status}
          </div>
        ) : null}
      </div>
      {action ? <div className="of-athlete-row-action">{action}</div> : null}
    </article>
  )
}

type TaskQueueRowProps = {
  title: string
  detail?: string
  meta?: string[]
  tone?: 'neutral' | 'warning' | 'danger' | 'success'
  action?: ReactNode
  className?: string
  ariaCurrent?: 'page' | 'step' | 'location' | 'date' | 'time' | true | false
}

export function TaskQueueRow({
  action,
  ariaCurrent,
  className,
  detail,
  meta = [],
  title,
  tone = 'neutral',
}: TaskQueueRowProps) {
  return (
    <article
      aria-current={ariaCurrent}
      className={['of-task-queue-row', `of-task-queue-row-${tone}`, className].filter(Boolean).join(' ')}
    >
      <div className="of-task-queue-row-main">
        <h3>{title}</h3>
        {detail ? <p>{detail}</p> : null}
        {meta.length > 0 ? (
          <div className="of-task-queue-row-meta">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>
      {action ? <div className="of-task-queue-row-action">{action}</div> : null}
    </article>
  )
}
