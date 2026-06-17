import type { ReturnerStatus } from './players'
import type { E2Decision, NextStep } from './postSession'
import type { SyncStatus } from './sync'

export type TrafficLight = 'green' | 'yellow' | 'red'
export type ReturnerFlag = ReturnerStatus
export type RedFlag = 'none' | 'head_neck_neuro' | 'acute_instability'
export type TrainingVariant = 'A_plus' | 'A' | 'B' | 'C' | 'D'
export type SessionReaction = 'none' | 'new_or_worse' | 'unsure'
export type AttendanceStatus = 'open' | 'present' | 'absent'

export type CheckInLimit = 'kein_sprint' | 'kein_cond' | 'kein_schweres_heben' | 'physio' | 'klaeren'
export type CheckInSource = 'coach' | 'player_link' | 'player_kiosk' | 'mixed'

export type CheckInDraft = {
  present: boolean
  readiness: number | null
  lifeFlag: string
  painScore: number | null
  painLocation: string
  returnerFlag: ReturnerFlag
  redFlag: RedFlag
  movementConcern: boolean
  previousWarning: boolean
  sessionReaction: SessionReaction
  trafficLight: TrafficLight | null
  trafficLightSuggestion: TrafficLight | null
  trafficLightWasManual: boolean
  trainingVariant: TrainingVariant | null
  limits: CheckInLimit[]
  observation: string
  playerNote?: string
}

