import {
  applyManualTrafficLight,
  applySuggestedTrafficLight,
  deriveLimits,
  emptyCheckInDraft,
  type CheckInDraft,
  type CheckInEntryPatch,
  type CheckInLimit,
  type PlayerSessionEntry,
  type PostSessionEntryPatch,
  type PlayerWarning,
  type ReturnerFlag,
  type SessionLog,
  type TrainingVariant,
  type TrafficLight,
} from '../domain/checkIn'
import { calculateSessionLoad, type E2Decision, type NextStep } from '../domain/postSession'
import type { Player } from '../domain/players'
import type { PlayerSyncOverview, SyncStatus } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import type { SessionDefinition } from '../content/types'
import { refreshRemoteBaselineEntries, syncPendingBaselineEntries } from './baselineRepository'
import { getSyncMeta, localDb, setSyncMeta } from './localDb'
import { syncPlayers } from './playerRepository'
import { refreshRemoteProgressEntries, syncPendingProgressEntries } from './postSessionRepository'
import { refreshRemoteReturnerEntries, syncPendingReturnerEntries } from './returnerRepository'
import { supabase } from './supabaseClient'

type SessionLogRow = {
  id: string
  user_id: string
  session_definition_id: string
  date: string
  status: 'planned' | 'in_progress' | 'completed'
  coach: string
  group_size: number | null
  weather_or_heat_note: string
  plan_changed: boolean
  duration_minutes: number | null
  contact_index: string
  speed_exposure_note: string
  coach_review: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

export type PlayerSessionEntryRow = {
  id: string
  user_id: string
  session_log_id: string
  player_id: string
  present: boolean
  readiness: number | null
  life_flag: string
  pain_score: number | null
  pain_location: string
  returner_flag: ReturnerFlag
  traffic_light: TrafficLight | null
  traffic_light_suggestion: TrafficLight | null
  traffic_light_was_manual: boolean
  training_variant: TrainingVariant | null
  limits: CheckInLimit[]
  observation: string
  session_rpe: number | null
  duration_minutes: number | null
  session_load: number | null
  post_pain_score: number | null
  post_pain_location: string
  e2_decision: E2Decision | null
  next_step: NextStep | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  client_updated_at: string
}

type PlayerSessionEntryUpsertRow = Omit<PlayerSessionEntryRow, 'session_load'>

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const pendingSessionLogEnsures = new Map<string, Promise<SessionLog>>()

function sessionLogEnsureKey(userId: string, sessionDefinitionId: string) {
  return `${userId}:${sessionDefinitionId}`
}

function sessionLogFromRow(row: SessionLogRow, syncStatus: SyncStatus = 'synced'): SessionLog {
  return {
    id: row.id,
    userId: row.user_id,
    sessionDefinitionId: row.session_definition_id,
    date: row.date,
    status: row.status,
    coach: row.coach,
    groupSize: row.group_size,
    weatherOrHeatNote: row.weather_or_heat_note,
    planChanged: row.plan_changed,
    durationMinutes: row.duration_minutes,
    contactIndex: row.contact_index,
    speedExposureNote: row.speed_exposure_note,
    coachReview: row.coach_review,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus,
    syncError: null,
  }
}

function rowFromSessionLog(sessionLog: SessionLog): SessionLogRow {
  return {
    id: sessionLog.id,
    user_id: sessionLog.userId,
    session_definition_id: sessionLog.sessionDefinitionId,
    date: sessionLog.date,
    status: sessionLog.status,
    coach: sessionLog.coach,
    group_size: sessionLog.groupSize,
    weather_or_heat_note: sessionLog.weatherOrHeatNote,
    plan_changed: sessionLog.planChanged,
    duration_minutes: sessionLog.durationMinutes,
    contact_index: sessionLog.contactIndex,
    speed_exposure_note: sessionLog.speedExposureNote,
    coach_review: sessionLog.coachReview,
    created_at: sessionLog.createdAt,
    updated_at: sessionLog.updatedAt,
    deleted_at: sessionLog.deletedAt,
    client_updated_at: sessionLog.clientUpdatedAt,
  }
}

export function entryFromRow(row: PlayerSessionEntryRow, syncStatus: SyncStatus = 'synced'): PlayerSessionEntry {
  const draft: CheckInDraft = {
    ...emptyCheckInDraft,
    present: row.present,
    readiness: row.readiness,
    lifeFlag: row.life_flag,
    painScore: row.pain_score,
    painLocation: row.pain_location,
    returnerFlag: row.returner_flag,
    trafficLight: row.traffic_light,
    trafficLightSuggestion: row.traffic_light_suggestion,
    trafficLightWasManual: row.traffic_light_was_manual,
    trainingVariant: row.training_variant,
    limits: row.limits,
    observation: row.observation,
  }
  const withSuggestion = row.traffic_light_suggestion
    ? {
        ...draft,
        trafficLightSuggestion: row.traffic_light_suggestion,
        trafficLight: row.traffic_light,
      }
    : applySuggestedTrafficLight(draft)

  return {
    ...withSuggestion,
    trafficLight: row.traffic_light ?? withSuggestion.trafficLightSuggestion,
    trafficLightWasManual: row.traffic_light_was_manual,
    id: row.id,
    userId: row.user_id,
    sessionLogId: row.session_log_id,
    playerId: row.player_id,
    sessionRpe: row.session_rpe,
    durationMinutes: row.duration_minutes,
    sessionLoad: row.session_load ?? calculateSessionLoad(row.session_rpe, row.duration_minutes),
    postPainScore: row.post_pain_score,
    postPainLocation: row.post_pain_location,
    e2Decision: row.e2_decision,
    nextStep: row.next_step,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    clientUpdatedAt: row.client_updated_at,
    syncStatus,
    syncError: null,
  }
}

export function rowFromEntry(entry: PlayerSessionEntry): PlayerSessionEntryUpsertRow {
  return {
    id: entry.id,
    user_id: entry.userId,
    session_log_id: entry.sessionLogId,
    player_id: entry.playerId,
    present: entry.present,
    readiness: entry.readiness,
    life_flag: entry.lifeFlag,
    pain_score: entry.painScore,
    pain_location: entry.painLocation,
    returner_flag: entry.returnerFlag,
    traffic_light: entry.trafficLight,
    traffic_light_suggestion: entry.trafficLightSuggestion,
    traffic_light_was_manual: entry.trafficLightWasManual,
    training_variant: entry.trainingVariant,
    limits: entry.limits,
    observation: entry.observation,
    session_rpe: entry.sessionRpe,
    duration_minutes: entry.durationMinutes,
    post_pain_score: entry.postPainScore,
    post_pain_location: entry.postPainLocation,
    e2_decision: entry.e2Decision,
    next_step: entry.nextStep,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    deleted_at: entry.deletedAt,
    client_updated_at: entry.clientUpdatedAt,
  }
}

async function queueWrite(table: 'session_logs' | 'player_session_entries', recordId: string, userId: string) {
  await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === table && write.recordId === recordId)
    .delete()
  await localDb.pendingWrites.add({
    table,
    operation: 'upsert',
    recordId,
    userId,
    createdAt: nowIso(),
  })
}

