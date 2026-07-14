type OnFieldWordmarkProps = {
  as?: 'h1' | 'span'
  className?: string
  compact?: boolean
  context?: 'brand' | 'operational'
  product?: 'Coach' | 'Performance' | 'Rugby'
}

export function OnFieldWordmark({
  as: Component = 'span',
  className,
  compact = false,
  context = 'operational',
  product,
}: OnFieldWordmarkProps) {
  const classNames = ['onfield-wordmark', compact && 'onfield-wordmark-compact', className]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classNames} data-context={context}>
      <span className="onfield-wordmark-name">OnField</span>
      <span className="onfield-wordmark-dot" aria-hidden="true">•</span>
      {product ? <span className="onfield-wordmark-product">{product}</span> : null}
    </Component>
  )
}