export type SessionLog = {
  id: string
  userId: string
  sessionDefinitionId: string
  date: string
  status: 'planned' | 'in_progress' | 'completed'
  coach: string
  groupSize: number | null
  weatherOrHeatNote: string
  planChanged: boolean
  durationMinutes: number | null
  contactIndex: string
  speedExposureNote: string
  coachReview: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type PlayerSessionEntry = CheckInDraft & {
  id: string
  userId: string
  sessionLogId: string
  playerId: string | null
  sessionRpe: number | null
  durationMinutes: number | null
  sessionLoad: number | null
  postPainScore: number | null
  postPainLocation: string
  e2Decision: E2Decision | null
  nextStep: NextStep | null
  checkInSource?: CheckInSource
  playerSubmittedAt?: string | null
  coachEditedAt?: string | null
  playerNote?: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type PostSessionEntryPatch = Partial<
  Pick<
    PlayerSessionEntry,
    'sessionRpe' | 'durationMinutes' | 'postPainScore' | 'postPainLocation' | 'e2Decision' | 'nextStep'
  >
>

export type CheckInEntryPatch = Partial<
  Pick<
    CheckInDraft,
    | 'present'
    | 'readiness'
    | 'lifeFlag'
    | 'painScore'
    | 'painLocation'
    | 'returnerFlag'
    | 'redFlag'
    | 'movementConcern'
    | 'previousWarning'
    | 'sessionReaction'
    | 'trainingVariant'
    | 'limits'
    | 'observation'
    | 'playerNote'
  >
>

export type PlayerWarning = {
  playerId: string | null
  trafficLight: TrafficLight | null
  returnerFlag: ReturnerFlag
  limits: CheckInLimit[]
  observation: string
  e2Decision: E2Decision | null
  nextStep: NextStep | null
  postPainScore: number | null
  postPainLocation: string
  sessionLoad: number | null
  sessionDate: string
}

export type PlayerObservation = {
  playerId: string | null
  observation: string
  sessionDate: string
}

export const emptyCheckInDraft: CheckInDraft = {
  present: false,
  readiness: null,
  lifeFlag: '',
  painScore: null,
  painLocation: '',
  returnerFlag: 'offen',
  redFlag: 'none',
  movementConcern: false,
  previousWarning: false,
  sessionReaction: 'none',
  trafficLight: null,
  trafficLightSuggestion: null,
  trafficLightWasManual: false,
  trainingVariant: null,
  limits: [],
  observation: '',
  playerNote: '',
}

const harmlessLifeFlagValues = new Set([
  '-',
  'kein',
  'keine',
  'nein',
  'nichts',
  'no',
  'none',
  'ok',
  'okay',
  'unauffaellig',
  'unauffällig',
])

export function hasLifeFlagConcern(lifeFlag: string) {
  const normalized = lifeFlag.trim().toLocaleLowerCase('de-AT')

  return normalized.length > 0 && !harmlessLifeFlagValues.has(normalized)
}

export function getTrafficLightSignals(input: CheckInDraft) {
  const yellowSignals = [
    input.painScore !== null && input.painScore >= 3 && input.painScore <= 4,
    input.readiness !== null && input.readiness <= 2,
    hasLifeFlagConcern(input.lifeFlag),
    input.returnerFlag === 'ja',
    input.previousWarning,
    input.sessionReaction === 'new_or_worse' || input.sessionReaction === 'unsure',
  ].filter(Boolean).length

  return {
    yellowSignals,
    hasRedSignal:
      (input.painScore !== null && input.painScore > 4) ||
      input.redFlag !== 'none' ||
      input.movementConcern,
    needsReturnerClarification: input.returnerFlag === 'offen',
  }
}

export function suggestTrafficLight(input: CheckInDraft): TrafficLight {
  const { yellowSignals, hasRedSignal } = getTrafficLightSignals(input)

  if (hasRedSignal || yellowSignals >= 2) {
    return 'red'
  }

  if (yellowSignals > 0) {
    return 'yellow'
  }

  return 'green'
}

export function applyManualTrafficLight(draft: CheckInDraft, manualTrafficLight: TrafficLight): CheckInDraft {
  return {
    ...draft,
    trafficLightSuggestion: draft.trafficLightSuggestion ?? suggestTrafficLight(draft),
    trafficLight: manualTrafficLight,
    trafficLightWasManual: true,
  }
}

export function applySuggestedTrafficLight(draft: CheckInDraft): CheckInDraft {
  const suggestion = suggestTrafficLight(draft)

  return {
    ...draft,
    trafficLightSuggestion: suggestion,
    trafficLight: draft.trafficLightWasManual ? draft.trafficLight : suggestion,
  }
}

// Clears a coach override and re-arms the automatic suggestion. Without this a manual
// traffic-light correction stays frozen forever (e.g. pain rising to 8 never turns the
// light red), which is a safety-relevant signal that the coach could not recover.
export function applyAutoTrafficLight(draft: CheckInDraft): CheckInDraft {
  const suggestion = suggestTrafficLight(draft)

  return {
    ...draft,
    trafficLightSuggestion: suggestion,
    trafficLight: suggestion,
    trafficLightWasManual: false,
  }
}

export function deriveLimits(draft: CheckInDraft): CheckInLimit[] {
  const limits = new Set(draft.limits)
  const suggestion = suggestTrafficLight(draft)

  if (suggestion === 'yellow') {
    limits.add('kein_cond')
  }

  if (suggestion === 'red') {
    limits.add('kein_sprint')
    limits.add('kein_cond')
    limits.add('kein_schweres_heben')
    limits.add('klaeren')
  }

  if (draft.redFlag !== 'none') {
    limits.add('physio')
  }

  return [...limits]
}

export function hasMeaningfulCheckIn(entry: PlayerSessionEntry) {
  return (
    entry.present ||
    entry.readiness !== null ||
    entry.lifeFlag.trim().length > 0 ||
    entry.painScore !== null ||
    entry.painLocation.trim().length > 0 ||
    entry.returnerFlag !== 'offen' ||
    entry.redFlag !== 'none' ||
    entry.movementConcern ||
    entry.previousWarning ||
    entry.sessionReaction !== 'none' ||
    entry.trainingVariant !== null ||
    entry.limits.length > 0 ||
    entry.observation.trim().length > 0 ||
    (entry.playerNote?.trim().length ?? 0) > 0 ||
    Boolean(entry.playerSubmittedAt) ||
    Boolean(entry.coachEditedAt)
  )
}

export function deriveAttendanceStatus(entry: PlayerSessionEntry): AttendanceStatus {
  if (entry.present) {
    return 'present'
  }

  if (!hasMeaningfulCheckIn(entry)) {
    return 'open'
  }

  return entry.coachEditedAt ? 'absent' : 'open'
}
