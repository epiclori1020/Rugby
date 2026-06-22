import {
  applyAutoTrafficLight,
  applyManualTrafficLight,
  applySuggestedTrafficLight,
  deriveAttendanceStatus,
  deriveLimits,
  emptyCheckInDraft,
  hasPostSessionData,
  mergeRedFlags,
  type CheckInDraft,
  type CheckInEntryPatch,
  type CheckInLimit,
  type CheckInSource,
  type PlayerSessionEntry,
  type PlayerObservation,
  type PostSessionEntryPatch,
  type PlayerWarning,
  type RedFlag,
  type ReturnerFlag,
  type SessionReaction,
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
import { getExerciseSyncOverview, refreshRemoteExerciseResults, syncPendingExerciseResults } from './exerciseRepository'
import { getExposureSyncOverview, refreshRemoteExposureSummaries, syncPendingExposureSummaries } from './exposureRepository'
import { getMetricSyncOverview, refreshRemoteMetricResults, syncPendingMetricResults } from './metricRepository'
import { getSyncMeta, localDb, setSyncMeta } from './localDb'
import { refreshRemoteProgressEntries, syncPendingProgressEntries } from './postSessionRepository'
import { markSyncedIfUnchanged, markSyncErrorIfUnchanged } from './pendingWriteSync'
import { hasPlayerId } from './playerId'
import { measureInteraction } from './performanceTrace'
import { refreshRemoteReturnerEntries, syncPendingReturnerEntries } from './returnerRepository'
import { getSessionBlockSyncOverview, refreshRemoteSessionBlockLogs, syncPendingSessionBlockLogs } from './sessionBlockRepository'
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
  player_id: string | null
  present: boolean
  readiness: number | null
  life_flag: string
  pain_score: number | null
  pain_location: string
  returner_flag: ReturnerFlag
  session_reaction?: SessionReaction
  red_flag: RedFlag
  movement_concern: boolean
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
  checkin_source?: CheckInSource
  player_submitted_at?: string | null
  coach_edited_at?: string | null
  player_note?: string
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
const pendingCheckInEntrySaves = new Map<string, Promise<PlayerSessionEntry>>()
const pendingCheckInSyncs = new Map<string, Promise<PlayerSyncOverview>>()
const rerunRequestedCheckInSyncs = new Set<string>()

function sessionLogEnsureKey(userId: string, sessionDefinitionId: string) {
  return `${userId}:${sessionDefinitionId}`
}

function checkInEntrySaveKey(userId: string, sessionLogId: string, playerId: string) {
  return `${userId}:${sessionLogId}:${playerId}`
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
    sessionReaction: row.session_reaction ?? 'none',
    redFlag: row.red_flag,
    movementConcern: row.movement_concern,
    trafficLight: row.traffic_light,
    trafficLightSuggestion: row.traffic_light_suggestion,
    trafficLightWasManual: row.traffic_light_was_manual,
    trainingVariant: row.training_variant,
    limits: row.limits,
    observation: row.observation,
    playerNote: row.player_note ?? '',
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
    checkInSource: row.checkin_source ?? 'coach',
    playerSubmittedAt: row.player_submitted_at ?? null,
    coachEditedAt: row.coach_edited_at ?? null,
    playerNote: row.player_note ?? '',
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
    session_reaction: entry.sessionReaction,
    red_flag: entry.redFlag,
    movement_concern: entry.movementConcern,
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
    checkin_source: entry.checkInSource ?? 'coach',
    player_submitted_at: entry.playerSubmittedAt ?? null,
    coach_edited_at: entry.coachEditedAt ?? null,
    player_note: entry.playerNote ?? '',
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

export async function countLocalSessionLogs(userId: string) {
  return localDb.sessionLogs.where('userId').equals(userId).count()
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

  return entries.filter(hasPlayerId).map((entry) => entry.playerId)
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
    if (!hasPlayerId(entry)) {
      continue
    }

    if (!hasSafetySignal(entry)) {
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

export async function listLatestObservations(
  userId: string,
  currentSessionLogId: string | null,
  currentSessionDate: string,
) {
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
  const latestByPlayer = new Map<string, PlayerObservation>()

  for (const entry of entries) {
    if (!hasPlayerId(entry) || entry.observation.trim().length === 0 || hasSafetySignal(entry)) {
      continue
    }

    const sessionDate = dateBySessionLogId.get(entry.sessionLogId) ?? entry.createdAt
    const existing = latestByPlayer.get(entry.playerId)
    if (!existing || sessionDate > existing.sessionDate) {
      latestByPlayer.set(entry.playerId, {
        playerId: entry.playerId,
        observation: entry.observation,
        sessionDate,
      })
    }
  }

  return [...latestByPlayer.values()]
}

function hasSafetySignal(entry: PlayerSessionEntry) {
  return (
    entry.trafficLight === 'yellow' ||
    entry.trafficLight === 'red' ||
    entry.returnerFlag !== 'nein' ||
    entry.limits.length > 0 ||
    (entry.e2Decision !== null && entry.e2Decision !== 'normal') ||
    entry.nextStep === 'reduzieren' ||
    entry.nextStep === 'klaeren' ||
    (entry.postPainScore !== null && entry.postPainScore >= 3)
  )
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
    checkInSource: 'coach',
    playerSubmittedAt: null,
    coachEditedAt: null,
    playerNote: '',
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

async function saveCheckInEntryOnce(
  userId: string,
  sessionLogId: string,
  player: Player,
  patch: CheckInEntryPatch,
  manualTrafficLight?: TrafficLight | 'auto',
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
    playerNote: patch.playerNote !== undefined ? patch.playerNote.trim() : baseEntry.playerNote,
  }
  const draftWithLimits = {
    ...patchedDraft,
    limits: deriveLimits(patchedDraft),
  }
  const suggestedDraft = applySuggestedTrafficLight(draftWithLimits)
  const finalDraft =
    manualTrafficLight === 'auto'
      ? applyAutoTrafficLight(draftWithLimits)
      : manualTrafficLight
      ? applyManualTrafficLight(suggestedDraft, manualTrafficLight)
      : suggestedDraft
  const marksCoachEdited = shouldMarkCoachEdited(patch, manualTrafficLight)
  const shouldPreserveExplicitAbsence =
    patch.present === undefined && marksCoachEdited && deriveAttendanceStatus(baseEntry) === 'absent'
  const entry: PlayerSessionEntry = {
    ...baseEntry,
    ...finalDraft,
    present: patch.present !== undefined ? patch.present : marksCoachEdited ? !shouldPreserveExplicitAbsence : finalDraft.present,
    checkInSource: marksCoachEdited
      ? baseEntry.checkInSource === 'player_link' || baseEntry.checkInSource === 'player_kiosk' ? 'mixed' : 'coach'
      : baseEntry.checkInSource ?? 'coach',
    coachEditedAt: marksCoachEdited ? timestamp : baseEntry.coachEditedAt,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.playerSessionEntries.put(entry)
  await queueWrite('player_session_entries', entry.id, userId)

  return entry
}

function shouldMarkCoachEdited(patch: CheckInEntryPatch, manualTrafficLight?: TrafficLight | 'auto') {
  return (
    manualTrafficLight !== undefined ||
    patch.present !== undefined ||
    patch.readiness !== undefined ||
    patch.lifeFlag !== undefined ||
    patch.painScore !== undefined ||
    patch.painLocation !== undefined ||
    patch.returnerFlag !== undefined ||
    patch.redFlag !== undefined ||
    patch.movementConcern !== undefined ||
    patch.sessionReaction !== undefined ||
    patch.trainingVariant !== undefined ||
    patch.limits !== undefined
  )
}

export async function saveCheckInEntry(
  userId: string,
  sessionLogId: string,
  player: Player,
  patch: CheckInEntryPatch,
  manualTrafficLight?: TrafficLight | 'auto',
) {
  const key = checkInEntrySaveKey(userId, sessionLogId, player.id)
  const previousSave = pendingCheckInEntrySaves.get(key) ?? Promise.resolve(null)
  const nextSave = previousSave
    .catch(() => null)
    .then(() => saveCheckInEntryOnce(userId, sessionLogId, player, patch, manualTrafficLight))

  pendingCheckInEntrySaves.set(key, nextSave)

  try {
    return await nextSave
  } finally {
    if (pendingCheckInEntrySaves.get(key) === nextSave) {
      pendingCheckInEntrySaves.delete(key)
    }
  }
}

export async function savePublicCheckInEntry(
  userId: string,
  sessionLogId: string,
  player: Player,
  patch: CheckInEntryPatch,
  submittedAt: string,
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
    redFlag: patch.redFlag !== undefined ? mergeRedFlags(baseEntry.redFlag, patch.redFlag) : baseEntry.redFlag,
    playerNote: patch.playerNote !== undefined ? patch.playerNote.trim() : baseEntry.playerNote,
  }
  const draftWithLimits = {
    ...patchedDraft,
    limits: deriveLimits(patchedDraft),
  }
  const suggestedDraft = applySuggestedTrafficLight(draftWithLimits)
  const entry: PlayerSessionEntry = {
    ...baseEntry,
    ...suggestedDraft,
    checkInSource: baseEntry.coachEditedAt ? 'mixed' : 'player_link',
    playerSubmittedAt: submittedAt,
    coachEditedAt: baseEntry.coachEditedAt,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.playerSessionEntries.put(entry)
  await queueWrite('player_session_entries', entry.id, userId)

  return entry
}

export async function saveKioskCheckInEntry(
  userId: string,
  sessionLogId: string,
  player: Player,
  patch: CheckInEntryPatch,
) {
  const timestamp = nowIso()
  const entry = await savePublicCheckInEntry(userId, sessionLogId, player, { ...patch, present: true }, timestamp)
  const kioskEntry: PlayerSessionEntry = {
    ...entry,
    checkInSource: entry.coachEditedAt ? 'mixed' : 'player_kiosk',
    coachEditedAt: entry.coachEditedAt,
    updatedAt: timestamp,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }

  await localDb.playerSessionEntries.put(kioskEntry)
  await queueWrite('player_session_entries', kioskEntry.id, userId)

  return kioskEntry
}

function resetCheckInFields(entry: PlayerSessionEntry): PlayerSessionEntry {
  return {
    ...entry,
    ...emptyCheckInDraft,
    sessionRpe: entry.sessionRpe,
    durationMinutes: entry.durationMinutes,
    sessionLoad: entry.sessionLoad,
    postPainScore: entry.postPainScore,
    postPainLocation: entry.postPainLocation,
    e2Decision: entry.e2Decision,
    nextStep: entry.nextStep,
    checkInSource: undefined,
    playerSubmittedAt: null,
    coachEditedAt: null,
    playerNote: '',
  }
}

export function resetCoachFields(entry: PlayerSessionEntry): PlayerSessionEntry {
  const resetDraft = applySuggestedTrafficLight({
    ...entry,
    redFlag: 'none',
    movementConcern: false,
    trafficLight: null,
    trafficLightSuggestion: null,
    trafficLightWasManual: false,
    trainingVariant: null,
    limits: [],
    observation: '',
  })

  return {
    ...entry,
    ...resetDraft,
    coachEditedAt: null,
  }
}

export async function resetCheckInEntry(userId: string, entryId: string) {
  const existing = await localDb.playerSessionEntries.get(entryId)
  if (!existing || existing.userId !== userId) {
    throw new Error('Check-in-Eintrag nicht gefunden.')
  }

  const timestamp = nowIso()
  const resetEntry: PlayerSessionEntry = hasPostSessionData(existing)
    ? {
        ...resetCheckInFields(existing),
        updatedAt: timestamp,
        clientUpdatedAt: timestamp,
        syncStatus: 'pending',
        syncError: null,
      }
    : {
        ...existing,
        deletedAt: timestamp,
        updatedAt: timestamp,
        clientUpdatedAt: timestamp,
        syncStatus: 'pending',
        syncError: null,
      }

  await localDb.playerSessionEntries.put(resetEntry)
  await queueWrite('player_session_entries', resetEntry.id, userId)

  return resetEntry
}

export type CheckInResetSourceCounts = Record<CheckInSource, number>

export type SessionCheckInResetResult = {
  entries: PlayerSessionEntry[]
  resetCount: number
  deletedCount: number
  retainedPostSessionCount: number
  sourceCounts: CheckInResetSourceCounts
}

function emptySourceCounts(): CheckInResetSourceCounts {
  return {
    coach: 0,
    player_link: 0,
    player_kiosk: 0,
    mixed: 0,
  }
}

export async function resetAllCheckInsForSession(userId: string, sessionLogId: string) {
  const entries = await localDb.playerSessionEntries
    .where('userId')
    .equals(userId)
    .and((entry) => entry.sessionLogId === sessionLogId && !entry.deletedAt)
    .toArray()
  const timestamp = nowIso()
  const resetEntries: PlayerSessionEntry[] = []
  const sourceCounts = emptySourceCounts()
  let deletedCount = 0
  let retainedPostSessionCount = 0

  for (const entry of entries) {
    sourceCounts[entry.checkInSource ?? 'coach'] += 1

    if (hasPostSessionData(entry)) {
      const resetEntry: PlayerSessionEntry = {
        ...resetCheckInFields(entry),
        updatedAt: timestamp,
        clientUpdatedAt: timestamp,
        syncStatus: 'pending',
        syncError: null,
      }
      await localDb.playerSessionEntries.put(resetEntry)
      await queueWrite('player_session_entries', resetEntry.id, userId)
      resetEntries.push(resetEntry)
      retainedPostSessionCount += 1
      continue
    }

    const deletedEntry: PlayerSessionEntry = {
      ...entry,
      deletedAt: timestamp,
      updatedAt: timestamp,
      clientUpdatedAt: timestamp,
      syncStatus: 'pending',
      syncError: null,
    }
    await localDb.playerSessionEntries.put(deletedEntry)
    await queueWrite('player_session_entries', deletedEntry.id, userId)
    resetEntries.push(deletedEntry)
    deletedCount += 1
  }

  return {
    entries: resetEntries,
    resetCount: resetEntries.length,
    deletedCount,
    retainedPostSessionCount,
    sourceCounts,
  }
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

  const snapshots: Array<{ sessionLog: SessionLog; writeLocalId?: number }> = []
  for (const write of pendingWrites) {
    const sessionLog = await localDb.sessionLogs.get(write.recordId)
    if (!sessionLog) {
      await localDb.pendingWrites.delete(write.localId ?? 0)
      continue
    }

    snapshots.push({ sessionLog, writeLocalId: write.localId })
  }

  if (snapshots.length === 0) {
    return
  }

  const { error } = await supabase!
    .from('session_logs')
    .upsert(snapshots.map(({ sessionLog }) => rowFromSessionLog(sessionLog)))
    .select('id')
  if (error) {
    for (const { sessionLog } of snapshots) {
      await markSyncErrorIfUnchanged(localDb.sessionLogs, sessionLog, error.message)
    }
    throw new Error(error.message)
  }

  await Promise.all(
    snapshots.map(({ sessionLog, writeLocalId }) => markSyncedIfUnchanged(localDb.sessionLogs, sessionLog, writeLocalId)),
  )
}

async function syncPendingPlayerSessionEntries(userId: string) {
  const pendingWrites = await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === 'player_session_entries')
    .toArray()

  const snapshots: Array<{ entry: PlayerSessionEntry; writeLocalId?: number }> = []
  for (const write of pendingWrites) {
    const entry = await localDb.playerSessionEntries.get(write.recordId)
    if (!entry) {
      await localDb.pendingWrites.delete(write.localId ?? 0)
      continue
    }

    snapshots.push({ entry, writeLocalId: write.localId })
  }

  if (snapshots.length === 0) {
    return
  }

  const { error } = await supabase!
    .from('player_session_entries')
    .upsert(snapshots.map(({ entry }) => rowFromEntry(entry)))
    .select('id')
  if (error) {
    for (const { entry } of snapshots) {
      await markSyncErrorIfUnchanged(localDb.playerSessionEntries, entry, error.message)
    }
    throw new Error(error.message)
  }

  await Promise.all(
    snapshots.map(({ entry, writeLocalId }) =>
      markSyncedIfUnchanged(localDb.playerSessionEntries, entry, writeLocalId),
    ),
  )
}

type PullRemoteCheckInsOptions = {
  sessionDefinitionId?: string
}

async function refreshRemoteCheckIns(userId: string, options: PullRemoteCheckInsOptions = {}) {
  let sessionQuery = supabase!
    .from('session_logs')
    .select(
      'id,user_id,session_definition_id,date,status,coach,group_size,weather_or_heat_note,plan_changed,duration_minutes,contact_index,speed_exposure_note,coach_review,created_at,updated_at,deleted_at,client_updated_at',
    )
    .eq('user_id', userId)
  if (options.sessionDefinitionId) {
    sessionQuery = sessionQuery.eq('session_definition_id', options.sessionDefinitionId)
  }
  const { data: sessionRows, error: sessionError } = await sessionQuery.is('deleted_at', null)

  if (sessionError) {
    throw new Error(sessionError.message)
  }

  const remoteSessionLogs = (sessionRows ?? []) as SessionLogRow[]
  const localSessionLogs = await localDb.sessionLogs.bulkGet(remoteSessionLogs.map((row) => row.id))
  const sessionLogsToPut = remoteSessionLogs
    .map((row, index) => ({ local: localSessionLogs[index], remote: sessionLogFromRow(row), row }))
    .filter(({ local, row }) => {
      if (local && local.syncStatus !== 'synced') {
        return false
      }

      return !local || row.client_updated_at >= local.clientUpdatedAt
    })
    .map(({ remote }) => remote)
  await localDb.sessionLogs.bulkPut(sessionLogsToPut)

  const sessionLogIds = remoteSessionLogs.map((row) => row.id)
  if (options.sessionDefinitionId && sessionLogIds.length === 0) {
    return sessionLogIds
  }

  let entryQuery = supabase!
    .from('player_session_entries')
    .select(
      'id,user_id,session_log_id,player_id,present,readiness,life_flag,pain_score,pain_location,returner_flag,session_reaction,red_flag,movement_concern,traffic_light,traffic_light_suggestion,traffic_light_was_manual,training_variant,limits,observation,session_rpe,duration_minutes,session_load,post_pain_score,post_pain_location,e2_decision,next_step,checkin_source,player_submitted_at,coach_edited_at,player_note,created_at,updated_at,deleted_at,client_updated_at',
    )
    .eq('user_id', userId)
  if (options.sessionDefinitionId) {
    entryQuery = entryQuery.in('session_log_id', sessionLogIds)
  }
  const { data: entryRows, error: entryError } = await entryQuery.is('deleted_at', null)

  if (entryError) {
    throw new Error(entryError.message)
  }

  const remoteEntries = (entryRows ?? []) as PlayerSessionEntryRow[]
  const localEntries = await localDb.playerSessionEntries.bulkGet(remoteEntries.map((row) => row.id))
  const entriesToPut = remoteEntries
    .map((row, index) => ({ local: localEntries[index], remote: entryFromRow(row), row }))
    .filter(({ local, row }) => {
      if (local && local.syncStatus !== 'synced') {
        return false
      }

      return !local || row.client_updated_at >= local.clientUpdatedAt
    })
    .map(({ remote }) => remote)
  await localDb.playerSessionEntries.bulkPut(entriesToPut)

  return sessionLogIds
}

async function pushPendingCheckInsOnce(userId: string): Promise<PlayerSyncOverview> {
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
    await syncPendingSessionLogs(userId)
    await syncPendingSessionBlockLogs(userId)
    await syncPendingPlayerSessionEntries(userId)
    await syncPendingProgressEntries(userId)
    await syncPendingBaselineEntries(userId)
    await syncPendingReturnerEntries(userId)
    await syncPendingExposureSummaries(userId)
    await syncPendingMetricResults(userId)
    await syncPendingExerciseResults(userId)

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

export async function pushPendingCheckIns(userId: string): Promise<PlayerSyncOverview> {
  const pendingSync = pendingCheckInSyncs.get(userId)
  if (pendingSync) {
    rerunRequestedCheckInSyncs.add(userId)
    return pendingSync
  }

  const syncPromise = (async () => {
    let overview = await measureInteraction('sync:field-data-push', () => pushPendingCheckInsOnce(userId))
    while (rerunRequestedCheckInSyncs.delete(userId)) {
      const overviews = await Promise.all([
        getCheckInSyncOverview(userId),
        getSessionBlockSyncOverview(userId),
        getExposureSyncOverview(userId),
        getMetricSyncOverview(userId),
        getExerciseSyncOverview(userId),
      ])
      const [latestOverview] = overviews
      const pendingCount = overviews.reduce((total, currentOverview) => total + currentOverview.pendingCount, 0)
      const errorOverview = overviews.find((currentOverview) => currentOverview.status === 'error')
      const errorMessage = overviews.find((currentOverview) => currentOverview.errorMessage)?.errorMessage ?? null
      if (pendingCount === 0 || errorOverview) {
        overview = {
          ...latestOverview,
          status: errorOverview ? 'error' : latestOverview.status,
          pendingCount,
          errorMessage,
        }
        continue
      }

      overview = await measureInteraction('sync:field-data-push:rerun', () => pushPendingCheckInsOnce(userId))
    }
    return overview
  })().finally(() => {
      pendingCheckInSyncs.delete(userId)
      rerunRequestedCheckInSyncs.delete(userId)
    })
  pendingCheckInSyncs.set(userId, syncPromise)

  return syncPromise
}

export async function pullRemoteCheckIns(userId: string, options: PullRemoteCheckInsOptions = {}) {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const sessionLogIds = await refreshRemoteCheckIns(userId, options)
  if (options.sessionDefinitionId) {
    const scopedOptions = { sessionLogIds }
    await refreshRemoteProgressEntries(userId, scopedOptions)
    await refreshRemoteBaselineEntries(userId, scopedOptions)
    await refreshRemoteReturnerEntries(userId, scopedOptions)
    await refreshRemoteSessionBlockLogs(userId, scopedOptions)
    await refreshRemoteExposureSummaries(userId, scopedOptions)
    await refreshRemoteMetricResults(userId, scopedOptions)
    await refreshRemoteExerciseResults(userId, scopedOptions)
    return
  }

  await refreshRemoteProgressEntries(userId)
  await refreshRemoteBaselineEntries(userId)
  await refreshRemoteReturnerEntries(userId)
}

export async function syncCheckIns(userId: string, options: PullRemoteCheckInsOptions = {}): Promise<PlayerSyncOverview> {
  const overview = await pushPendingCheckIns(userId)
  if (overview.status === 'error') {
    return overview
  }

  try {
    await pullRemoteCheckIns(userId, options)
    return {
      ...(await getCheckInSyncOverview(userId)),
      status: 'synced',
      pendingCount: 0,
      lastSuccessfulSyncAt: overview.lastSuccessfulSyncAt,
      errorMessage: null,
    }
  } catch (caughtError) {
    return {
      ...(await getCheckInSyncOverview(userId)),
      status: 'error',
      errorMessage: caughtError instanceof Error ? caughtError.message : 'Check-in-Pull fehlgeschlagen.',
    }
  }
}
