import type { SessionDefinition } from '../content/types'
import Dexie from 'dexie'
import {
  buildPlayerExposureSummaries,
  createEmptyExposureStatuses,
  exposureTypes,
  mergeManualExposureOverrides,
  type ExposureSources,
  type ExposureStatus,
  type ExposureType,
  type ManualExposureOverrides,
  type PlayerExposureSummary,
} from '../domain/exposures'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import type { ReturnerCapSummary } from '../domain/returners'
import type { SessionBlockLog } from '../domain/sessionBlocks'
import type { PlayerSyncOverview, SyncStatus } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import { getSyncMeta, localDb, setSyncMeta } from './localDb'
import { markSyncedIfUnchanged, markSyncErrorIfUnchanged } from './pendingWriteSync'
import { supabase } from './supabaseClient'

export type PlayerExposureSummaryRow = {
  id: string
  user_id: string
  player_id: string | null
  session_log_id: string | null
  session_definition_id: string
  session_date: string
  speed_status: ExposureStatus
  acceleration_status: ExposureStatus
  cod_decel_status: ExposureStatus
  lower_strength_status: ExposureStatus
  upper_strength_status: ExposureStatus
  power_status: ExposureStatus
  conditioning_status: ExposureStatus
  contact_prep_status: ExposureStatus
  neck_trunk_status: ExposureStatus
  mobility_status: ExposureStatus
  reconditioning_status: ExposureStatus
  sources: ExposureSources
  manual_overrides: ManualExposureOverrides
  coach_note: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

export type SavePlayerExposureSummariesInput = {
  sessionLog: SessionLog
  sessionDefinition: SessionDefinition
  blockLogs: SessionBlockLog[]
  entries: PlayerSessionEntry[]
  returnerCaps: ReturnerCapSummary[]
}

const exposureSelectColumns =
  'id,user_id,player_id,session_log_id,session_definition_id,session_date,speed_status,acceleration_status,cod_decel_status,lower_strength_status,upper_strength_status,power_status,conditioning_status,contact_prep_status,neck_trunk_status,mobility_status,reconditioning_status,sources,manual_overrides,coach_note,created_at,updated_at,deleted_at,client_updated_at'

const exposurePushBatchSize = 50
const exposurePullSessionLimit = 25
const exposurePlayerHistoryLimit = 12

function nowIso() {
  return new Date().toISOString()
}

function statusColumn(type: ExposureType) {
  return `${type}_status` as keyof PlayerExposureSummaryRow
}

function statusesFromRow(row: PlayerExposureSummaryRow) {
  const statuses = createEmptyExposureStatuses()
  for (const type of exposureTypes) {
    statuses[type] = row[statusColumn(type)] as ExposureStatus
  }

  return statuses
}

function jsonObject<T extends object>(value: unknown, fallback: T): T {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as T) : fallback
}

export function summaryFromExposureRow(
  row: PlayerExposureSummaryRow,
  syncStatus: SyncStatus = 'synced',
  syncError: string | null = null,
): PlayerExposureSummary {
  return {
    id: row.id,
    userId: row.user_id,
    playerId: row.player_id,
    sessionLogId: row.session_log_id,
    sessionDefinitionId: row.session_definition_id,
    sessionDate: row.session_date,
    statuses: statusesFromRow(row),
    sources: jsonObject(row.sources, {}),
    manualOverrides: jsonObject(row.manual_overrides, {}),
    coachNote: row.coach_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus,
    syncError,
  }
}

export function rowFromExposureSummary(summary: PlayerExposureSummary): PlayerExposureSummaryRow {
  return {
    id: summary.id,
    user_id: summary.userId,
    player_id: summary.playerId,
    session_log_id: summary.sessionLogId,
    session_definition_id: summary.sessionDefinitionId,
    session_date: summary.sessionDate,
    speed_status: summary.statuses.speed,
    acceleration_status: summary.statuses.acceleration,
    cod_decel_status: summary.statuses.cod_decel,
    lower_strength_status: summary.statuses.lower_strength,
    upper_strength_status: summary.statuses.upper_strength,
    power_status: summary.statuses.power,
    conditioning_status: summary.statuses.conditioning,
    contact_prep_status: summary.statuses.contact_prep,
    neck_trunk_status: summary.statuses.neck_trunk,
    mobility_status: summary.statuses.mobility,
    reconditioning_status: summary.statuses.reconditioning,
    sources: summary.sources,
    manual_overrides: summary.manualOverrides,
    coach_note: summary.coachNote,
    created_at: summary.createdAt,
    updated_at: summary.updatedAt,
    deleted_at: summary.deletedAt,
    client_updated_at: summary.clientUpdatedAt,
  }
}