export async function findSessionLog(userId: string, sessionDefinitionId: string) {
  return (
    (await localDb.sessionLogs
      .where('userId')
      .equals(userId)
      .and((sessionLog) => sessionLog.sessionDefinitionId === sessionDefinitionId && !sessionLog.deletedAt)
      .first()) ?? null
  )
}

async function ensureSessionLogOnce(userId: string, sessionDefinition: SessionDefinition) {
  const existing = await findSessionLog(userId, sessionDefinition.id)

  if (existing) {
    return existing
  }

  const timestamp = nowIso()
  const sessionLog: SessionLog = {
    id: createId(),
    userId,
    sessionDefinitionId: sessionDefinition.id,
    date: sessionDefinition.date,
    status: 'planned',
    coach: '',
    groupSize: null,
    weatherOrHeatNote: '',
    planChanged: false,
    durationMinutes: null,
    contactIndex: '',
    speedExposureNote: '',
    coachReview: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.sessionLogs.put(sessionLog)
  await queueWrite('session_logs', sessionLog.id, userId)

  return sessionLog
}

export async function ensureSessionLog(userId: string, sessionDefinition: SessionDefinition) {
  const key = sessionLogEnsureKey(userId, sessionDefinition.id)
  const pendingSessionLog = pendingSessionLogEnsures.get(key)

  if (pendingSessionLog) {
    return pendingSessionLog
  }

  const sessionLogPromise = ensureSessionLogOnce(userId, sessionDefinition).finally(() => {
    pendingSessionLogEnsures.delete(key)
  })
  pendingSessionLogEnsures.set(key, sessionLogPromise)

  return sessionLogPromise
}

export type SessionLogPatch = Partial<
  Pick<
    SessionLog,
    | 'status'
    | 'contactIndex'
    | 'speedExposureNote'
    | 'planChanged'
    | 'durationMinutes'
    | 'coachReview'
    | 'groupSize'
    | 'weatherOrHeatNote'
  >
>

export async function saveSessionLogPatch(
  userId: string,
  sessionDefinition: SessionDefinition,
  patch: SessionLogPatch,
) {
  const existing = await findSessionLog(userId, sessionDefinition.id)
  const baseSessionLog = existing ?? (await ensureSessionLog(userId, sessionDefinition))
  const timestamp = nowIso()
  const sessionLog: SessionLog = {
    ...baseSessionLog,
    ...patch,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.sessionLogs.put(sessionLog)
  await queueWrite('session_logs', sessionLog.id, userId)

  if (patch.durationMinutes !== undefined) {
    const entriesWithSessionRpe = await localDb.playerSessionEntries
      .where('userId')
      .equals(userId)
      .and((entry) => entry.sessionLogId === sessionLog.id && entry.sessionRpe !== null && !entry.deletedAt)
      .toArray()

    for (const entry of entriesWithSessionRpe) {
      const updatedEntry: PlayerSessionEntry = {
        ...entry,
        durationMinutes: patch.durationMinutes,
        sessionLoad: calculateSessionLoad(entry.sessionRpe, patch.durationMinutes),
        updatedAt: timestamp,
        clientUpdatedAt: timestamp,
        syncStatus: 'pending',
        syncError: null,
      }

      await localDb.playerSessionEntries.put(updatedEntry)
      await queueWrite('player_session_entries', updatedEntry.id, userId)
    }
  }

  return sessionLog
}

export async function listExpectedPlayerIds(userId: string, currentSessionDate: string) {
  const previousSessions = await localDb.sessionLogs
    .where('userId')
    .equals(userId)
    .and((sessionLog) => !sessionLog.deletedAt && sessionLog.date < currentSessionDate)
    .toArray()

  const latestPreviousSession = previousSessions.sort((a, b) => b.date.localeCompare(a.date))[0]

  if (!latestPreviousSession) {
    return []
  }

  const entries = await localDb.playerSessionEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === latestPreviousSession.id && entry.present && !entry.deletedAt)
    .toArray()

  return entries.map((entry) => entry.playerId)
}

export async function listCheckInEntries(userId: string, sessionLogId: string) {
  const entries = await localDb.playerSessionEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === sessionLogId && !entry.deletedAt)
    .toArray()

  return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function listLatestWarnings(userId: string, currentSessionLogId: string | null, currentSessionDate: string) {
  const sessionLogs = await localDb.sessionLogs.where('userId').equals(userId).toArray()
  const dateBySessionLogId = new Map(sessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))
  const previousSessionIds = new Set(
    sessionLogs
      .filter((sessionLog) => !sessionLog.deletedAt && sessionLog.date < currentSessionDate)
      .map((sessionLog) => sessionLog.id),
  )
  const entries = await localDb.playerSessionEntries
    .where('userId')
    .equals(userId)
    .and(
      (entry) =>
        (!currentSessionLogId || entry.sessionLogId !== currentSessionLogId) &&
        previousSessionIds.has(entry.sessionLogId) &&
        !entry.deletedAt,
    )
    .toArray()
  const latestByPlayer = new Map<string, PlayerWarning>()

  for (const entry of entries) {
    const hasWarning =
      entry.trafficLight === 'yellow' ||
      entry.trafficLight === 'red' ||
      entry.returnerFlag !== 'nein' ||
      entry.limits.length > 0 ||
      (entry.e2Decision !== null && entry.e2Decision !== 'normal') ||
      entry.nextStep === 'reduzieren' ||
      entry.nextStep === 'klaeren' ||
      (entry.postPainScore !== null && entry.postPainScore >= 3)
    if (!hasWarning) {
      continue
    }

    const sessionDate = dateBySessionLogId.get(entry.sessionLogId) ?? entry.createdAt
    const existing = latestByPlayer.get(entry.playerId)
    if (!existing || sessionDate > existing.sessionDate) {
      latestByPlayer.set(entry.playerId, {
        playerId: entry.playerId,
        trafficLight: entry.trafficLight,
        returnerFlag: entry.returnerFlag,
        limits: entry.limits,
        observation: entry.observation,
        e2Decision: entry.e2Decision,
        nextStep: entry.nextStep,
        postPainScore: entry.postPainScore,
        postPainLocation: entry.postPainLocation,
        sessionLoad: entry.sessionLoad,
        sessionDate,
      })
    }
  }

  return [...latestByPlayer.values()]
}

