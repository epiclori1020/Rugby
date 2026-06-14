import type { BaselineEntry, BaselineEntryPatch } from '../domain/baseline'
import type { PlayerSyncOverview, SyncStatus } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import { getSyncMeta, localDb, setSyncMeta } from './localDb'
import { supabase } from './supabaseClient'

export type BaselineEntryRow = {
  id: string
  user_id: string
  player_id: string
  session_log_id: string
  broad_jump_cm: number | null
  med_ball_chest_pass_m: number | null
  med_ball_weight_kg: number | null
  sprint_30m: number | null
  note: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

export type LatestBaselineEntry = BaselineEntry & {
  sessionDate: string
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

function normalizedNumber(value: number | null | undefined, fallback: number | null, fieldLabel: string) {
  if (value === undefined) {
    return fallback
  }

  if (value !== null && (!Number.isFinite(value) || value < 0)) {
    throw new Error(`${fieldLabel} muss eine nicht-negative Zahl sein.`)
  }

  return value
}

async function queueBaselineWrite(entry: BaselineEntry) {
  await localDb.pendingWrites
    .where('userId')
    .equals(entry.userId)
    .and((write) => write.table === 'baseline_entries' && write.recordId === entry.id)
    .delete()
  await localDb.pendingWrites.add({
    table: 'baseline_entries',
    operation: 'upsert',
    recordId: entry.id,
    userId: entry.userId,
    createdAt: nowIso(),
  })
}

export function baselineEntryFromRow(
  row: BaselineEntryRow,
  syncStatus: SyncStatus = 'synced',
  syncError: string | null = null,
): BaselineEntry {
  return {
    id: row.id,
    userId: row.user_id,
    playerId: row.player_id,
    sessionLogId: row.session_log_id,
    broadJumpCm: row.broad_jump_cm,
    medBallChestPassM: row.med_ball_chest_pass_m,
    medBallWeightKg: row.med_ball_weight_kg,
    sprint30m: row.sprint_30m,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus,
    syncError,
  }
}

export function rowFromBaselineEntry(entry: BaselineEntry): BaselineEntryRow {
  return {
    id: entry.id,
    user_id: entry.userId,
    player_id: entry.playerId,
    session_log_id: entry.sessionLogId,
    broad_jump_cm: entry.broadJumpCm,
    med_ball_chest_pass_m: entry.medBallChestPassM,
    med_ball_weight_kg: entry.medBallWeightKg,
    sprint_30m: entry.sprint30m,
    note: entry.note,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    deleted_at: entry.deletedAt,
    client_updated_at: entry.clientUpdatedAt,
  }
}

export async function listBaselineEntriesForSession(userId: string, sessionLogId: string) {
  const entries = await localDb.baselineEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === sessionLogId && !entry.deletedAt)
    .toArray()

  return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function saveBaselineEntry(
  userId: string,
  sessionLogId: string,
  playerId: string,
  patch: BaselineEntryPatch,
) {
  const existing = await localDb.baselineEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === sessionLogId && entry.playerId === playerId && !entry.deletedAt)
    .first()
  const timestamp = nowIso()
  const entry: BaselineEntry = {
    id: existing?.id ?? createId(),
    userId,
    playerId,
    sessionLogId,
    broadJumpCm: normalizedNumber(patch.broadJumpCm, existing?.broadJumpCm ?? null, 'Broad Jump'),
    medBallChestPassM: normalizedNumber(
      patch.medBallChestPassM,
      existing?.medBallChestPassM ?? null,
      'Med-Ball Chest Pass',
    ),
    medBallWeightKg: normalizedNumber(patch.medBallWeightKg, existing?.medBallWeightKg ?? null, 'Med-Ball-Gewicht'),
    sprint30m: normalizedNumber(patch.sprint30m, existing?.sprint30m ?? null, '30 m'),
    note: patch.note !== undefined ? patch.note.trim() : (existing?.note ?? ''),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: existing?.deletedAt ?? null,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.baselineEntries.put(entry)
  await queueBaselineWrite(entry)

  return entry
}

export async function listLatestBaselineEntriesByPlayer(userId: string): Promise<Map<string, LatestBaselineEntry>> {
  const [sessionLogs, entries] = await Promise.all([
    localDb.sessionLogs.where('userId').equals(userId).toArray(),
    localDb.baselineEntries
      .where('userId')
      .equals(userId)
      .and((entry) => !entry.deletedAt)
      .toArray(),
  ])
  const dateBySessionLogId = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))
  const latestByPlayer = new Map<string, LatestBaselineEntry>()

  for (const entry of entries) {
    const sessionDate = dateBySessionLogId.get(entry.sessionLogId) ?? entry.createdAt.slice(0, 10)
    const candidate = { ...entry, sessionDate }
    const existing = latestByPlayer.get(entry.playerId)

    if (
      !existing ||
      candidate.sessionDate > existing.sessionDate ||
      (candidate.sessionDate === existing.sessionDate && candidate.clientUpdatedAt > existing.clientUpdatedAt)
    ) {
      latestByPlayer.set(entry.playerId, candidate)
    }
  }

  return latestByPlayer
}

export async function getBaselineSyncOverview(userId: string): Promise<PlayerSyncOverview> {
  const pendingCount = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'baseline_entries')
    .count()
  const erroredCount = await localDb.baselineEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.syncStatus === 'error')
    .count()
  const lastSuccessfulSyncAt = await getSyncMeta(`baselines:lastSuccessfulSyncAt:${userId}`)

  return {
    ...defaultPlayerSyncOverview,
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    status: erroredCount > 0 ? 'error' : pendingCount > 0 ? 'pending' : 'synced',
    pendingCount,
    lastSuccessfulSyncAt,
    errorMessage: erroredCount > 0 ? 'Mindestens ein Baseline-Eintrag konnte nicht synchronisiert werden.' : null,
  }
}

export async function syncPendingBaselineEntries(userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'baseline_entries')
    .toArray()

  for (const write of pendingWrites) {
    const entry = await localDb.baselineEntries.get(write.recordId)
    if (!entry) {
      await localDb.pendingWrites.delete(write.localId ?? 0)
      continue
    }

    const { error } = await supabase
      .from('baseline_entries')
      .upsert(rowFromBaselineEntry(entry))
      .select('id')
      .single()
    if (error) {
      await localDb.baselineEntries.put({ ...entry, syncStatus: 'error', syncError: error.message })
      throw new Error(error.message)
    }

    await localDb.baselineEntries.put({ ...entry, syncStatus: 'synced', syncError: null })
    await localDb.pendingWrites.delete(write.localId ?? 0)
  }
}

export async function refreshRemoteBaselineEntries(userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase
    .from('baseline_entries')
    .select(
      'id,user_id,player_id,session_log_id,broad_jump_cm,med_ball_chest_pass_m,med_ball_weight_kg,sprint_30m,note,created_at,updated_at,deleted_at,client_updated_at',
    )
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw new Error(error.message)
  }

  for (const row of (data ?? []) as BaselineEntryRow[]) {
    const localEntry = await localDb.baselineEntries.get(row.id)
    if (localEntry?.syncStatus === 'pending') {
      continue
    }

    if (!localEntry || row.client_updated_at >= localEntry.clientUpdatedAt) {
      await localDb.baselineEntries.put(baselineEntryFromRow(row))
    }
  }

  await setSyncMeta(`baselines:lastSuccessfulSyncAt:${userId}`, nowIso())
}
