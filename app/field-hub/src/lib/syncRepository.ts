import type { SessionDefinition } from '../content/types'
import type { PlayerSyncOverview } from '../domain/sync'
import { getBaselineSyncOverview } from './baselineRepository'
import { getCheckInSyncOverview, syncCheckIns } from './checkInRepository'
import { localDb } from './localDb'
import { getPlayerSyncOverview, syncPlayers } from './playerRepository'
import {
  getPublicCheckInSyncOverview,
  importPublicCheckInSubmissions,
  refreshRemotePublicCheckIns,
} from './publicCheckInRepository'
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
      getPublicCheckInSyncOverview(userId),
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

export type ManualSyncFeedback = {
  kind: 'success' | 'warning' | 'error'
  message: string
}

function syncChangeCountLabel(count: number) {
  return count === 1 ? '1 Aenderung' : `${count} Aenderungen`
}

export function buildManualSyncFeedback(overview: PlayerSyncOverview): ManualSyncFeedback {
  if (!overview.isOnline) {
    return { kind: 'error', message: 'Offline: lokal gespeichert, Sync offen.' }
  }

  if (overview.status === 'error' || overview.errorMessage) {
    return {
      kind: 'error',
      message: `Sync fehlgeschlagen: ${overview.errorMessage ?? 'Bitte spaeter erneut versuchen.'}`,
    }
  }

  if (overview.status === 'pending' || overview.pendingCount > 0) {
    return {
      kind: 'warning',
      message: `Sync offen: ${syncChangeCountLabel(overview.pendingCount)} noch nicht synchronisiert.`,
    }
  }

  return { kind: 'success', message: 'Synchronisiert.' }
}

export type SyncAllUserDataOptions = {
  publicSessionDefinition?: SessionDefinition
}

export async function syncAllUserData(
  userId: string,
  options: SyncAllUserDataOptions = {},
): Promise<PlayerSyncOverview> {
  await resetErroredPendingWritesForRetry(userId)
  const playerSyncOverview = await syncPlayers(userId)
  const syncOverview = await syncCheckIns(userId)
  let publicCheckInSyncOverview: PlayerSyncOverview | null = null
  if (options.publicSessionDefinition) {
    try {
      await refreshRemotePublicCheckIns(userId, { sessionDefinitionId: options.publicSessionDefinition.id })
      await importPublicCheckInSubmissions(userId, options.publicSessionDefinition)
    } catch (caughtError) {
      publicCheckInSyncOverview = {
        isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
        status: 'error',
        pendingCount: 0,
        lastSuccessfulSyncAt: null,
        errorMessage:
          caughtError instanceof Error ? caughtError.message : 'Link-Check-ins konnten nicht synchronisiert werden.',
      }
    }
  }
  const refreshedOverview = await getCombinedSyncOverview(userId)

  if (playerSyncOverview.status === 'error') {
    return mergeManualSyncOverview(playerSyncOverview, refreshedOverview)
  }

  if (syncOverview.status === 'error') {
    return mergeManualSyncOverview(syncOverview, refreshedOverview)
  }

  if (publicCheckInSyncOverview?.status === 'error') {
    return mergeManualSyncOverview(publicCheckInSyncOverview, refreshedOverview)
  }

  return refreshedOverview
}
