import { describe, expect, it, vi } from 'vitest'
import { isPerformanceTraceEnabled, measureInteraction } from './performanceTrace'

describe('measureInteraction', () => {
  it('returns the wrapped action result', async () => {
    await expect(measureInteraction('test', async () => 'ok', { enabled: false })).resolves.toBe('ok')
  })

  it('logs duration when explicitly enabled', async () => {
    const logger = vi.fn()
    const clock = { now: vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(42) }

    await measureInteraction('test', async () => 'ok', { clock, enabled: true, logger })

    expect(logger).toHaveBeenCalledWith('test', 32)
  })

  it('does not crash when localStorage is unavailable', () => {
    const originalWindow = globalThis.window
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        get localStorage() {
          throw new DOMException('blocked', 'SecurityError')
        },
      },
    })

    expect(() => isPerformanceTraceEnabled()).not.toThrow()

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    })
  })
})
