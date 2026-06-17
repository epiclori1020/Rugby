import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Player } from '../domain/players'
import {
  buildManualSyncFeedback,
  combineSyncOverviews,
  mergeManualSyncOverview,
  resetErroredPendingWritesForRetry,
} from './syncRepository'
import { localDb } from './localDb'

const userId = '00000000-0000-4000-8000-000000000001'

const erroredPlayer: Player = {
  id: 'player-1',
  userId,
  name: 'Test Spieler',
  position: 'Back Row',
  cluster: 'back_row',
  active: true,
  consentStatus: 'vorhanden',
  photoConsentStatus: 'not_asked',
  photoPath: null,
  photoUpdatedAt: null,
  returnerStatus: 'nein',
  notes: '',
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'error',
  syncError: 'network',
}

describe('syncRepository', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('combines offline, pending and error states into one overview', () => {
    const overview = combineSyncOverviews([
      { isOnline: true, status: 'synced', pendingCount: 0, lastSuccessfulSyncAt: '2026-06-18T18:00:00.000Z', errorMessage: null },
      { isOnline: false, status: 'pending', pendingCount: 2, lastSuccessfulSyncAt: null, errorMessage: null },
      { isOnline: true, status: 'error', pendingCount: 1, lastSuccessfulSyncAt: '2026-06-18T19:00:00.000Z', errorMessage: 'Sync failed' },
    ])

    expect(overview).toMatchObject({
      isOnline: false,
      status: 'error',
      pendingCount: 3,
      lastSuccessfulSyncAt: '2026-06-18T19:00:00.000Z',
      errorMessage: 'Sync failed',
    })
  })

  it('resets errored records with pending writes before retrying sync', async () => {
    await localDb.players.put(erroredPlayer)
    await localDb.pendingWrites.add({
      table: 'players',
      operation: 'upsert',
      recordId: erroredPlayer.id,
      userId,
      createdAt: '2026-06-16T18:05:00.000Z',
    })

    const resetCount = await resetErroredPendingWritesForRetry(userId)

    expect(resetCount).toBe(1)
    await expect(localDb.players.get(erroredPlayer.id)).resolves.toMatchObject({
      syncStatus: 'pending',
      syncError: null,
    })
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('does not double count pending writes when manual sync returns an error overview', () => {
    const merged = mergeManualSyncOverview(
      { isOnline: true, status: 'error', pendingCount: 2, lastSuccessfulSyncAt: null, errorMessage: 'network' },
      { isOnline: true, status: 'error', pendingCount: 2, lastSuccessfulSyncAt: null, errorMessage: 'network' },
    )

    expect(merged.pendingCount).toBe(2)
    expect(merged.status).toBe('error')
    expect(merged.errorMessage).toBe('network')
  })

  it('formats manual sync feedback from the returned overview instead of assuming success', () => {
    expect(
      buildManualSyncFeedback({
        isOnline: true,
        status: 'pending',
        pendingCount: 1,
        lastSuccessfulSyncAt: null,
        errorMessage: null,
      }),
    ).toEqual({ kind: 'warning', message: 'Sync offen: 1 Aenderung noch nicht synchronisiert.' })

    expect(
      buildManualSyncFeedback({
        isOnline: true,
        status: 'pending',
        pendingCount: 2,
        lastSuccessfulSyncAt: null,
        errorMessage: null,
      }),
    ).toEqual({ kind: 'warning', message: 'Sync offen: 2 Aenderungen noch nicht synchronisiert.' })

    expect(
      buildManualSyncFeedback({
        isOnline: true,
        status: 'error',
        pendingCount: 2,
        lastSuccessfulSyncAt: null,
        errorMessage: 'network',
      }),
    ).toEqual({ kind: 'error', message: 'Sync fehlgeschlagen: network' })

    expect(
      buildManualSyncFeedback({
        isOnline: true,
        status: 'synced',
        pendingCount: 0,
        lastSuccessfulSyncAt: null,
        errorMessage: null,
      }),
    ).toEqual({ kind: 'success', message: 'Synchronisiert.' })
  })
})
