import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localDb } from './localDb'

const syncPendingBaselineEntries = vi.fn()
const refreshRemoteBaselineEntries = vi.fn()
const refreshRemoteProgressEntries = vi.fn()
const refreshRemoteReturnerEntries = vi.fn()
const syncPendingSessionBlockLogs = vi.fn()
const refreshRemoteSessionBlockLogs = vi.fn()
const getSessionBlockSyncOverview = vi.fn(async () => ({
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}))
const syncPendingExposureSummaries = vi.fn()
const refreshRemoteExposureSummaries = vi.fn()
const getExposureSyncOverview = vi.fn(async () => ({
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}))
const syncPendingMetricResults = vi.fn()
const refreshRemoteMetricResults = vi.fn()
const getMetricSyncOverview = vi.fn(async () => ({
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}))
const syncPendingExerciseResults = vi.fn()
const refreshRemoteExerciseResults = vi.fn()
const getExerciseSyncOverview = vi.fn(async () => ({
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}))
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

vi.mock('./sessionBlockRepository', () => ({
  getSessionBlockSyncOverview,
  syncPendingSessionBlockLogs,
  refreshRemoteSessionBlockLogs,
}))

vi.mock('./exposureRepository', () => ({
  getExposureSyncOverview,
  syncPendingExposureSummaries,
  refreshRemoteExposureSummaries,
}))

vi.mock('./metricRepository', () => ({
  getMetricSyncOverview,
  syncPendingMetricResults,
  refreshRemoteMetricResults,
}))

