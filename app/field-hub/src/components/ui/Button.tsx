import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonBaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode
  icon?: ReactNode
  isLoading?: boolean
  loadingLabel?: string
  disabledReason?: string
  compact?: boolean
}

function buttonClassName(variant: 'primary' | 'secondary', compact: boolean | undefined, className: string | undefined) {
  return [
    'of-button',
    variant === 'primary' ? 'of-button-primary' : 'of-button-secondary',
    compact ? 'of-button-compact' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

function ButtonBase({
  children,
  className,
  compact,
  disabled,
  disabledReason,
  icon,
  isLoading,
  loadingLabel = 'Wird gespeichert',
  type = 'button',
  variant,
  ...props
}: ButtonBaseProps & { variant: 'primary' | 'secondary' }) {
  const isDisabled = disabled || isLoading
  const generatedId = useId()
  const disabledReasonId = `${props.id ?? generatedId}-disabled-reason`
  const describedBy = disabledReason ? disabledReasonId : props['aria-describedby']

  return (
    <span>
      <button
        {...props}
        aria-busy={isLoading || undefined}
        aria-describedby={describedBy}
        className={`${buttonClassName(variant, compact, className)}${isLoading ? ' of-button-loading' : ''}`}
        disabled={isDisabled}
        type={type}
      >
        {isLoading ? <span className="of-button-spinner" aria-hidden /> : icon ? <span className="of-button-icon" aria-hidden>{icon}</span> : null}
        <span>{isLoading ? loadingLabel : children}</span>
      </button>
      {disabledReason ? (
        <span className="of-disabled-reason" id={describedBy}>
          {disabledReason}
        </span>
      ) : null}
    </span>
  )
}

export function PrimaryButton(props: ButtonBaseProps) {
  return <ButtonBase {...props} variant="primary" />
}

export function SecondaryButton({ tone, ...props }: ButtonBaseProps & { tone?: 'default' | 'danger' }) {
  const className = [props.className, tone === 'danger' ? 'of-button-danger' : null].filter(Boolean).join(' ')
  return <ButtonBase {...props} className={className} variant="secondary" />
}
