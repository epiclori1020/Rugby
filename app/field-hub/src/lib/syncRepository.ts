import type { SessionDefinition } from '../content/types'
import type { PlayerSyncOverview, SyncDetailGroup, SyncDetailSummary, SyncDetailStatus } from '../domain/sync'
import { getBaselineSyncOverview } from './baselineRepository'
import { getCheckInSyncOverview, syncCheckIns } from './checkInRepository'
import { getExerciseSyncOverview } from './exerciseRepository'
import { getExposureSyncOverview } from './exposureRepository'
import { localDb } from './localDb'
import type { PendingWriteTable } from './localDb'
import { getMetricSyncOverview } from './metricRepository'
import { getPlayerSyncOverview, syncPlayers } from './playerRepository'
import {
  getPublicCheckInSyncOverview,
  importPublicCheckInSubmissions,
  refreshRemotePublicCheckIns,
} from './publicCheckInRepository'
import { getReturnerSyncOverview } from './returnerRepository'
import { getSessionBlockSyncOverview } from './sessionBlockRepository'

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
      getSessionBlockSyncOverview(userId),
      getExposureSyncOverview(userId),
      getExerciseSyncOverview(userId),
      getMetricSyncOverview(userId),
      getPublicCheckInSyncOverview(userId),
    ]),
  )
}

type SyncGroupDefinition = {
  id: string
  label: string
  tables: PendingWriteTable[]
}

type SyncRecord = {
  userId: string
  syncStatus: 'synced' | 'pending' | 'error'
  syncError: string | null
}

const syncGroupDefinitions: SyncGroupDefinition[] = [
  { id: 'players', label: 'Spieler', tables: ['players'] },
  {
    id: 'sessions',
    label: 'Einheiten',
    tables: ['session_logs', 'player_session_entries', 'progress_entries', 'session_block_logs', 'player_exposure_summaries'],
  },
  { id: 'tests', label: 'Tests', tables: ['baseline_entries', 'exercise_results', 'metric_results'] },
  { id: 'returners', label: 'Returner', tables: ['returner_entries'] },
  {
    id: 'public-checkin',
    label: 'Public Check-in',
    tables: ['public_checkin_links', 'public_checkin_link_players', 'public_checkin_submissions'],
  },
]

const pendingTableToGroupId = new Map(
  syncGroupDefinitions.flatMap((group) => group.tables.map((table) => [table, group.id] as const)),
)

function groupStatus({
  conflictCount,
  errorCount,
  pendingCount,
}: {
  conflictCount: number
  errorCount: number
  pendingCount: number
}): SyncDetailStatus {
  if (conflictCount > 0) {
    return 'conflict'
  }

  if (errorCount > 0) {
    return 'error'
  }

  if (pendingCount > 0) {
    return 'pending'
  }

  return 'synced'
}

function groupDetail({
  conflictCount,
  errorCount,
  pendingCount,
}: {
  conflictCount: number
  errorCount: number
  pendingCount: number
}) {
  if (conflictCount > 0) {
    return conflictCount === 1 ? '1 Konflikt pruefen.' : `${conflictCount} Konflikte pruefen.`
  }

  if (errorCount > 0) {
    return errorCount === 1 ? '1 Datensatz braucht Retry.' : `${errorCount} Datensaetze brauchen Retry.`
  }

  if (pendingCount > 0) {
    return pendingCount === 1 ? '1 Aenderung lokal gespeichert.' : `${pendingCount} Aenderungen lokal gespeichert.`
  }

  return 'zuletzt synchronisiert oder keine offenen Aenderungen.'
}

function emptyGroupCounts() {
  return syncGroupDefinitions.reduce<Record<string, { pendingCount: number; errorCount: number; conflictCount: number }>>(
    (counts, group) => ({
      ...counts,
      [group.id]: { pendingCount: 0, errorCount: 0, conflictCount: 0 },
    }),
    {},
  )
}

function countSyncRecords(records: SyncRecord[], groupCounts: ReturnType<typeof emptyGroupCounts>, groupId: string) {
  for (const record of records) {
    if (record.syncStatus === 'error') {
      groupCounts[groupId].errorCount += 1
    }
  }
}

