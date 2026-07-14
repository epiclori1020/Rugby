import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  body: string
  action?: ReactNode
  appearance?: 'surface' | 'inline'
}

export function EmptyState({ action, appearance = 'surface', body, title }: EmptyStateProps) {
  return (
    <section className={`of-empty-state of-state-${appearance}`}>
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div className="of-empty-state-actions">{action}</div> : null}
    </section>
  )
}

type ErrorStateProps = {
  title: string
  body: string
  action?: ReactNode
  details?: string
  appearance?: 'surface' | 'inline'
}

export function ErrorState({ action, appearance = 'surface', body, details, title }: ErrorStateProps) {
  return (
    <section className={`of-error-state of-state-${appearance}`} role="alert">
      <h3>{title}</h3>
      <p>{body}</p>
      {details ? <p>{details}</p> : null}
      {action ? <div className="of-error-state-actions">{action}</div> : null}
    </section>
  )
}

type SkeletonProps = {
  announce?: boolean
  label?: string
  variant?: 'line' | 'row' | 'panel'
}

export function Skeleton({ announce = true, label = 'Inhalt wird geladen', variant = 'line' }: SkeletonProps) {
  const className = ['of-skeleton', variant !== 'line' ? `of-skeleton-${variant}` : null].filter(Boolean).join(' ')

  return announce
    ? <span className={className} role="status" aria-label={label} />
    : <span className={className} aria-hidden="true" />
}
