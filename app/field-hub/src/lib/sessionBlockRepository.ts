import type { SessionDefinition } from '../content/types'
import {
  buildSessionBlockSnapshot,
  validateSessionBlockStatusReason,
  type SessionBlockLog,
  type SessionBlockLogPatch,
  type SessionBlockReason,
  type SessionBlockStatus,
} from '../domain/sessionBlocks'
import type { PlayerSyncOverview, SyncStatus } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import { getSyncMeta, localDb, setSyncMeta } from './localDb'
import { markSyncedIfUnchanged, markSyncErrorIfUnchanged } from './pendingWriteSync'
import { supabase } from './supabaseClient'

export type SessionBlockLogRow = {
  id: string
  user_id: string
  session_log_id: string
  session_definition_id: string
  block_key: string
  block_title: string
  block_order: number
  planned_time: string
  planned_work: string
  status: SessionBlockStatus
  reason: SessionBlockReason
  coach_note: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function queueSessionBlockWrite(entry: SessionBlockLog) {
  await localDb.pendingWrites
    .where('userId')
    .equals(entry.userId)
    .and((write) => write.table === 'session_block_logs' && write.recordId === entry.id)
    .delete()
  await localDb.pendingWrites.add({
    table: 'session_block_logs',
    operation: 'upsert',
    recordId: entry.id,
    userId: entry.userId,
    createdAt: nowIso(),
  })
}

export function sessionBlockLogFromRow(
  row: SessionBlockLogRow,
  syncStatus: SyncStatus = 'synced',
  syncError: string | null = null,
): SessionBlockLog {
  return {
    id: row.id,
    userId: row.user_id,
    sessionLogId: row.session_log_id,
    sessionDefinitionId: row.session_definition_id,
    blockKey: row.block_key,
    blockTitle: row.block_title,
    blockOrder: row.block_order,
    plannedTime: row.planned_time,
    plannedWork: row.planned_work,
    status: row.status,
    reason: row.reason,
    coachNote: row.coach_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus,
    syncError,
  }
}

export function rowFromSessionBlockLog(entry: SessionBlockLog): SessionBlockLogRow {
  return {
    id: entry.id,
    user_id: entry.userId,
    session_log_id: entry.sessionLogId,
    session_definition_id: entry.sessionDefinitionId,
    block_key: entry.blockKey,
    block_title: entry.blockTitle,
    block_order: entry.blockOrder,
    planned_time: entry.plannedTime,
    planned_work: entry.plannedWork,
    status: entry.status,
    reason: entry.reason,
    coach_note: entry.coachNote,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    deleted_at: entry.deletedAt,
    client_updated_at: entry.clientUpdatedAt,
  }
}

export async function listSessionBlockLogsForSession(userId: string, sessionLogId: string) {
  const entries = await localDb.sessionBlockLogs
    .where('[userId+sessionLogId]')
    .equals([userId, sessionLogId])
    .and((entry) => !entry.deletedAt)
    .toArray()

  return entries.sort((a, b) => a.blockOrder - b.blockOrder)
}

export async function saveSessionBlockLog(
  userId: string,
  sessionLogId: string,
  sessionDefinition: SessionDefinition,
  blockKey: string,
  patch: SessionBlockLogPatch,
) {
  const snapshot = buildSessionBlockSnapshot(sessionDefinition, blockKey)
  const existing = await localDb.sessionBlockLogs
    .where('[userId+sessionLogId+blockKey]')
    .equals([userId, sessionLogId, blockKey])
    .and((entry) => !entry.deletedAt)
    .first()
  const status = patch.status ?? existing?.status ?? 'planned'
  const reason = patch.reason ?? existing?.reason ?? 'none'
  const validation = validateSessionBlockStatusReason(status, reason)

  if (!validation.valid) {
    throw new Error(validation.error ?? 'Blockstatus ist ungueltig.')
  }

  const timestamp = nowIso()
  const entry: SessionBlockLog = {
    id: existing?.id ?? createId(),
    userId,
    sessionLogId,
    ...snapshot,
    status,
    reason,
    coachNote: patch.coachNote !== undefined ? patch.coachNote.trim() : (existing?.coachNote ?? ''),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: existing?.deletedAt ?? null,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.sessionBlockLogs.put(entry)
  await queueSessionBlockWrite(entry)

  return entry
}

export async function getSessionBlockSyncOverview(userId: string): Promise<PlayerSyncOverview> {
  const pendingCount = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'session_block_logs')
    .count()
  const erroredCount = await localDb.sessionBlockLogs
    .where('userId')
    .equals(userId)
    .and((entry) => entry.syncStatus === 'error')
    .count()
  const lastSuccessfulSyncAt = await getSyncMeta(`sessionBlocks:lastSuccessfulSyncAt:${userId}`)

  return {
    ...defaultPlayerSyncOverview,
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    status: erroredCount > 0 ? 'error' : pendingCount > 0 ? 'pending' : 'synced',
    pendingCount,
    lastSuccessfulSyncAt,
    errorMessage: erroredCount > 0 ? 'Mindestens ein Blockstatus konnte nicht synchronisiert werden.' : null,
  }
}

export async function syncPendingSessionBlockLogs(userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'session_block_logs')
    .toArray()

  const snapshots: Array<{ entry: SessionBlockLog; writeLocalId?: number }> = []
  for (const write of pendingWrites) {
    const entry = await localDb.sessionBlockLogs.get(write.recordId)
    if (!entry) {
      await localDb.pendingWrites.delete(write.localId ?? 0)
      continue
    }

    snapshots.push({ entry, writeLocalId: write.localId })
  }

  if (snapshots.length === 0) {
    return
  }

  const { error } = await supabase
    .from('session_block_logs')
    .upsert(snapshots.map(({ entry }) => rowFromSessionBlockLog(entry)), {
      onConflict: 'user_id,session_log_id,block_key',
    })
    .select('id')
  if (error) {
    for (const { entry } of snapshots) {
      await markSyncErrorIfUnchanged(localDb.sessionBlockLogs, entry, error.message)
    }
    throw new Error(error.message)
  }

  await Promise.all(
    snapshots.map(({ entry, writeLocalId }) => markSyncedIfUnchanged(localDb.sessionBlockLogs, entry, writeLocalId)),
  )
}