export function buildEmptyEntry(userId: string, sessionLogId: string, player: Player): PlayerSessionEntry {
  const timestamp = nowIso()
  const draft = applySuggestedTrafficLight({
    ...emptyCheckInDraft,
    returnerFlag: player.returnerStatus,
  })

  return {
    ...draft,
    id: createId(),
    userId,
    sessionLogId,
    playerId: player.id,
    sessionRpe: null,
    durationMinutes: null,
    sessionLoad: null,
    postPainScore: null,
    postPainLocation: '',
    e2Decision: null,
    nextStep: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }
}

export async function savePostSessionEntry(
  userId: string,
  sessionLogId: string,
  player: Player,
  patch: PostSessionEntryPatch,
) {
  const existing = await localDb.playerSessionEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === sessionLogId && entry.playerId === player.id && !entry.deletedAt)
    .first()
  const timestamp = nowIso()
  const baseEntry = existing ?? buildEmptyEntry(userId, sessionLogId, player)
  const sessionRpe = patch.sessionRpe !== undefined ? patch.sessionRpe : baseEntry.sessionRpe
  const durationMinutes = patch.durationMinutes !== undefined ? patch.durationMinutes : baseEntry.durationMinutes
  const entry: PlayerSessionEntry = {
    ...baseEntry,
    ...patch,
    sessionRpe,
    durationMinutes,
    sessionLoad: calculateSessionLoad(sessionRpe, durationMinutes),
    postPainLocation:
      patch.postPainLocation !== undefined ? patch.postPainLocation.trim() : baseEntry.postPainLocation,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.playerSessionEntries.put(entry)
  await queueWrite('player_session_entries', entry.id, userId)

  return entry
}

