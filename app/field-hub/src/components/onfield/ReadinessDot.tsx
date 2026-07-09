export type ReadinessTone = 'green' | 'yellow' | 'red' | 'open' | 'returner'

type ReadinessDotProps = {
  tone: ReadinessTone
  label: string
  size?: 'sm' | 'md'
}

export function ReadinessDot({ label, size = 'md', tone }: ReadinessDotProps) {
  return (
    <span className={`of-readiness-dot of-readiness-dot-${tone} of-readiness-dot-${size}`} aria-label={label} role="img" />
  )
}
