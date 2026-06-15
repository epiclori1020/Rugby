type PerformanceClock = {
  now: () => number
}

type MeasureInteractionOptions = {
  clock?: PerformanceClock
  enabled?: boolean
  logger?: (label: string, durationMs: number) => void
}

export function isPerformanceTraceEnabled() {
  if (import.meta.env.DEV) {
    return true
  }

  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem('fieldHub:performanceTrace') === '1'
  } catch {
    return false
  }
}

function defaultClock(): PerformanceClock | null {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance : null
}

export async function measureInteraction<T>(
  label: string,
  action: () => Promise<T>,
  options: MeasureInteractionOptions = {},
) {
  const enabled = options.enabled ?? isPerformanceTraceEnabled()
  const clock = options.clock ?? defaultClock()
  if (!enabled || !clock) {
    return action()
  }

  const startedAt = clock.now()
  try {
    return await action()
  } finally {
    const durationMs = Math.round(clock.now() - startedAt)
    ;(options.logger ?? console.debug)(label, durationMs)
  }
}
