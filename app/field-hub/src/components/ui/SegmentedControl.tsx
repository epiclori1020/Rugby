import type { ReactNode } from 'react'

export type SegmentedControlOption<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
  disabled?: boolean
}

type SegmentedControlProps<T extends string> = {
  label: string
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({ label, onChange, options, value }: SegmentedControlProps<T>) {
  return (
    <div className="of-segmented-control" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          aria-pressed={option.value === value}
          className="of-segmented-option"
          disabled={option.disabled}
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.icon ? <span className="of-button-icon" aria-hidden>{option.icon}</span> : null}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}
