import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import { localDb } from './localDb'

const syncedOverview = {
  isOnline: true,
  status: 'synced' as const,
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

const syncPlayers = vi.hoisted(() => vi.fn(async () => syncedOverview))
const checkInRepositoryMocks = vi.hoisted(() => ({
  syncCheckIns: vi.fn(async () => syncedOverview),
}))
const publicCheckInRepositoryMocks = vi.hoisted(() => ({
  getPublicCheckInSyncOverview: vi.fn(async () => syncedOverview),
  refreshRemotePublicCheckIns: vi.fn(async () => undefined),
  importPublicCheckInSubmissions: vi.fn(async () => ({ imported: 0, conflicts: 0, superseded: 0 })),
}))
const exposureRepositoryMocks = vi.hoisted(() => ({
  getExposureSyncOverview: vi.fn(async () => syncedOverview),
}))
const exerciseRepositoryMocks = vi.hoisted(() => ({
  getExerciseSyncOverview: vi.fn(async () => syncedOverview),
}))

const sessionDefinition: SessionDefinition = {
  id: 'session-1',
  date: '2026-06-16',
  kw: 'KW25',
  title: 'Training',
  type: 'training',
  summary: '',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

vi.mock('./playerRepository', () => ({
  getPlayerSyncOverview: vi.fn(async () => syncedOverview),
  syncPlayers,
}))

vi.mock('./checkInRepository', () => ({
  getCheckInSyncOverview: vi.fn(async () => syncedOverview),
  syncCheckIns: checkInRepositoryMocks.syncCheckIns,
}))

vi.mock('./baselineRepository', () => ({
  getBaselineSyncOverview: vi.fn(async () => syncedOverview),
}))

vi.mock('./returnerRepository', () => ({
  getReturnerSyncOverview: vi.fn(async () => syncedOverview),
}))

vi.mock('./publicCheckInRepository', () => publicCheckInRepositoryMocks)
vi.mock('./exposureRepository', () => exposureRepositoryMocks)
vi.mock('./exerciseRepository', () => exerciseRepositoryMocks)

describe('syncRepository orchestrator', () => {
  beforeEach(async () => {
    syncPlayers.mockClear()
    checkInRepositoryMocks.syncCheckIns.mockClear()
    checkInRepositoryMocks.syncCheckIns.mockResolvedValue(syncedOverview)
    publicCheckInRepositoryMocks.getPublicCheckInSyncOverview.mockClear()
    exposureRepositoryMocks.getExposureSyncOverview.mockClear()
    exerciseRepositoryMocks.getExerciseSyncOverview.mockClear()
    publicCheckInRepositoryMocks.refreshRemotePublicCheckIns.mockClear()
    publicCheckInRepositoryMocks.refreshRemotePublicCheckIns.mockResolvedValue(undefined)
    publicCheckInRepositoryMocks.importPublicCheckInSubmissions.mockClear()
    publicCheckInRepositoryMocks.importPublicCheckInSubmissions.mockResolvedValue({
      imported: 0,
      conflicts: 0,
      superseded: 0,
    })
    await localDb.delete()
    await localDb.open()
  })

  it('includes player writes in manual all-data sync', async () => {
    const { syncAllUserData } = await import('./syncRepository')

    await syncAllUserData('user-1')

    expect(syncPlayers).toHaveBeenCalledWith('user-1')
  })

  it('includes public check-in status in the combined sync overview', async () => {
    const { getCombinedSyncOverview } = await import('./syncRepository')

    await getCombinedSyncOverview('user-1')

    expect(publicCheckInRepositoryMocks.getPublicCheckInSyncOverview).toHaveBeenCalledWith('user-1')
  })

  it('includes exposure status in the combined sync overview', async () => {
    const { getCombinedSyncOverview } = await import('./syncRepository')

    await getCombinedSyncOverview('user-1')

    expect(exposureRepositoryMocks.getExposureSyncOverview).toHaveBeenCalledWith('user-1')
  })

  it('includes exercise status in the combined sync overview', async () => {
    const { getCombinedSyncOverview } = await import('./syncRepository')

    await getCombinedSyncOverview('user-1')

    expect(exerciseRepositoryMocks.getExerciseSyncOverview).toHaveBeenCalledWith('user-1')
  })

  it('surfaces public check-in sync failures without throwing away the manual sync result', async () => {
    publicCheckInRepositoryMocks.refreshRemotePublicCheckIns.mockRejectedValueOnce(new Error('Public sync failed'))
    const { syncAllUserData } = await import('./syncRepository')

    const overview = await syncAllUserData('user-1', { publicSessionDefinition: sessionDefinition })

    expect(publicCheckInRepositoryMocks.refreshRemotePublicCheckIns).toHaveBeenCalledWith('user-1', {
      sessionDefinitionId: 'session-1',
    })
    expect(publicCheckInRepositoryMocks.importPublicCheckInSubmissions).not.toHaveBeenCalled()
    expect(overview).toMatchObject({
      status: 'error',
      errorMessage: 'Public sync failed',
    })
  })

  it('pushes check-in entries created during manual public check-in import', async () => {
    publicCheckInRepositoryMocks.importPublicCheckInSubmissions.mockResolvedValueOnce({
      imported: 1,
      conflicts: 0,
      superseded: 0,
    })
    const { syncAllUserData } = await import('./syncRepository')

    await syncAllUserData('user-1', { publicSessionDefinition: sessionDefinition })

    expect(publicCheckInRepositoryMocks.importPublicCheckInSubmissions).toHaveBeenCalledWith(
      'user-1',
      sessionDefinition,
      { recoverImportedWithoutLocalEntry: true },
    )
    expect(checkInRepositoryMocks.syncCheckIns).toHaveBeenCalledTimes(2)
    expect(checkInRepositoryMocks.syncCheckIns).toHaveBeenLastCalledWith('user-1', {
      sessionDefinitionId: 'session-1',
    })
  })
})