export async function getSyncDetailSummary(userId: string): Promise<SyncDetailSummary> {
  const [
    players,
    sessionLogs,
    playerSessionEntries,
    progressEntries,
    baselineEntries,
    returnerEntries,
    sessionBlockLogs,
    playerExposureSummaries,
    exerciseResults,
    metricResults,
    publicCheckInLinks,
    publicCheckInLinkPlayers,
    publicCheckInSubmissions,
    pendingWrites,
  ] = await Promise.all([
    localDb.players.where('userId').equals(userId).toArray(),
    localDb.sessionLogs.where('userId').equals(userId).toArray(),
    localDb.playerSessionEntries.where('userId').equals(userId).toArray(),
    localDb.progressEntries.where('userId').equals(userId).toArray(),
    localDb.baselineEntries.where('userId').equals(userId).toArray(),
    localDb.returnerEntries.where('userId').equals(userId).toArray(),
    localDb.sessionBlockLogs.where('userId').equals(userId).toArray(),
    localDb.playerExposureSummaries.where('userId').equals(userId).toArray(),
    localDb.exerciseResults.where('userId').equals(userId).toArray(),
    localDb.metricResults.where('userId').equals(userId).toArray(),
    localDb.publicCheckInLinks.where('userId').equals(userId).toArray(),
    localDb.publicCheckInLinkPlayers.where('userId').equals(userId).toArray(),
    localDb.publicCheckInSubmissions.where('userId').equals(userId).toArray(),
    localDb.pendingWrites.where('userId').equals(userId).toArray(),
  ])
  const groupCounts = emptyGroupCounts()

  for (const write of pendingWrites) {
    const groupId = pendingTableToGroupId.get(write.table)
    if (groupId) {
      groupCounts[groupId].pendingCount += 1
    }
  }

  countSyncRecords(players, groupCounts, 'players')
  countSyncRecords([...sessionLogs, ...playerSessionEntries, ...progressEntries, ...sessionBlockLogs, ...playerExposureSummaries], groupCounts, 'sessions')
  countSyncRecords([...baselineEntries, ...exerciseResults, ...metricResults], groupCounts, 'tests')
  countSyncRecords(returnerEntries, groupCounts, 'returners')
  countSyncRecords([...publicCheckInLinks, ...publicCheckInLinkPlayers, ...publicCheckInSubmissions], groupCounts, 'public-checkin')

  for (const submission of publicCheckInSubmissions) {
    if (submission.status === 'conflict' && !submission.deletedAt) {
      groupCounts['public-checkin'].conflictCount += 1
    }
  }

  const groups: SyncDetailGroup[] = syncGroupDefinitions
    .map((definition) => {
      const counts = groupCounts[definition.id]
      return {
        id: definition.id,
        label: definition.label,
        ...counts,
        status: groupStatus(counts),
        detail: groupDetail(counts),
      }
    })
    .filter((group) => group.pendingCount > 0 || group.errorCount > 0 || group.conflictCount > 0)

  return {
    groups,
    pendingCount: groups.reduce((total, group) => total + group.pendingCount, 0),
    errorCount: groups.reduce((total, group) => total + group.errorCount, 0),
    conflictCount: groups.reduce((total, group) => total + group.conflictCount, 0),
  }
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
    } else if (write.table === 'session_block_logs') {
      const record = await localDb.sessionBlockLogs.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.sessionBlockLogs.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'player_exposure_summaries') {
      const record = await localDb.playerExposureSummaries.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.playerExposureSummaries.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'metric_results') {
      const record = await localDb.metricResults.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.metricResults.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'exercise_results') {
      const record = await localDb.exerciseResults.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.exerciseResults.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'public_checkin_links') {
      const record = await localDb.publicCheckInLinks.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.publicCheckInLinks.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'public_checkin_link_players') {
      const record = await localDb.publicCheckInLinkPlayers.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.publicCheckInLinkPlayers.put({ ...record, syncStatus: 'pending', syncError: null })
        resetCount += 1
      }
    } else if (write.table === 'public_checkin_submissions') {
      const record = await localDb.publicCheckInSubmissions.get(write.recordId)
      if (record?.syncStatus === 'error') {
        await localDb.publicCheckInSubmissions.put({ ...record, syncStatus: 'pending', syncError: null })
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

export function buildManualSyncFeedback(overview: PlayerSyncOverview): ManualSyncFeedback {
  if (!overview.isOnline) {
    return { kind: 'error', message: 'Offline: Aenderungen bleiben lokal gespeichert.' }
  }

  if (overview.status === 'error' || overview.errorMessage) {
    return {
      kind: 'error',
      message: `Sync fehlgeschlagen: ${overview.errorMessage ?? 'Bitte spaeter erneut versuchen.'}`,
    }
  }

  if (overview.status === 'pending' || overview.pendingCount > 0) {
    const changeLabel = overview.pendingCount === 1 ? '1 Aenderung wartet' : `${overview.pendingCount} Aenderungen warten`
    return {
      kind: 'warning',
      message: `${changeLabel} auf Sync.`,
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
  let syncOverview = await syncCheckIns(userId)
  let publicCheckInSyncOverview: PlayerSyncOverview | null = null
  if (options.publicSessionDefinition) {
    try {
      await refreshRemotePublicCheckIns(userId, { sessionDefinitionId: options.publicSessionDefinition.id })
      await importPublicCheckInSubmissions(userId, options.publicSessionDefinition, {
        recoverImportedWithoutLocalEntry: true,
      })
      syncOverview = await syncCheckIns(userId, { sessionDefinitionId: options.publicSessionDefinition.id })
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