async function queueExposureWrite(summary: PlayerExposureSummary) {
  await localDb.pendingWrites
    .where('userId')
    .equals(summary.userId)
    .and((write) => write.table === 'player_exposure_summaries' && write.recordId === summary.id)
    .delete()
  await localDb.pendingWrites.add({
    table: 'player_exposure_summaries',
    operation: 'upsert',
    recordId: summary.id,
    userId: summary.userId,
    createdAt: nowIso(),
  })
}

export async function listExposureSummariesForSession(userId: string, sessionLogId: string) {
  const summaries = await localDb.playerExposureSummaries
    .where('[userId+sessionLogId]')
    .equals([userId, sessionLogId])
    .and((summary) => !summary.deletedAt)
    .toArray()

  return summaries.sort((a, b) => (a.playerId ?? '').localeCompare(b.playerId ?? '', 'de-AT'))
}

export async function listRecentExposureSummariesForPlayer(userId: string, playerId: string, limit = 6) {
  const summaries = await localDb.playerExposureSummaries
    .where('[userId+playerId+sessionDate]')
    .between([userId, playerId, Dexie.minKey], [userId, playerId, Dexie.maxKey])
    .and((summary) => !summary.deletedAt)
    .toArray()

  return summaries.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)).slice(0, limit)
}

export async function savePlayerExposureSummaries(
  userId: string,
  input: SavePlayerExposureSummariesInput,
) {
  const allExistingSummaries = await localDb.playerExposureSummaries
    .where('[userId+sessionLogId]')
    .equals([userId, input.sessionLog.id])
    .toArray()
  const existingSummaries = allExistingSummaries.filter((summary) => !summary.deletedAt)
  const summariesForReuse = allExistingSummaries.filter((summary) => summary.playerId !== null)
  const summaries = buildPlayerExposureSummaries({
    userId,
    sessionLog: input.sessionLog,
    sessionDefinition: input.sessionDefinition,
    blockLogs: input.blockLogs,
    entries: input.entries,
    returnerCaps: input.returnerCaps,
    existingSummaries: summariesForReuse,
  })
  const generatedPlayerIds = new Set(summaries.flatMap((summary) => (summary.playerId ? [summary.playerId] : [])))
  const timestamp = nowIso()

  await localDb.playerExposureSummaries.bulkPut(summaries)
  for (const summary of summaries) {
    await queueExposureWrite(summary)
  }

  for (const existing of existingSummaries) {
    if (!existing.playerId || generatedPlayerIds.has(existing.playerId)) {
      continue
    }

    const deletedSummary: PlayerExposureSummary = {
      ...existing,
      deletedAt: timestamp,
      updatedAt: timestamp,
      clientUpdatedAt: timestamp,
      syncStatus: 'pending',
      syncError: null,
    }
    await localDb.playerExposureSummaries.put(deletedSummary)
    await queueExposureWrite(deletedSummary)
  }

  return summaries
}

export async function saveManualExposureOverride(
  userId: string,
  summaryId: string,
  type: ExposureType,
  override: { status: Exclude<ExposureStatus, 'none'>; note: string },
) {
  const existing = await localDb.playerExposureSummaries.get(summaryId)
  if (!existing || existing.userId !== userId || existing.deletedAt) {
    throw new Error('Exposure-Summary nicht gefunden.')
  }

  const timestamp = nowIso()
  const manualOverrides = mergeManualExposureOverrides(existing.manualOverrides, type, {
    ...override,
    updatedAt: timestamp,
  })
  const updated: PlayerExposureSummary = {
    ...existing,
    statuses: {
      ...existing.statuses,
      [type]: override.status,
    },
    manualOverrides,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.playerExposureSummaries.put(updated)
  await queueExposureWrite(updated)

  return updated
}

export async function resetExposureSummariesForSession(userId: string, sessionLogId: string) {
  const summaries = await localDb.playerExposureSummaries
    .where('[userId+sessionLogId]')
    .equals([userId, sessionLogId])
    .and((summary) => !summary.deletedAt)
    .toArray()
  const timestamp = nowIso()

  for (const summary of summaries) {
    const deletedSummary: PlayerExposureSummary = {
      ...summary,
      deletedAt: timestamp,
      updatedAt: timestamp,
      clientUpdatedAt: timestamp,
      syncStatus: 'pending',
      syncError: null,
    }
    await localDb.playerExposureSummaries.put(deletedSummary)
    await queueExposureWrite(deletedSummary)
  }

  return { resetCount: summaries.length }
}

export async function getExposureSyncOverview(userId: string): Promise<PlayerSyncOverview> {
  const pendingCount = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'player_exposure_summaries')
    .count()
  const erroredCount = await localDb.playerExposureSummaries
    .where('userId')
    .equals(userId)
    .and((summary) => summary.syncStatus === 'error')
    .count()
  const lastSuccessfulSyncAt = await getSyncMeta(`exposures:lastSuccessfulSyncAt:${userId}`)

  return {
    ...defaultPlayerSyncOverview,
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    status: erroredCount > 0 ? 'error' : pendingCount > 0 ? 'pending' : 'synced',
    pendingCount,
    lastSuccessfulSyncAt,
    errorMessage: erroredCount > 0 ? 'Mindestens eine Exposure-Summary konnte nicht synchronisiert werden.' : null,
  }
}

