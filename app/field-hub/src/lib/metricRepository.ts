import {
  isKnownMetricKey,
  parseOptionalMetricValue,
  validateMetricResultPatch,
  type MetricBodySide,
  type MetricResult,
  type MetricResultPatch,
} from '../domain/metrics'
import type { PlayerSyncOverview, SyncStatus } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import { getSyncMeta, localDb, setSyncMeta } from './localDb'
import { markSyncedIfUnchanged, markSyncErrorIfUnchanged } from './pendingWriteSync'
import { supabase } from './supabaseClient'

export type MetricResultRow = {
  id: string
  user_id: string
  player_id: string | null
  session_log_id: string | null
  metric_key: string
  value: number
  attempt: number
  is_valid: boolean
  body_side: MetricBodySide
  context_note: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

export type RefreshRemoteMetricResultsOptions = {
  sessionLogIds?: string[]
  playerId?: string
  limit?: number
}

const metricSelectColumns =
  'id,user_id,player_id,session_log_id,metric_key,value,attempt,is_valid,body_side,context_note,created_at,updated_at,deleted_at,client_updated_at'
const metricPushBatchSize = 50
const metricPullSessionLimit = 25
const metricPlayerHistoryLimit = 20

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function metricResultFromRow(
  row: MetricResultRow,
  syncStatus: SyncStatus = 'synced',
  syncError: string | null = null,
): MetricResult {
  const validated = validateMetricResultPatch({
    metricKey: row.metric_key,
    value: row.value,
    attempt: row.attempt,
    isValid: row.is_valid,
    bodySide: row.body_side,
    contextNote: row.context_note,
  })

  return {
    id: row.id,
    userId: row.user_id,
    playerId: row.player_id,
    sessionLogId: row.session_log_id,
    metricKey: validated.metricKey,
    value: validated.value,
    attempt: validated.attempt,
    isValid: validated.isValid,
    bodySide: validated.bodySide,
    contextNote: validated.contextNote,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus,
    syncError,
  }
}

export function rowFromMetricResult(result: MetricResult): MetricResultRow {
  return {
    id: result.id,
    user_id: result.userId,
    player_id: result.playerId,
    session_log_id: result.sessionLogId,
    metric_key: result.metricKey,
    value: result.value,
    attempt: result.attempt,
    is_valid: result.isValid,
    body_side: result.bodySide,
    context_note: result.contextNote,
    created_at: result.createdAt,
    updated_at: result.updatedAt,
    deleted_at: result.deletedAt,
    client_updated_at: result.clientUpdatedAt,
  }
}

async function queueMetricWrite(result: MetricResult) {
  await localDb.pendingWrites
    .where('userId')
    .equals(result.userId)
    .and((write) => write.table === 'metric_results' && write.recordId === result.id)
    .delete()
  await localDb.pendingWrites.add({
    table: 'metric_results',
    operation: 'upsert',
    recordId: result.id,
    userId: result.userId,
    createdAt: nowIso(),
  })
}

async function findExistingMetricResult(
  userId: string,
  sessionLogId: string,
  playerId: string,
  patch: Pick<MetricResult, 'metricKey' | 'attempt' | 'bodySide'>,
) {
  return localDb.metricResults
    .where('[userId+sessionLogId+playerId+metricKey+attempt+bodySide]')
    .equals([userId, sessionLogId, playerId, patch.metricKey, patch.attempt, patch.bodySide])
    .first()
}

export async function saveMetricResult(
  userId: string,
  sessionLogId: string,
  playerId: string,
  patch: MetricResultPatch,
) {
  if (parseOptionalMetricValue(patch.value) === null) {
    if (!isKnownMetricKey(patch.metricKey)) {
      throw new Error(`Unbekannte Metric: ${patch.metricKey}`)
    }

    const existing = await findExistingMetricResult(userId, sessionLogId, playerId, {
      metricKey: patch.metricKey,
      attempt: patch.attempt ?? 1,
      bodySide: patch.bodySide ?? 'none',
    })
    if (!existing) {
      return null
    }

    const timestamp = nowIso()
    const deleted: MetricResult = {
      ...existing,
      deletedAt: timestamp,
      updatedAt: timestamp,
      clientUpdatedAt: timestamp,
      syncStatus: 'pending',
      syncError: null,
    }
    await localDb.metricResults.put(deleted)
    await queueMetricWrite(deleted)
    return deleted
  }

  const validated = validateMetricResultPatch(patch)
  const timestamp = nowIso()
  const existing = await findExistingMetricResult(userId, sessionLogId, playerId, validated)
  const result: MetricResult = {
    id: existing?.id ?? createId(),
    userId,
    playerId,
    sessionLogId,
    metricKey: validated.metricKey,
    value: validated.value,
    attempt: validated.attempt,
    isValid: validated.isValid,
    bodySide: validated.bodySide,
    contextNote: validated.contextNote,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.metricResults.put(result)
  await queueMetricWrite(result)

  return result
}

export async function listMetricResultsForSession(userId: string, sessionLogId: string) {
  const results = await localDb.metricResults
    .where('[userId+sessionLogId]')
    .equals([userId, sessionLogId])
    .and((result) => !result.deletedAt)
    .toArray()

  return results.sort((a, b) => {
    if ((a.playerId ?? '') !== (b.playerId ?? '')) {
      return (a.playerId ?? '').localeCompare(b.playerId ?? '', 'de-AT')
    }
    if (a.metricKey !== b.metricKey) {
      return a.metricKey.localeCompare(b.metricKey, 'de-AT')
    }
    if (a.attempt !== b.attempt) {
      return a.attempt - b.attempt
    }
    return a.bodySide.localeCompare(b.bodySide, 'de-AT')
  })
}

export async function listRecentMetricResultsForPlayer(userId: string, playerId: string, limit = 12) {
  const results = await localDb.metricResults
    .where('userId')
    .equals(userId)
    .and((result) => result.playerId === playerId && !result.deletedAt)
    .toArray()

  return results.sort((a, b) => b.clientUpdatedAt.localeCompare(a.clientUpdatedAt)).slice(0, limit)
}

export async function getMetricSyncOverview(userId: string): Promise<PlayerSyncOverview> {
  const pendingCount = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'metric_results')
    .count()
  const erroredCount = await localDb.metricResults
    .where('userId')
    .equals(userId)
    .and((result) => result.syncStatus === 'error')
    .count()
  const lastSuccessfulSyncAt = await getSyncMeta(`metrics:lastSuccessfulSyncAt:${userId}`)

  return {
    ...defaultPlayerSyncOverview,
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    status: erroredCount > 0 ? 'error' : pendingCount > 0 ? 'pending' : 'synced',
    pendingCount,
    lastSuccessfulSyncAt,
    errorMessage: erroredCount > 0 ? 'Mindestens ein Metric-Result konnte nicht synchronisiert werden.' : null,
  }
}

async function syncPendingMetricResultBatch(userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'metric_results')
    .limit(metricPushBatchSize)
    .toArray()
  const snapshots: Array<{ result: MetricResult; writeLocalId?: number }> = []

  for (const write of pendingWrites) {
    const result = await localDb.metricResults.get(write.recordId)
    if (!result) {
      await localDb.pendingWrites.delete(write.localId ?? 0)
      continue
    }

    snapshots.push({ result, writeLocalId: write.localId })
  }

  if (snapshots.length === 0) {
    return 0
  }

  const { error } = await supabase
    .from('metric_results')
    .upsert(snapshots.map(({ result }) => rowFromMetricResult(result)), {
      onConflict: 'user_id,session_log_id,player_id,metric_key,attempt,body_side',
    })
    .select('id')

  if (error) {
    for (const { result } of snapshots) {
      await markSyncErrorIfUnchanged(localDb.metricResults, result, error.message)
    }
    throw new Error(error.message)
  }

  await Promise.all(
    snapshots.map(({ result, writeLocalId }) => markSyncedIfUnchanged(localDb.metricResults, result, writeLocalId)),
  )

  return snapshots.length
}

