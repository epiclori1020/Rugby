import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localDb } from './localDb'

const syncPendingBaselineEntries = vi.fn()
const refreshRemoteBaselineEntries = vi.fn()

vi.mock('./baselineRepository', () => ({
  syncPendingBaselineEntries,
  refreshRemoteBaselineEntries,
}))

vi.mock('./playerRepository', () => ({
  syncPlayers: vi.fn(async () => ({
    isOnline: true,
    status: 'synced',
    pendingCount: 0,
    lastSuccessfulSyncAt: null,
    errorMessage: null,
  })),
}))

vi.mock('./postSessionRepository', () => ({
  syncPendingProgressEntries: vi.fn(),
  refreshRemoteProgressEntries: vi.fn(),
}))

vi.mock('./returnerRepository', () => ({
  syncPendingReturnerEntries: vi.fn(),
  refreshRemoteReturnerEntries: vi.fn(),
}))

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(async () => ({ data: [], error: null })),
        })),
      })),
    })),
  },
}))

describe('syncCheckIns baseline integration', () => {
  beforeEach(async () => {
    syncPendingBaselineEntries.mockReset()
    refreshRemoteBaselineEntries.mockReset()
    Object.defineProperty(globalThis.navigator, 'onLine', {
      configurable: true,
      value: true,
    })
    await localDb.delete()
    await localDb.open()
  })

  it('syncs baseline entries through the shared check-in sync flow', async () => {
    const { syncCheckIns } = await import('./checkInRepository')

    await syncCheckIns('user-1')

    expect(syncPendingBaselineEntries).toHaveBeenCalledWith('user-1')
    expect(refreshRemoteBaselineEntries).toHaveBeenCalledWith('user-1')
  })
})
