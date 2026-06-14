import { describe, expect, it, vi } from 'vitest'
import { scheduleBackgroundSync } from './backgroundSync'

describe('scheduleBackgroundSync', () => {
  it('coalesces repeated sync requests for the same user and scope', async () => {
    vi.useFakeTimers()
    const runner = vi.fn(async () => undefined)

    scheduleBackgroundSync('user-1', 'check-ins', runner, 25)
    scheduleBackgroundSync('user-1', 'check-ins', runner, 25)
    scheduleBackgroundSync('user-1', 'check-ins', runner, 25)

    await vi.advanceTimersByTimeAsync(25)

    expect(runner).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('keeps different scopes independent', async () => {
    vi.useFakeTimers()
    const checkInRunner = vi.fn(async () => undefined)
    const playerRunner = vi.fn(async () => undefined)

    scheduleBackgroundSync('user-1', 'check-ins', checkInRunner, 25)
    scheduleBackgroundSync('user-1', 'players', playerRunner, 25)

    await vi.advanceTimersByTimeAsync(25)

    expect(checkInRunner).toHaveBeenCalledTimes(1)
    expect(playerRunner).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
