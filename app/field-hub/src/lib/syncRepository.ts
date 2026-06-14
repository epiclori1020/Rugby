import type { PlayerSyncOverview } from '../domain/sync'
import { getBaselineSyncOverview } from './baselineRepository'
import { getCheckInSyncOverview, syncCheckIns } from './checkInRepository'
import { localDb } from './localDb'
import { getPlayerSyncOverview } from './playerRepository'
import { getReturnerSyncOverview } from './returnerRepository'

export function combineSyncOverviews(overviews: PlayerSyncOverview[]): PlayerSyncOverview {
  const hasError = overviews.some((overview) => overview.status === 'error')
  const pendingCount = overviews.reduce((total, overview) => total + overview.pendingCount, 0)
  const lastSuccessfulSyncAt =
    overviews
      .map((overview) => overview.lastSuccessfulSyncAt)
      .filter((timestamp): timestamp is string => Boolean(timestamp))
      .sort()
      .at(-1) ?? null
  const errorMessage = overviews.find((overview) => overview.errorMessage)?.errorMessage ?? null

  return {
    isOnline: overviews.every((overview) => overview.isOnline),
    status: hasError ? 'error' : pendingCount > 0 ? 'pending' : 'synced',
    pendingCount,
    lastSuccessfulSyncAt,
    errorMessage,
  }
}

export async function getCombinedSyncOverview(userId: string) {
  return combineSyncOverviews(
    await Promise.all([
      getPlayerSyncOverview(userId),
      getCheckInSyncOverview(userId),
      getBaselineSyncOverview(userId),
      getReturnerSyncOverview(userId),
    ]),
  )
}

export function mergeManualSyncOverview(
  syncAttemptOverview: PlayerSyncOverview,
  refreshedOverview: PlayerSyncOverview,
): PlayerSyncOverview {
  if (syncAttemptOverview.status !== 'error') {
    return refreshedOverview
  }

  return {
    ...refreshedOverview,
    status: 'error',
    errorMessage: syncAttemptOverview.errorMessage ?? refreshedOverview.errorMessage,
  }
}

export async function resetErroredPendingWritesForRetry(userId: string) {
  const pendingWrites = await localDb.pendingWrites.where('userId').equals(userId).toArray()
  let resetCount = 0

  for (const write of pendingWrites) {
    if (write.table === 'players') {
      const record = await localDb.players.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.players.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'session_logs') {
      const record = await localDb.sessionLogs.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.sessionLogs.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'player_session_entries') {
      const record = await localDb.playerSessionEntries.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.playerSessionEntries.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'progress_entries') {
      const record = await localDb.progressEntries.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.progressEntries.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'baseline_entries') {
      const record = await localDb.baselineEntries.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.baselineEntries.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'returner_entries') {
      const record = await localDb.returnerEntries.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.returnerEntries.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    }
  }

  return resetCount
}

export async function syncAllUserData(userId: string): Promise<PlayerSyncOverview> {
  await resetErroredPendingWritesForRetry(userId)
  const syncOverview = await syncCheckIns(userId)
  const refreshedOverview = await getCombinedSyncOverview(userId)

  if (syncOverview.status === 'error') {
    return mergeManualSyncOverview(syncOverview, refreshedOverview)
  }

  return refreshedOverview
}
