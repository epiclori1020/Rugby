import { useId, type ReactNode } from 'react'
import { OnFieldWordmark } from './OnFieldWordmark'

type BrandSurfaceVariant = 'auth' | 'welcome' | 'install' | 'public' | 'kiosk' | 'compact'

type BrandSurfaceProps = {
  artwork?: 'hero' | 'texture' | 'none'
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
  artwork = 'none',
  body,
  children,
  className,
  claim,
  meta,
  primaryAction,
  productFrame,
  secondaryAction,
  title,
  variant,
}: BrandSurfaceProps) {
  const classNames = [
    'brand-surface',
    `brand-surface-${variant}`,
    `brand-surface-artwork-${artwork}`,
    className,
  ].filter(Boolean).join(' ')
  const headingId = `brand-surface-${variant}-${useId().replaceAll(':', '')}`

  return (
    <section className={classNames} aria-labelledby={headingId}>
      <div className="brand-surface-copy">
        <span className="brand-accent" aria-hidden />
        <p className="brand-surface-kicker"><OnFieldWordmark context="brand" product="Coach" /></p>
        <h2 id={headingId}>{title}</h2>
        {claim ? <p className="brand-surface-claim">{claim}</p> : null}
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
