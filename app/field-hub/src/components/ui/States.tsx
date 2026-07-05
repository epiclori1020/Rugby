import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  body: string
  action?: ReactNode
}

export function EmptyState({ action, body, title }: EmptyStateProps) {
  return (
    <section className="of-empty-state">
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
}

export function ErrorState({ action, body, details, title }: ErrorStateProps) {
  return (
    <section className="of-error-state" role="alert">
      <h3>{title}</h3>
      <p>{body}</p>
      {details ? <p>{details}</p> : null}
      {action ? <div className="of-error-state-actions">{action}</div> : null}
    </section>
  )
}

type SkeletonProps = {
  label?: string
  variant?: 'line' | 'row' | 'panel'
}

export function Skeleton({ label = 'Inhalt wird geladen', variant = 'line' }: SkeletonProps) {
  const className = ['of-skeleton', variant !== 'line' ? `of-skeleton-${variant}` : null].filter(Boolean).join(' ')

  return <span className={className} role="status" aria-label={label} />
}
