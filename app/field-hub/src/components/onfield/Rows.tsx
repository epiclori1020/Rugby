import type { ReactNode } from 'react'

type AthleteRowProps = {
  name: string
  meta?: string[]
  status?: ReactNode
  traffic?: ReactNode
  action?: ReactNode
  note?: string
}

export function AthleteRow({ action, meta = [], name, note, status, traffic }: AthleteRowProps) {
  return (
    <article className="of-athlete-row">
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
