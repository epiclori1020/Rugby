import type { ProgressEntry } from '../domain/postSession'
import type { SyncStatus } from '../domain/sync'
import { localDb } from './localDb'
import { supabase } from './supabaseClient'

export type ProgressEntryRow = {
  id: string
  user_id: string
  player_id: string
  session_log_id: string
  main_exercise: string
  load: string
  reps: string
  rpe: string
  power_or_sprint: string
  conditioning: string
  note: string
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

async function queueProgressWrite(entry: ProgressEntry) {
  await localDb.pendingWrites
    .where('userId')
    .equals(entry.userId)
    .and((write) => write.table === 'progress_entries' && write.recordId === entry.id)
    .delete()
  await localDb.pendingWrites.add({
    table: 'progress_entries',
    operation: 'upsert',
    recordId: entry.id,
    userId: entry.userId,
    createdAt: nowIso(),
  })
}

export function progressEntryFromRow(
  row: ProgressEntryRow,
  syncStatus: SyncStatus = 'synced',
  syncError: string | null = null,
): ProgressEntry {
  return {
    id: row.id,
    userId: row.user_id,
    playerId: row.player_id,
    sessionLogId: row.session_log_id,
    mainExercise: row.main_exercise,
    load: row.load,
    reps: row.reps,
    rpe: row.rpe,
    powerOrSprint: row.power_or_sprint,
    conditioning: row.conditioning,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus,
    syncError,
  }
}

export function rowFromProgressEntry(entry: ProgressEntry): ProgressEntryRow {
  return {
    id: entry.id,
    user_id: entry.userId,
    player_id: entry.playerId,
    session_log_id: entry.sessionLogId,
    main_exercise: entry.mainExercise,
    load: entry.load,
    reps: entry.reps,
    rpe: entry.rpe,
    power_or_sprint: entry.powerOrSprint,
    conditioning: entry.conditioning,
    note: entry.note,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    deleted_at: entry.deletedAt,
    client_updated_at: entry.clientUpdatedAt,
  }
}

export type ProgressEntryPatch = Partial<
  Pick<ProgressEntry, 'mainExercise' | 'load' | 'reps' | 'rpe' | 'powerOrSprint' | 'conditioning' | 'note'>
>

export async function listProgressEntriesForSession(userId: string, sessionLogId: string): Promise<ProgressEntry[]> {
  const entries = await localDb.progressEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === sessionLogId && !entry.deletedAt)
    .toArray()

  return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function saveProgressEntry(
  userId: string,
  sessionLogId: string,
  playerId: string,
  patch: ProgressEntryPatch,
): Promise<ProgressEntry> {
  const existing = await localDb.progressEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === sessionLogId && entry.playerId === playerId && !entry.deletedAt)
    .first()
  const timestamp = nowIso()
  const entry: ProgressEntry = {
    id: existing?.id ?? createId(),
    userId,
    playerId,
    sessionLogId,
    mainExercise: patch.mainExercise !== undefined ? patch.mainExercise.trim() : (existing?.mainExercise ?? ''),
    load: patch.load !== undefined ? patch.load.trim() : (existing?.load ?? ''),
    reps: patch.reps !== undefined ? patch.reps.trim() : (existing?.reps ?? ''),
    rpe: patch.rpe !== undefined ? patch.rpe.trim() : (existing?.rpe ?? ''),
    powerOrSprint: patch.powerOrSprint !== undefined ? patch.powerOrSprint.trim() : (existing?.powerOrSprint ?? ''),
    conditioning: patch.conditioning !== undefined ? patch.conditioning.trim() : (existing?.conditioning ?? ''),
    note: patch.note !== undefined ? patch.note.trim() : (existing?.note ?? ''),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: existing?.deletedAt ?? null,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.progressEntries.put(entry)
  await queueProgressWrite(entry)

  return entry
}

export async function syncPendingProgressEntries(userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'progress_entries')
    .toArray()

  for (const write of pendingWrites) {
    const entry = await localDb.progressEntries.get(write.recordId)
    if (!entry) {
      await localDb.pendingWrites.delete(write.localId ?? 0)
      continue
    }

    const { error } = await supabase
      .from('progress_entries')
      .upsert(rowFromProgressEntry(entry))
      .select('id')
      .single()
    if (error) {
      await localDb.progressEntries.put({ ...entry, syncStatus: 'error', syncError: error.message })
      throw new Error(error.message)
    }

    await localDb.progressEntries.put({ ...entry, syncStatus: 'synced', syncError: null })
    await localDb.pendingWrites.delete(write.localId ?? 0)
  }
}

export async function refreshRemoteProgressEntries(userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase
    .from('progress_entries')
    .select(
      'id,user_id,player_id,session_log_id,main_exercise,load,reps,rpe,power_or_sprint,conditioning,note,created_at,updated_at,deleted_at,client_updated_at',
    )
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw new Error(error.message)
  }

  for (const row of (data ?? []) as ProgressEntryRow[]) {
    const localEntry = await localDb.progressEntries.get(row.id)
    if (localEntry?.syncStatus === 'pending') {
      continue
    }

    if (!localEntry || row.client_updated_at >= localEntry.clientUpdatedAt) {
      await localDb.progressEntries.put(progressEntryFromRow(row))
    }
  }
}