export async function syncPendingMetricResults(userId: string) {
  let syncedCount = 0
  let batchCount = metricPushBatchSize

  while (batchCount === metricPushBatchSize) {
    batchCount = await syncPendingMetricResultBatch(userId)
    syncedCount += batchCount
  }

  return syncedCount
}

export async function refreshRemoteMetricResults(
  userId: string,
  options: RefreshRemoteMetricResultsOptions,
) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  if (options.sessionLogIds && options.sessionLogIds.length === 0) {
    return
  }

  const sessionLogIds = options.sessionLogIds?.slice(0, metricPullSessionLimit)
  if (!sessionLogIds && !options.playerId) {
    throw new Error('Metric-Pull braucht einen Session- oder Player-Scope.')
  }

  let query = supabase.from('metric_results').select(metricSelectColumns).eq('user_id', userId)
  if (sessionLogIds) {
    query = query.in('session_log_id', sessionLogIds)
  }
  if (options.playerId) {
    query = query
      .eq('player_id', options.playerId)
      .order('client_updated_at', { ascending: false })
      .limit(Math.min(Math.max(options.limit ?? 12, 1), metricPlayerHistoryLimit))
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  const remoteRows = (data ?? []) as MetricResultRow[]
  const resultsToPut: MetricResult[] = []
  for (const row of remoteRows) {
    const localById = await localDb.metricResults.get(row.id)
    const localByNaturalKey =
      localById ??
      (row.session_log_id && row.player_id
        ? await localDb.metricResults
            .where('[userId+sessionLogId+playerId+metricKey+attempt+bodySide]')
            .equals([userId, row.session_log_id, row.player_id, row.metric_key, row.attempt, row.body_side])
            .first()
        : null)

    if (localByNaturalKey && localByNaturalKey.syncStatus !== 'synced') {
      continue
    }

    if (localByNaturalKey && row.client_updated_at < localByNaturalKey.clientUpdatedAt) {
      continue
    }

    if (localByNaturalKey && localByNaturalKey.id !== row.id) {
      await localDb.metricResults.delete(localByNaturalKey.id)
    }

    resultsToPut.push(metricResultFromRow(row))
  }
  await localDb.metricResults.bulkPut(resultsToPut)
  await setSyncMeta(`metrics:lastSuccessfulSyncAt:${userId}`, nowIso())
}