async function syncPendingExposureSummaryBatch(userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'player_exposure_summaries')
    .limit(exposurePushBatchSize)
    .toArray()
  const snapshots: Array<{ summary: PlayerExposureSummary; writeLocalId?: number }> = []

  for (const write of pendingWrites) {
    const summary = await localDb.playerExposureSummaries.get(write.recordId)
    if (!summary) {
      await localDb.pendingWrites.delete(write.localId ?? 0)
      continue
    }

    snapshots.push({ summary, writeLocalId: write.localId })
  }

  if (snapshots.length === 0) {
    return 0
  }

  const { error } = await supabase
    .from('player_exposure_summaries')
    .upsert(snapshots.map(({ summary }) => rowFromExposureSummary(summary)), {
      onConflict: 'user_id,session_log_id,player_id',
    })
    .select('id')

  if (error) {
    for (const { summary } of snapshots) {
      await markSyncErrorIfUnchanged(localDb.playerExposureSummaries, summary, error.message)
    }
    throw new Error(error.message)
  }

  await Promise.all(
    snapshots.map(({ summary, writeLocalId }) =>
      markSyncedIfUnchanged(localDb.playerExposureSummaries, summary, writeLocalId),
    ),
  )

  return snapshots.length
}

export async function syncPendingExposureSummaries(userId: string) {
  let syncedCount = 0
  let batchCount = exposurePushBatchSize

  while (batchCount === exposurePushBatchSize) {
    batchCount = await syncPendingExposureSummaryBatch(userId)
    syncedCount += batchCount
  }

  return syncedCount
}

export type RefreshRemoteExposureSummariesOptions = {
  sessionLogIds?: string[]
  playerId?: string
  limit?: number
}

export async function refreshRemoteExposureSummaries(
  userId: string,
  options: RefreshRemoteExposureSummariesOptions,
) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  if (options.sessionLogIds && options.sessionLogIds.length === 0) {
    return
  }

  const sessionLogIds = options.sessionLogIds?.slice(0, exposurePullSessionLimit)
  if (!sessionLogIds && !options.playerId) {
    throw new Error('Exposure-Pull braucht einen Session- oder Player-Scope.')
  }

  let query = supabase.from('player_exposure_summaries').select(exposureSelectColumns).eq('user_id', userId)
  if (sessionLogIds) {
    query = query.in('session_log_id', sessionLogIds)
  }
  if (options.playerId) {
    query = query
      .eq('player_id', options.playerId)
      .order('session_date', { ascending: false })
      .limit(Math.min(Math.max(options.limit ?? 6, 1), exposurePlayerHistoryLimit))
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  const remoteRows = (data ?? []) as PlayerExposureSummaryRow[]
  const summariesToPut: PlayerExposureSummary[] = []
  for (const row of remoteRows) {
    const localById = await localDb.playerExposureSummaries.get(row.id)
    const localByNaturalKey =
      localById ??
      (row.session_log_id && row.player_id
        ? await localDb.playerExposureSummaries
            .where('[userId+sessionLogId]')
            .equals([userId, row.session_log_id])
            .and((summary) => summary.playerId === row.player_id)
            .first()
        : null)

    if (localByNaturalKey && localByNaturalKey.syncStatus !== 'synced') {
      continue
    }

    if (localByNaturalKey && row.client_updated_at < localByNaturalKey.clientUpdatedAt) {
      continue
    }

    if (localByNaturalKey && localByNaturalKey.id !== row.id) {
      await localDb.playerExposureSummaries.delete(localByNaturalKey.id)
    }

    summariesToPut.push(summaryFromExposureRow(row))
  }
  await localDb.playerExposureSummaries.bulkPut(summariesToPut)
  await setSyncMeta(`exposures:lastSuccessfulSyncAt:${userId}`, nowIso())
}
