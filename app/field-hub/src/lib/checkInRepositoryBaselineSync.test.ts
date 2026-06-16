import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localDb } from './localDb'

const syncPendingBaselineEntries = vi.fn()
const refreshRemoteBaselineEntries = vi.fn()
const refreshRemoteProgressEntries = vi.fn()
const refreshRemoteReturnerEntries = vi.fn()
const syncPlayers = vi.fn(async () => ({
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}))

vi.mock('./baselineRepository', () => ({
  syncPendingBaselineEntries,
  refreshRemoteBaselineEntries,
}))

vi.mock('./playerRepository', () => ({
  syncPlayers,
}))

vi.mock('./postSessionRepository', () => ({
  syncPendingProgressEntries: vi.fn(),
  refreshRemoteProgressEntries,
}))

vi.mock('./returnerRepository', () => ({
  syncPendingReturnerEntries: vi.fn(),
  refreshRemoteReturnerEntries,
}))

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        is: vi.fn(async () => ({ data: [], error: null })),
        in: vi.fn(() => query),
      }
      return query
    }),
  },
}))

describe('syncCheckIns baseline integration', () => {
  beforeEach(async () => {
    syncPendingBaselineEntries.mockReset()
    refreshRemoteBaselineEntries.mockReset()
    refreshRemoteProgressEntries.mockReset()
    refreshRemoteReturnerEntries.mockReset()
    syncPlayers.mockClear()
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

  it('passes scoped session ids to dependent pulls for session-limited sync', async () => {
    const { syncCheckIns } = await import('./checkInRepository')

    const overview = await syncCheckIns('user-1', { sessionDefinitionId: 'session-def-1' })

    expect(overview.status).toBe('synced')
    expect(refreshRemoteProgressEntries).toHaveBeenCalledWith('user-1', { sessionLogIds: [] })
    expect(refreshRemoteBaselineEntries).toHaveBeenCalledWith('user-1', { sessionLogIds: [] })
    expect(refreshRemoteReturnerEntries).toHaveBeenCalledWith('user-1', { sessionLogIds: [] })
  })

  it('pushes pending field data without player sync or remote refresh', async () => {
    const { pushPendingCheckIns } = await import('./checkInRepository')

    await pushPendingCheckIns('user-1')

    expect(syncPendingBaselineEntries).toHaveBeenCalledWith('user-1')
    expect(syncPlayers).not.toHaveBeenCalled()
    expect(refreshRemoteBaselineEntries).not.toHaveBeenCalled()
  })
})