export async function saveCheckInEntry(
  userId: string,
  sessionLogId: string,
  player: Player,
  patch: CheckInEntryPatch,
  manualTrafficLight?: TrafficLight,
) {
  const existing = await localDb.playerSessionEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === sessionLogId && entry.playerId === player.id && !entry.deletedAt)
    .first()
  const timestamp = nowIso()
  const baseEntry = existing ?? buildEmptyEntry(userId, sessionLogId, player)
  const patchedDraft: CheckInDraft = {
    ...baseEntry,
    ...patch,
    lifeFlag: patch.lifeFlag !== undefined ? patch.lifeFlag.trim() : baseEntry.lifeFlag,
    painLocation: patch.painLocation !== undefined ? patch.painLocation.trim() : baseEntry.painLocation,
    observation: patch.observation !== undefined ? patch.observation.trim() : baseEntry.observation,
  }
  const suggestedDraft = applySuggestedTrafficLight({
    ...patchedDraft,
    limits: deriveLimits(patchedDraft),
  })
  const finalDraft = manualTrafficLight ? applyManualTrafficLight(suggestedDraft, manualTrafficLight) : suggestedDraft
  const entry: PlayerSessionEntry = {
    ...baseEntry,
    ...finalDraft,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.playerSessionEntries.put(entry)
  await queueWrite('player_session_entries', entry.id, userId)

  return entry
}

export async function getCheckInSyncOverview(userId: string): Promise<PlayerSyncOverview> {
  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and(
      (write) =>
        write.table === 'session_logs' ||
        write.table === 'player_session_entries' ||
        write.table === 'progress_entries',
    )
    .count()
  const erroredSessionLogs = await localDb.sessionLogs
    .where('userId')
    .equals(userId)
    .and((sessionLog) => sessionLog.syncStatus === 'error')
    .count()
  const erroredEntries = await localDb.playerSessionEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.syncStatus === 'error')
    .count()
  const erroredProgressEntries = await localDb.progressEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.syncStatus === 'error')
    .count()
  const lastSuccessfulSyncAt = await getSyncMeta(`checkIns:lastSuccessfulSyncAt:${userId}`)
  const hasErrors = erroredSessionLogs + erroredEntries + erroredProgressEntries > 0

  return {
    ...defaultPlayerSyncOverview,
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    status: hasErrors ? 'error' : pendingWrites > 0 ? 'pending' : 'synced',
    pendingCount: pendingWrites,
    lastSuccessfulSyncAt,
    errorMessage: hasErrors ? 'Mindestens ein Check-in oder eine Nachbereitung konnte nicht synchronisiert werden.' : null,
  }
}