export type RefreshRemoteSessionBlockLogsOptions = {
  sessionLogIds?: string[]
}

export async function refreshRemoteSessionBlockLogs(
  userId: string,
  options: RefreshRemoteSessionBlockLogsOptions = {},
) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  if (!options.sessionLogIds || options.sessionLogIds.length === 0) {
    return
  }

  const query = supabase
    .from('session_block_logs')
    .select(
      'id,user_id,session_log_id,session_definition_id,block_key,block_title,block_order,planned_time,planned_work,status,reason,coach_note,created_at,updated_at,deleted_at,client_updated_at',
    )
    .eq('user_id', userId)
    .in('session_log_id', options.sessionLogIds)

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const remoteEntries = (data ?? []) as SessionBlockLogRow[]
  const entriesToPut: SessionBlockLog[] = []
  for (const row of remoteEntries) {
    const localById = await localDb.sessionBlockLogs.get(row.id)
    const localByBlock =
      localById ??
      (await localDb.sessionBlockLogs
        .where('[userId+sessionLogId+blockKey]')
        .equals([userId, row.session_log_id, row.block_key])
        .first())

    if (localByBlock && localByBlock.syncStatus !== 'synced') {
      continue
    }

    if (localByBlock && row.client_updated_at < localByBlock.clientUpdatedAt) {
      continue
    }

    if (localByBlock && localByBlock.id !== row.id) {
      await localDb.sessionBlockLogs.delete(localByBlock.id)
    }

    entriesToPut.push(sessionBlockLogFromRow(row))
  }
  await localDb.sessionBlockLogs.bulkPut(entriesToPut)

  await setSyncMeta(`sessionBlocks:lastSuccessfulSyncAt:${userId}`, nowIso())
}
