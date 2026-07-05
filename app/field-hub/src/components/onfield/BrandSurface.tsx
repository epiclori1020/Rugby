import { useId, type ReactNode } from 'react'

type BrandSurfaceVariant = 'auth' | 'welcome' | 'install' | 'public' | 'kiosk' | 'compact'

type BrandSurfaceProps = {
  body: string
  children?: ReactNode
  className?: string
  claim?: string
  meta?: ReactNode
  primaryAction?: ReactNode
  productFrame?: ReactNode
  secondaryAction?: ReactNode
  title: string
  variant: BrandSurfaceVariant
}

export function BrandSurface({
  body,
  children,
  className,
  claim = 'Check in players. Run the session. Wrap the day.',
  meta,
  primaryAction,
  productFrame,
  secondaryAction,
  title,
  variant,
}: BrandSurfaceProps) {
  const classNames = ['brand-surface', `brand-surface-${variant}`, className].filter(Boolean).join(' ')
  const headingId = `brand-surface-${variant}-${useId().replaceAll(':', '')}`

  return (
    <section className={classNames} aria-labelledby={headingId}>
      <div className="brand-surface-copy">
        <span className="brand-accent" aria-hidden />
        <p className="brand-surface-kicker">OnField Coach</p>
        <h2 id={headingId}>{title}</h2>
        <p className="brand-surface-claim">{claim}</p>
        <p className="brand-surface-body">{body}</p>
        {meta ? <div className="brand-surface-meta">{meta}</div> : null}
        {primaryAction || secondaryAction ? (
          <div className="brand-surface-actions">
            {primaryAction}
            {secondaryAction}
          </div>
        ) : null}
      </div>

      {productFrame ? <div className="brand-product-frame">{productFrame}</div> : null}
      {children ? <div className="brand-surface-content">{children}</div> : null}
    </section>
  )
}
