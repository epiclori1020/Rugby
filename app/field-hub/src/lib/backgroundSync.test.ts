import { describe, expect, it, vi } from 'vitest'
import { flushBackgroundSyncs, scheduleBackgroundSync } from './backgroundSync'

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

  it('runs repeated requests for the same user and scope serially', async () => {
    vi.useFakeTimers()
    let activeRuns = 0
    let maxActiveRuns = 0
    const runner = vi.fn(async () => {
      activeRuns += 1
      maxActiveRuns = Math.max(maxActiveRuns, activeRuns)
      await new Promise((resolve) => setTimeout(resolve, 20))
      activeRuns -= 1
    })

    scheduleBackgroundSync('user-1', 'check-ins', runner, 5)
    await vi.advanceTimersByTimeAsync(5)
    scheduleBackgroundSync('user-1', 'check-ins', runner, 5)
    await vi.advanceTimersByTimeAsync(5)
    await vi.advanceTimersByTimeAsync(20)
    await vi.advanceTimersByTimeAsync(20)

    expect(runner).toHaveBeenCalledTimes(2)
    expect(maxActiveRuns).toBe(1)
    vi.useRealTimers()
  })

  it('flushes delayed sync work before the page is hidden', async () => {
    vi.useFakeTimers()
    const runner = vi.fn(async () => undefined)

    scheduleBackgroundSync('user-1', 'players', runner, 1500)

    await flushBackgroundSyncs()
    await vi.advanceTimersByTimeAsync(1500)

    expect(runner).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('continues flushing remaining scopes when one runner fails', async () => {
    vi.useFakeTimers()
    const failingRunner = vi.fn(async () => {
      throw new Error('network')
    })
    const nextRunner = vi.fn(async () => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    scheduleBackgroundSync('user-1', 'check-ins', failingRunner, 1500)
    scheduleBackgroundSync('user-1', 'players', nextRunner, 1500)

    await flushBackgroundSyncs()

    expect(failingRunner).toHaveBeenCalledTimes(1)
    expect(nextRunner).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Background sync flush failed'), expect.any(Error))
    vi.useRealTimers()
  })
})
