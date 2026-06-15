import type { ReturnerCapSummary, ReturnerDecision, ReturnerEntry, ReturnerEntryPatch } from '../domain/returners'
import type { PlayerSyncOverview, SyncStatus } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import { getSyncMeta, localDb, setSyncMeta } from './localDb'
import { markSyncedIfUnchanged, markSyncErrorIfUnchanged } from './pendingWriteSync'
import { hasPlayerId } from './playerId'
import { supabase } from './supabaseClient'

export type ReturnerEntryRow = {
  id: string
  user_id: string
  player_id: string | null
  session_log_id: string
  medical_contact_note: string
  current_stage: string
  speed_cap: string
  cod_decel_cap: string
  conditioning_cap: string
  contact_cap: string
  allowed_today: string
  planned_caps: string
  completed: string
  symptoms_during: string
  next_morning: string
  decision: ReturnerDecision | null
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

function normalizeText(value: string | undefined, fallback: string) {
  return value !== undefined ? value.trim() : fallback
}

async function queueReturnerWrite(entry: ReturnerEntry) {
  await localDb.pendingWrites
    .where('userId')
    .equals(entry.userId)
    .and((write) => write.table === 'returner_entries' && write.recordId === entry.id)
    .delete()
  await localDb.pendingWrites.add({
    table: 'returner_entries',
    operation: 'upsert',
    recordId: entry.id,
    userId: entry.userId,
    createdAt: nowIso(),
  })
}

export function returnerEntryFromRow(
  row: ReturnerEntryRow,
  syncStatus: SyncStatus = 'synced',
  syncError: string | null = null,
): ReturnerEntry {
  return {
    id: row.id,
    userId: row.user_id,
    playerId: row.player_id,
    sessionLogId: row.session_log_id,
    medicalContactNote: row.medical_contact_note,
    currentStage: row.current_stage,
    speedCap: row.speed_cap,
    codDecelCap: row.cod_decel_cap,
    conditioningCap: row.conditioning_cap,
    contactCap: row.contact_cap,
    allowedToday: row.allowed_today,
    plannedCaps: row.planned_caps,
    completed: row.completed,
    symptomsDuring: row.symptoms_during,
    nextMorning: row.next_morning,
    decision: row.decision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus,
    syncError,
  }
}

export function rowFromReturnerEntry(entry: ReturnerEntry): ReturnerEntryRow {
  return {
    id: entry.id,
    user_id: entry.userId,
    player_id: entry.playerId,
    session_log_id: entry.sessionLogId,
    medical_contact_note: entry.medicalContactNote,
    current_stage: entry.currentStage,
    speed_cap: entry.speedCap,
    cod_decel_cap: entry.codDecelCap,
    conditioning_cap: entry.conditioningCap,
    contact_cap: entry.contactCap,
    allowed_today: entry.allowedToday,
    planned_caps: entry.plannedCaps,
    completed: entry.completed,
    symptoms_during: entry.symptomsDuring,
    next_morning: entry.nextMorning,
    decision: entry.decision,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    deleted_at: entry.deletedAt,
    client_updated_at: entry.clientUpdatedAt,
  }
}

export function buildEmptyReturnerEntry(userId: string, sessionLogId: string, playerId: string): ReturnerEntry {
  const timestamp = nowIso()

  return {
    id: createId(),
    userId,
    playerId,
    sessionLogId,
    medicalContactNote: '',
    currentStage: '',
    speedCap: '',
    codDecelCap: '',
    conditioningCap: '',
    contactCap: '',
    allowedToday: '',
    plannedCaps: '',
    completed: '',
    symptomsDuring: '',
    nextMorning: '',
    decision: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }
}

export async function listReturnerEntriesForPlayer(userId: string, playerId: string) {
  const sessionLogs = await localDb.sessionLogs.where('userId').equals(userId).toArray()
  const dateBySessionLogId = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))
  const entries = await localDb.returnerEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.playerId === playerId && !entry.deletedAt)
    .toArray()

  return entries.sort((a, b) => {
    const dateA = dateBySessionLogId.get(a.sessionLogId) ?? a.createdAt
    const dateB = dateBySessionLogId.get(b.sessionLogId) ?? b.createdAt

    return dateB.localeCompare(dateA)
  })
}

export async function listReturnerEntriesForSession(userId: string, sessionLogId: string) {
  return localDb.returnerEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === sessionLogId && !entry.deletedAt)
    .toArray()
}

