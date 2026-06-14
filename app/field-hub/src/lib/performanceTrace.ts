type PerformanceClock = {
  now: () => number
}

type MeasureInteractionOptions = {
  clock?: PerformanceClock
  enabled?: boolean
  logger?: (label: string, durationMs: number) => void
}

function defaultClock(): PerformanceClock | null {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance : null
}

export async function measureInteraction<T>(
  label: string,
  action: () => Promise<T>,
  options: MeasureInteractionOptions = {},
) {
  const enabled = options.enabled ?? import.meta.env.DEV
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
