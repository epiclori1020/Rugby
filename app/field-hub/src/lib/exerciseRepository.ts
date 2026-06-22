import {
  hasExerciseResultContent,
  isKnownExerciseKey,
  validateExerciseResultPatch,
  type ExercisePainResponse,
  type ExerciseResult,
  type ExerciseResultPatch,
  type ExerciseTechniqueQuality,
  type ExerciseVariant,
} from '../domain/exercises'
import type { ExerciseUnit } from '../content/exerciseDefinitions'
import type { PlayerSyncOverview, SyncStatus } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import { getSyncMeta, localDb, setSyncMeta } from './localDb'
import { markSyncedIfUnchanged, markSyncErrorIfUnchanged } from './pendingWriteSync'
import { supabase } from './supabaseClient'

export type ExerciseResultRow = {
  id: string
  user_id: string
  player_id: string | null
  session_log_id: string | null
  exercise_key: string
  variant: ExerciseVariant
  sets: number | null
  reps: string
  load_value: number | null
  load_unit: ExerciseUnit
  rpe: number | null
  rir: number | null
  technique_quality: ExerciseTechniqueQuality
  pain_response: ExercisePainResponse
  notes: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

export type RefreshRemoteExerciseResultsOptions = {
  sessionLogIds?: string[]
  playerId?: string
  limit?: number
}

const exerciseSelectColumns =
  'id,user_id,player_id,session_log_id,exercise_key,variant,sets,reps,load_value,load_unit,rpe,rir,technique_quality,pain_response,notes,created_at,updated_at,deleted_at,client_updated_at'
const exercisePushBatchSize = 50
const exercisePullSessionLimit = 25
const exercisePlayerHistoryLimit = 20

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function exerciseResultFromRow(
  row: ExerciseResultRow,
  syncStatus: SyncStatus = 'synced',
  syncError: string | null = null,
): ExerciseResult {
  const validated = validateExerciseResultPatch({
    exerciseKey: row.exercise_key,
    variant: row.variant,
    sets: row.sets,
    reps: row.reps,
    loadValue: row.load_value,
    loadUnit: row.load_unit,
    rpe: row.rpe,
    rir: row.rir,
    techniqueQuality: row.technique_quality,
    painResponse: row.pain_response,
    notes: row.notes,
  })

  return {
    id: row.id,
    userId: row.user_id,
    playerId: row.player_id,
    sessionLogId: row.session_log_id,
    exerciseKey: validated.exerciseKey,
    variant: validated.variant,
    sets: validated.sets,
    reps: validated.reps,
    loadValue: validated.loadValue,
    loadUnit: validated.loadUnit,
    rpe: validated.rpe,
    rir: validated.rir,
    techniqueQuality: validated.techniqueQuality,
    painResponse: validated.painResponse,
    notes: validated.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus,
    syncError,
  }
}

export function rowFromExerciseResult(result: ExerciseResult): ExerciseResultRow {
  return {
    id: result.id,
    user_id: result.userId,
    player_id: result.playerId,
    session_log_id: result.sessionLogId,
    exercise_key: result.exerciseKey,
    variant: result.variant,
    sets: result.sets,
    reps: result.reps,
    load_value: result.loadValue,
    load_unit: result.loadUnit,
    rpe: result.rpe,
    rir: result.rir,
    technique_quality: result.techniqueQuality,
    pain_response: result.painResponse,
    notes: result.notes,
    created_at: result.createdAt,
    updated_at: result.updatedAt,
    deleted_at: result.deletedAt,
    client_updated_at: result.clientUpdatedAt,
  }
}

async function queueExerciseWrite(result: ExerciseResult) {
  await localDb.pendingWrites
    .where('userId')
    .equals(result.userId)
    .and((write) => write.table === 'exercise_results' && write.recordId === result.id)
    .delete()
  await localDb.pendingWrites.add({
    table: 'exercise_results',
    operation: 'upsert',
    recordId: result.id,
    userId: result.userId,
    createdAt: nowIso(),
  })
}

async function findExistingExerciseResult(
  userId: string,
  sessionLogId: string,
  playerId: string,
  exerciseKey: string,
) {
  return localDb.exerciseResults
    .where('[userId+sessionLogId+playerId+exerciseKey]')
    .equals([userId, sessionLogId, playerId, exerciseKey])
    .first()
}

function canReplaceExerciseResult(
  result: ExerciseResult | undefined,
  userId: string,
  sessionLogId: string,
  playerId: string,
) {
  return result?.userId === userId && result.sessionLogId === sessionLogId && result.playerId === playerId && !result.deletedAt
}

async function softDeleteExerciseResult(result: ExerciseResult, timestamp: string, replacement?: Partial<ExerciseResult>) {
  const deleted: ExerciseResult = {
    ...result,
    ...replacement,
    deletedAt: timestamp,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }
  await localDb.exerciseResults.put(deleted)
  await queueExerciseWrite(deleted)
  return deleted
}

export async function saveExerciseResult(
  userId: string,
  sessionLogId: string,
  playerId: string,
  patch: ExerciseResultPatch,
) {
  if (!isKnownExerciseKey(patch.exerciseKey)) {
    throw new Error(`Unbekannte Uebung: ${patch.exerciseKey}`)
  }

  const validated = validateExerciseResultPatch(patch)
  const source = patch.sourceResultId ? await localDb.exerciseResults.get(patch.sourceResultId) : undefined
  const existing = await findExistingExerciseResult(userId, sessionLogId, playerId, validated.exerciseKey)
  const sourceCanBeReplaced = canReplaceExerciseResult(source, userId, sessionLogId, playerId)
  const timestamp = nowIso()

  if (!hasExerciseResultContent(validated)) {
    const target = existing ?? (sourceCanBeReplaced ? source : undefined)
    if (!target) {
      return null
    }

    return softDeleteExerciseResult(target, timestamp, target.id === existing?.id ? validated : undefined)
  }

  if (sourceCanBeReplaced && source && source.id !== existing?.id && source.exerciseKey !== validated.exerciseKey) {
    await softDeleteExerciseResult(source, timestamp)
  }

  const result: ExerciseResult = {
    id: existing?.id ?? createId(),
    userId,
    playerId,
    sessionLogId,
    exerciseKey: validated.exerciseKey,
    variant: validated.variant,
    sets: validated.sets,
    reps: validated.reps,
    loadValue: validated.loadValue,
    loadUnit: validated.loadUnit,
    rpe: validated.rpe,
    rir: validated.rir,
    techniqueQuality: validated.techniqueQuality,
    painResponse: validated.painResponse,
    notes: validated.notes,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.exerciseResults.put(result)
  await queueExerciseWrite(result)

  return result
}

export async function listExerciseResultsForSession(userId: string, sessionLogId: string) {
  const results = await localDb.exerciseResults
    .where('[userId+sessionLogId]')
    .equals([userId, sessionLogId])
    .and((result) => !result.deletedAt)
    .toArray()

  return results.sort((a, b) => {
    if ((a.playerId ?? '') !== (b.playerId ?? '')) {
      return (a.playerId ?? '').localeCompare(b.playerId ?? '', 'de-AT')
    }
    return a.exerciseKey.localeCompare(b.exerciseKey, 'de-AT')
  })
}

export async function listRecentExerciseResultsForPlayer(userId: string, playerId: string, limit = 12) {
  const results = await localDb.exerciseResults
    .where('userId')
    .equals(userId)
    .and((result) => result.playerId === playerId && !result.deletedAt)
    .toArray()

  return results.sort((a, b) => b.clientUpdatedAt.localeCompare(a.clientUpdatedAt)).slice(0, limit)
}

export async function getExerciseSyncOverview(userId: string): Promise<PlayerSyncOverview> {
  const pendingCount = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'exercise_results')
    .count()
  const erroredCount = await localDb.exerciseResults
    .where('userId')
    .equals(userId)
    .and((result) => result.syncStatus === 'error')
    .count()
  const lastSuccessfulSyncAt = await getSyncMeta(`exercises:lastSuccessfulSyncAt:${userId}`)

  return {
    ...defaultPlayerSyncOverview,
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    status: erroredCount > 0 ? 'error' : pendingCount > 0 ? 'pending' : 'synced',
    pendingCount,
    lastSuccessfulSyncAt,
    errorMessage: erroredCount > 0 ? 'Mindestens ein Exercise-Result konnte nicht synchronisiert werden.' : null,
  }
}

async function syncPendingExerciseResultBatch(userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'exercise_results')
    .limit(exercisePushBatchSize)
    .toArray()
  const snapshots: Array<{ result: ExerciseResult; writeLocalId?: number }> = []

  for (const write of pendingWrites) {
    const result = await localDb.exerciseResults.get(write.recordId)
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
    .from('exercise_results')
    .upsert(snapshots.map(({ result }) => rowFromExerciseResult(result)), {
      onConflict: 'user_id,session_log_id,player_id,exercise_key',
    })
    .select('id')

  if (error) {
    for (const { result } of snapshots) {
      await markSyncErrorIfUnchanged(localDb.exerciseResults, result, error.message)
    }
    throw new Error(error.message)
  }

  await Promise.all(
    snapshots.map(({ result, writeLocalId }) => markSyncedIfUnchanged(localDb.exerciseResults, result, writeLocalId)),
  )

  return snapshots.length
}

export async function syncPendingExerciseResults(userId: string) {
  let syncedCount = 0
  let batchCount = exercisePushBatchSize

  while (batchCount === exercisePushBatchSize) {
    batchCount = await syncPendingExerciseResultBatch(userId)
    syncedCount += batchCount
  }

  return syncedCount
}

export async function refreshRemoteExerciseResults(userId: string, options: RefreshRemoteExerciseResultsOptions) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  if (options.sessionLogIds && options.sessionLogIds.length === 0) {
    return
  }

  const sessionLogIds = options.sessionLogIds?.slice(0, exercisePullSessionLimit)
  if (!sessionLogIds && !options.playerId) {
    throw new Error('Exercise-Pull braucht einen Session- oder Player-Scope.')
  }

  let query = supabase.from('exercise_results').select(exerciseSelectColumns).eq('user_id', userId)
  if (sessionLogIds) {
    query = query.in('session_log_id', sessionLogIds)
  }
  if (options.playerId) {
    query = query
      .eq('player_id', options.playerId)
      .order('client_updated_at', { ascending: false })
      .limit(Math.min(Math.max(options.limit ?? 12, 1), exercisePlayerHistoryLimit))
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  const remoteRows = (data ?? []) as ExerciseResultRow[]
  const resultsToPut: ExerciseResult[] = []
  for (const row of remoteRows) {
    const localById = await localDb.exerciseResults.get(row.id)
    const localByNaturalKey =
      localById ??
      (row.session_log_id && row.player_id
        ? await localDb.exerciseResults
            .where('[userId+sessionLogId+playerId+exerciseKey]')
            .equals([userId, row.session_log_id, row.player_id, row.exercise_key])
            .first()
        : null)

    if (localByNaturalKey && localByNaturalKey.syncStatus !== 'synced') {
      continue
    }

    if (localByNaturalKey && row.client_updated_at < localByNaturalKey.clientUpdatedAt) {
      continue
    }

    if (localByNaturalKey && localByNaturalKey.id !== row.id) {
      await localDb.exerciseResults.delete(localByNaturalKey.id)
    }

    resultsToPut.push(exerciseResultFromRow(row))
  }
  await localDb.exerciseResults.bulkPut(resultsToPut)
  await setSyncMeta(`exercises:lastSuccessfulSyncAt:${userId}`, nowIso())
}