export async function saveReturnerEntry(
  userId: string,
  sessionLogId: string,
  playerId: string,
  patch: ReturnerEntryPatch,
) {
  const existing = await localDb.returnerEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === sessionLogId && entry.playerId === playerId && !entry.deletedAt)
    .first()
  const timestamp = nowIso()
  const baseEntry = existing ?? buildEmptyReturnerEntry(userId, sessionLogId, playerId)
  const entry: ReturnerEntry = {
    ...baseEntry,
    medicalContactNote: normalizeText(patch.medicalContactNote, baseEntry.medicalContactNote),
    currentStage: normalizeText(patch.currentStage, baseEntry.currentStage),
    speedCap: normalizeText(patch.speedCap, baseEntry.speedCap),
    codDecelCap: normalizeText(patch.codDecelCap, baseEntry.codDecelCap),
    conditioningCap: normalizeText(patch.conditioningCap, baseEntry.conditioningCap),
    contactCap: normalizeText(patch.contactCap, baseEntry.contactCap),
    allowedToday: normalizeText(patch.allowedToday, baseEntry.allowedToday),
    plannedCaps: normalizeText(patch.plannedCaps, baseEntry.plannedCaps),
    completed: normalizeText(patch.completed, baseEntry.completed),
    symptomsDuring: normalizeText(patch.symptomsDuring, baseEntry.symptomsDuring),
    nextMorning: normalizeText(patch.nextMorning, baseEntry.nextMorning),
    decision: patch.decision !== undefined ? patch.decision : baseEntry.decision,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.returnerEntries.put(entry)
  await queueReturnerWrite(entry)

  return entry
}

export async function listLatestReturnerCaps(
  userId: string,
  currentSessionLogId: string | null,
  currentSessionDate: string,
): Promise<ReturnerCapSummary[]> {
  const sessionLogs = await localDb.sessionLogs.where('userId').equals(userId).toArray()
  const dateBySessionLogId = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))
  const eligibleSessionIds = new Set(
    sessionLogs
      .filter(
        (sessionLog) =>
          !sessionLog.deletedAt &&
          (sessionLog.id === currentSessionLogId || sessionLog.date < currentSessionDate),
      )
      .map((sessionLog) => sessionLog.id),
  )
  const entries = await localDb.returnerEntries
    .where('userId')
    .equals(userId)
    .and((entry) => eligibleSessionIds.has(entry.sessionLogId) && !entry.deletedAt)
    .toArray()
  const latestByPlayer = new Map<string, ReturnerCapSummary>()

  for (const entry of entries) {
    if (!hasPlayerId(entry)) {
      continue
    }

    const sessionDate = dateBySessionLogId.get(entry.sessionLogId) ?? entry.createdAt
    const existing = latestByPlayer.get(entry.playerId)

    if (!existing || sessionDate > existing.sessionDate) {
      latestByPlayer.set(entry.playerId, {
        playerId: entry.playerId,
        sessionLogId: entry.sessionLogId,
        sessionDate,
        currentStage: entry.currentStage,
        speedCap: entry.speedCap,
        codDecelCap: entry.codDecelCap,
        conditioningCap: entry.conditioningCap,
        contactCap: entry.contactCap,
        allowedToday: entry.allowedToday,
        plannedCaps: entry.plannedCaps,
        completed: entry.completed,
        symptomsDuring: entry.symptomsDuring,
        nextMorning: entry.nextMorning,
        decision: entry.decision,
      })
    }
  }

  return [...latestByPlayer.values()].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
}

export async function getReturnerSyncOverview(userId: string): Promise<PlayerSyncOverview> {
  const pendingCount = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'returner_entries')
    .count()
  const erroredCount = await localDb.returnerEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.syncStatus === 'error')
    .count()
  const lastSuccessfulSyncAt = await getSyncMeta(`returners:lastSuccessfulSyncAt:${userId}`)

  return {
    ...defaultPlayerSyncOverview,
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    status: erroredCount > 0 ? 'error' : pendingCount > 0 ? 'pending' : 'synced',
    pendingCount,
    lastSuccessfulSyncAt,
    errorMessage: erroredCount > 0 ? 'Mindestens ein Returner-Eintrag konnte nicht synchronisiert werden.' : null,
  }
}

export async function syncPendingReturnerEntries(userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'returner_entries')
    .toArray()

  const snapshots: Array<{ entry: ReturnerEntry; writeLocalId?: number }> = []
  for (const write of pendingWrites) {
    const entry = await localDb.returnerEntries.get(write.recordId)
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
    .from('returner_entries')
    .upsert(snapshots.map(({ entry }) => rowFromReturnerEntry(entry)))
    .select('id')
  if (error) {
    for (const { entry } of snapshots) {
      await markSyncErrorIfUnchanged(localDb.returnerEntries, entry, error.message)
    }
    throw new Error(error.message)
  }

  await Promise.all(
    snapshots.map(({ entry, writeLocalId }) => markSyncedIfUnchanged(localDb.returnerEntries, entry, writeLocalId)),
  )
}

export async function refreshRemoteReturnerEntries(userId: string) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase
    .from('returner_entries')
    .select(
      'id,user_id,player_id,session_log_id,medical_contact_note,current_stage,speed_cap,cod_decel_cap,conditioning_cap,contact_cap,allowed_today,planned_caps,completed,symptoms_during,next_morning,decision,created_at,updated_at,deleted_at,client_updated_at',
    )
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw new Error(error.message)
  }

  for (const row of (data ?? []) as ReturnerEntryRow[]) {
    const localEntry = await localDb.returnerEntries.get(row.id)
    if (localEntry?.syncStatus === 'pending') {
      continue
    }

    if (!localEntry || row.client_updated_at >= localEntry.clientUpdatedAt) {
      await localDb.returnerEntries.put(returnerEntryFromRow(row))
    }
  }

  await setSyncMeta(`returners:lastSuccessfulSyncAt:${userId}`, nowIso())
}