async function syncPendingSessionLogs(userId: string) {
  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'session_logs')
    .toArray()

  for (const write of pendingWrites) {
    const sessionLog = await localDb.sessionLogs.get(write.recordId)
    if (!sessionLog) {
      await localDb.pendingWrites.delete(write.localId ?? 0)
      continue
    }

    const { error } = await supabase!.from('session_logs').upsert(rowFromSessionLog(sessionLog)).select('id').single()
    if (error) {
      await localDb.sessionLogs.put({ ...sessionLog, syncStatus: 'error', syncError: error.message })
      throw new Error(error.message)
    }

    await localDb.sessionLogs.put({ ...sessionLog, syncStatus: 'synced', syncError: null })
    await localDb.pendingWrites.delete(write.localId ?? 0)
  }
}

async function syncPendingPlayerSessionEntries(userId: string) {
  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'player_session_entries')
    .toArray()

  for (const write of pendingWrites) {
    const entry = await localDb.playerSessionEntries.get(write.recordId)
    if (!entry) {
      await localDb.pendingWrites.delete(write.localId ?? 0)
      continue
    }

    const { error } = await supabase!
      .from('player_session_entries')
      .upsert(rowFromEntry(entry))
      .select('id')
      .single()
    if (error) {
      await localDb.playerSessionEntries.put({ ...entry, syncStatus: 'error', syncError: error.message })
      throw new Error(error.message)
    }

    await localDb.playerSessionEntries.put({ ...entry, syncStatus: 'synced', syncError: null })
    await localDb.pendingWrites.delete(write.localId ?? 0)
  }
}

async function refreshRemoteCheckIns(userId: string) {
  const { data: sessionRows, error: sessionError } = await supabase!
    .from('session_logs')
    .select(
      'id,user_id,session_definition_id,date,status,coach,group_size,weather_or_heat_note,plan_changed,duration_minutes,contact_index,speed_exposure_note,coach_review,created_at,updated_at,deleted_at,client_updated_at',
    )
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (sessionError) {
    throw new Error(sessionError.message)
  }

  for (const row of (sessionRows ?? []) as SessionLogRow[]) {
    const localSessionLog = await localDb.sessionLogs.get(row.id)
    if (localSessionLog?.syncStatus === 'pending') {
      continue
    }

    if (!localSessionLog || row.client_updated_at >= localSessionLog.clientUpdatedAt) {
      await localDb.sessionLogs.put(sessionLogFromRow(row))
    }
  }

  const { data: entryRows, error: entryError } = await supabase!
    .from('player_session_entries')
    .select(
      'id,user_id,session_log_id,player_id,present,readiness,life_flag,pain_score,pain_location,returner_flag,traffic_light,traffic_light_suggestion,traffic_light_was_manual,training_variant,limits,observation,session_rpe,duration_minutes,session_load,post_pain_score,post_pain_location,e2_decision,next_step,created_at,updated_at,deleted_at,client_updated_at',
    )
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (entryError) {
    throw new Error(entryError.message)
  }

  for (const row of (entryRows ?? []) as PlayerSessionEntryRow[]) {
    const localEntry = await localDb.playerSessionEntries.get(row.id)
    if (localEntry?.syncStatus === 'pending') {
      continue
    }

    if (!localEntry || row.client_updated_at >= localEntry.clientUpdatedAt) {
      await localDb.playerSessionEntries.put(entryFromRow(row))
    }
  }
}

export async function syncCheckIns(userId: string): Promise<PlayerSyncOverview> {
  if (!supabase) {
    return {
      ...(await getCheckInSyncOverview(userId)),
      status: 'error',
      errorMessage: 'Supabase ist noch nicht konfiguriert.',
    }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ...(await getCheckInSyncOverview(userId)),
      isOnline: false,
    }
  }

  try {
    await syncPlayers(userId)
    await syncPendingSessionLogs(userId)
    await syncPendingPlayerSessionEntries(userId)
    await syncPendingProgressEntries(userId)
    await syncPendingBaselineEntries(userId)
    await syncPendingReturnerEntries(userId)
    await refreshRemoteCheckIns(userId)
    await refreshRemoteProgressEntries(userId)
    await refreshRemoteBaselineEntries(userId)
    await refreshRemoteReturnerEntries(userId)

    const timestamp = nowIso()
    await setSyncMeta(`checkIns:lastSuccessfulSyncAt:${userId}`, timestamp)

    return {
      ...(await getCheckInSyncOverview(userId)),
      status: 'synced',
      pendingCount: 0,
      lastSuccessfulSyncAt: timestamp,
      errorMessage: null,
    }
  } catch (caughtError) {
    return {
      ...(await getCheckInSyncOverview(userId)),
      status: 'error',
      errorMessage: caughtError instanceof Error ? caughtError.message : 'Check-in-Sync fehlgeschlagen.',
    }
  }
}
