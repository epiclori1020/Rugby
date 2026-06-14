import { describe, expect, it, vi } from 'vitest'
import { measureInteraction } from './performanceTrace'

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
})
