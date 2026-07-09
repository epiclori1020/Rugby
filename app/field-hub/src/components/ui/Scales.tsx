type NumberScaleProps = {
  label: string
  min?: number
  max: number
  value: number | null
  onChange: (value: number) => void
}

export function NumberScale({ label, max, min = 1, onChange, value }: NumberScaleProps) {
  const values = Array.from({ length: max - min + 1 }, (_, index) => min + index)

  return (
    <div className="of-number-scale" role="group" aria-label={label}>
      {values.map((option) => (
        <button
          aria-pressed={value === option}
          className="of-number-scale-option of-num"
          key={option}
          type="button"
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

type PainScaleProps = Omit<NumberScaleProps, 'min' | 'max'>

export function PainScale(props: PainScaleProps) {
  return (
    <div className="of-pain-scale">
      <NumberScale {...props} min={0} max={10} />
    </div>
  )
}
