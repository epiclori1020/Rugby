import { useId, type ReactNode } from 'react'
import { ReadinessDot, type ReadinessTone } from './ReadinessDot'

export type AthleteRowProps = {
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
  onSelect?: () => void
  selectDescription?: string
  selectLabel?: string
}

export function AthleteRow({
  action,
  className,
  compact,
  meta = [],
  name,
  note,
  onSelect,
  playerId,
  readinessLabel,
  readinessTone,
  status,
  selectDescription,
  selectLabel,
  traffic,
  trendLabel,
}: AthleteRowProps) {
  const selectDescriptionId = useId()
  const rowClassName = [
    'of-athlete-row',
    readinessTone ? `of-athlete-row-${readinessTone}` : null,
    compact ? 'of-athlete-row-compact' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {readinessTone ? (
        <ReadinessDot
          label={readinessLabel ?? `Status ${readinessTone}`}
          size={compact ? 'sm' : 'md'}
          tone={readinessTone}
        />
      ) : null}
      <span className="of-athlete-row-main">
        <span className="of-athlete-row-identity">
          <span className="of-athlete-row-name">{name}</span>
          {note ? <span className="of-athlete-row-note">{note}</span> : null}
        </span>
        {meta.length > 0 ? (
          <span className="of-athlete-row-meta">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </span>
        ) : null}
        {trendLabel ? <span className="of-athlete-row-trend">{trendLabel}</span> : null}
        {status || traffic ? (
          <span className="of-athlete-row-status">
            {traffic}
            {status}
          </span>
        ) : null}
      </span>
    </>
  )

  return (
    <article className={rowClassName} data-player-id={playerId}>
      {onSelect ? (
        <button
          aria-describedby={selectDescription ? selectDescriptionId : undefined}
          aria-label={selectLabel ?? `${name} öffnen`}
          className="of-athlete-row-content"
          onClick={onSelect}
          type="button"
        >
          {content}
          {selectDescription ? (
            <span className="sr-only" id={selectDescriptionId}>
              {selectDescription}
            </span>
          ) : null}
        </button>
      ) : (
        <div className="of-athlete-row-content">{content}</div>
      )}
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