vi.mock('./exerciseRepository', () => ({
  getExerciseSyncOverview,
  syncPendingExerciseResults,
  refreshRemoteExerciseResults,
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
    syncPendingSessionBlockLogs.mockReset()
    refreshRemoteSessionBlockLogs.mockReset()
    getSessionBlockSyncOverview.mockReset()
    getSessionBlockSyncOverview.mockResolvedValue({
      isOnline: true,
      status: 'synced',
      pendingCount: 0,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })
    syncPendingExposureSummaries.mockReset()
    refreshRemoteExposureSummaries.mockReset()
    getExposureSyncOverview.mockReset()
    getExposureSyncOverview.mockResolvedValue({
      isOnline: true,
      status: 'synced',
      pendingCount: 0,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })
    syncPendingMetricResults.mockReset()
    refreshRemoteMetricResults.mockReset()
    getMetricSyncOverview.mockReset()
    getMetricSyncOverview.mockResolvedValue({
      isOnline: true,
      status: 'synced',
      pendingCount: 0,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })
    syncPendingExerciseResults.mockReset()
    refreshRemoteExerciseResults.mockReset()
    getExerciseSyncOverview.mockReset()
    getExerciseSyncOverview.mockResolvedValue({
      isOnline: true,
      status: 'synced',
      pendingCount: 0,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })
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
    expect(syncPendingSessionBlockLogs).toHaveBeenCalledWith('user-1')
    expect(syncPendingExposureSummaries).toHaveBeenCalledWith('user-1')
    expect(syncPendingMetricResults).toHaveBeenCalledWith('user-1')
    expect(syncPendingExerciseResults).toHaveBeenCalledWith('user-1')
    expect(refreshRemoteBaselineEntries).toHaveBeenCalledWith('user-1')
    expect(refreshRemoteExposureSummaries).not.toHaveBeenCalled()
    expect(refreshRemoteMetricResults).not.toHaveBeenCalled()
    expect(refreshRemoteExerciseResults).not.toHaveBeenCalled()
  })

  it('passes scoped session ids to dependent pulls for session-limited sync', async () => {
    const { syncCheckIns } = await import('./checkInRepository')

    const overview = await syncCheckIns('user-1', { sessionDefinitionId: 'session-def-1' })

    expect(overview.status).toBe('synced')
    expect(refreshRemoteProgressEntries).toHaveBeenCalledWith('user-1', { sessionLogIds: [] })
    expect(refreshRemoteSessionBlockLogs).toHaveBeenCalledWith('user-1', { sessionLogIds: [] })
    expect(refreshRemoteBaselineEntries).toHaveBeenCalledWith('user-1', { sessionLogIds: [] })
    expect(refreshRemoteReturnerEntries).toHaveBeenCalledWith('user-1', { sessionLogIds: [] })
    expect(refreshRemoteExposureSummaries).toHaveBeenCalledWith('user-1', { sessionLogIds: [] })
    expect(refreshRemoteMetricResults).toHaveBeenCalledWith('user-1', { sessionLogIds: [] })
    expect(refreshRemoteExerciseResults).toHaveBeenCalledWith('user-1', { sessionLogIds: [] })
  })

  it('pushes pending field data without player sync or remote refresh', async () => {
    const { pushPendingCheckIns } = await import('./checkInRepository')

    await pushPendingCheckIns('user-1')

    expect(syncPendingBaselineEntries).toHaveBeenCalledWith('user-1')
    expect(syncPendingSessionBlockLogs).toHaveBeenCalledWith('user-1')
    expect(syncPendingExposureSummaries).toHaveBeenCalledWith('user-1')
    expect(syncPendingMetricResults).toHaveBeenCalledWith('user-1')
    expect(syncPendingExerciseResults).toHaveBeenCalledWith('user-1')
    expect(syncPlayers).not.toHaveBeenCalled()
    expect(refreshRemoteBaselineEntries).not.toHaveBeenCalled()
    expect(refreshRemoteSessionBlockLogs).not.toHaveBeenCalled()
    expect(refreshRemoteExposureSummaries).not.toHaveBeenCalled()
    expect(refreshRemoteMetricResults).not.toHaveBeenCalled()
    expect(refreshRemoteExerciseResults).not.toHaveBeenCalled()
  })

  it('reruns a shared push when exercise-only pending writes arrive during an active sync', async () => {
    const { pushPendingCheckIns } = await import('./checkInRepository')
    let releaseFirstExerciseSync: (() => void) | undefined
    syncPendingExerciseResults
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseFirstExerciseSync = resolve
          }),
      )
      .mockResolvedValue(1)
    getExerciseSyncOverview.mockResolvedValue({
      isOnline: true,
      status: 'pending',
      pendingCount: 1,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })

    const firstPush = pushPendingCheckIns('user-1')
    for (let attempt = 0; attempt < 10 && !releaseFirstExerciseSync; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    expect(releaseFirstExerciseSync).toBeTypeOf('function')
    const secondPush = pushPendingCheckIns('user-1')
    releaseFirstExerciseSync?.()
    await firstPush
    await secondPush

    expect(syncPendingExerciseResults).toHaveBeenCalledTimes(2)
  }, 10_000)

  it('reruns a shared push when metric-only pending writes arrive during an active sync', async () => {
    const { pushPendingCheckIns } = await import('./checkInRepository')
    let releaseFirstMetricSync: (() => void) | undefined
    syncPendingMetricResults
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseFirstMetricSync = resolve
          }),
      )
      .mockResolvedValue(1)
    getMetricSyncOverview.mockResolvedValue({
      isOnline: true,
      status: 'pending',
      pendingCount: 1,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })

    const firstPush = pushPendingCheckIns('user-1')
    for (let attempt = 0; attempt < 10 && !releaseFirstMetricSync; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    expect(releaseFirstMetricSync).toBeTypeOf('function')
    const secondPush = pushPendingCheckIns('user-1')
    releaseFirstMetricSync?.()
    await firstPush
    await secondPush

    expect(syncPendingMetricResults).toHaveBeenCalledTimes(2)
  }, 10_000)

  it('reruns a shared push when exposure-only pending writes arrive during an active sync', async () => {
    const { pushPendingCheckIns } = await import('./checkInRepository')
    let releaseFirstExposureSync: (() => void) | undefined
    syncPendingExposureSummaries
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseFirstExposureSync = resolve
          }),
      )
      .mockResolvedValue(1)
    getExposureSyncOverview.mockResolvedValue({
      isOnline: true,
      status: 'pending',
      pendingCount: 1,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })

    const firstPush = pushPendingCheckIns('user-1')
    for (let attempt = 0; attempt < 10 && !releaseFirstExposureSync; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    expect(releaseFirstExposureSync).toBeTypeOf('function')
    const secondPush = pushPendingCheckIns('user-1')
    releaseFirstExposureSync?.()
    await firstPush
    await secondPush

    expect(syncPendingExposureSummaries).toHaveBeenCalledTimes(2)
  }, 10_000)

  it('reruns a shared push when session-block-only pending writes arrive during an active sync', async () => {
    const { pushPendingCheckIns } = await import('./checkInRepository')
    let releaseFirstSessionBlockSync: (() => void) | undefined
    syncPendingSessionBlockLogs
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseFirstSessionBlockSync = resolve
          }),
      )
      .mockResolvedValue(1)
    getSessionBlockSyncOverview.mockResolvedValue({
      isOnline: true,
      status: 'pending',
      pendingCount: 1,
      lastSuccessfulSyncAt: null,
      errorMessage: null,
    })

    const firstPush = pushPendingCheckIns('user-1')
    for (let attempt = 0; attempt < 10 && !releaseFirstSessionBlockSync; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    expect(releaseFirstSessionBlockSync).toBeTypeOf('function')
    const secondPush = pushPendingCheckIns('user-1')
    releaseFirstSessionBlockSync?.()
    await firstPush
    await secondPush

    expect(syncPendingSessionBlockLogs).toHaveBeenCalledTimes(2)
  }, 10_000)
})
