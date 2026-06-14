import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localDb } from './localDb'

const syncedOverview = {
  isOnline: true,
  status: 'synced' as const,
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

const syncPlayers = vi.hoisted(() => vi.fn(async () => syncedOverview))

vi.mock('./playerRepository', () => ({
  getPlayerSyncOverview: vi.fn(async () => syncedOverview),
  syncPlayers,
}))

vi.mock('./checkInRepository', () => ({
  getCheckInSyncOverview: vi.fn(async () => syncedOverview),
  syncCheckIns: vi.fn(async () => syncedOverview),
}))

vi.mock('./baselineRepository', () => ({
  getBaselineSyncOverview: vi.fn(async () => syncedOverview),
}))

vi.mock('./returnerRepository', () => ({
  getReturnerSyncOverview: vi.fn(async () => syncedOverview),
}))

describe('syncRepository orchestrator', () => {
  beforeEach(async () => {
    syncPlayers.mockClear()
    await localDb.delete()
    await localDb.open()
  })

  it('includes player writes in manual all-data sync', async () => {
    const { syncAllUserData } = await import('./syncRepository')

    await syncAllUserData('user-1')

    expect(syncPlayers).toHaveBeenCalledWith('user-1')
  })
})
