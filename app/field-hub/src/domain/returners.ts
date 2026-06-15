import type { SyncStatus } from './sync'

export type ReturnerDecision = 'bleiben' | 'steigern' | 'reduzieren' | 'rueckmelden'

export type ReturnerEntry = {
  id: string
  userId: string
  playerId: string | null
  sessionLogId: string
  medicalContactNote: string
  currentStage: string
  speedCap: string
  codDecelCap: string
  conditioningCap: string
  contactCap: string
  allowedToday: string
  plannedCaps: string
  completed: string
  symptomsDuring: string
  nextMorning: string
  decision: ReturnerDecision | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export type ReturnerEntryPatch = Partial<
  Pick<
    ReturnerEntry,
    | 'medicalContactNote'
    | 'currentStage'
    | 'speedCap'
    | 'codDecelCap'
    | 'conditioningCap'
    | 'contactCap'
    | 'allowedToday'
    | 'plannedCaps'
    | 'completed'
    | 'symptomsDuring'
    | 'nextMorning'
    | 'decision'
  >
>

export type ReturnerCapSummary = Pick<
  ReturnerEntry,
  | 'playerId'
  | 'sessionLogId'
  | 'currentStage'
  | 'speedCap'
  | 'codDecelCap'
  | 'conditioningCap'
  | 'contactCap'
  | 'allowedToday'
  | 'plannedCaps'
  | 'completed'
  | 'symptomsDuring'
  | 'nextMorning'
  | 'decision'
> & {
  sessionDate: string
}

export const returnerStageOptions = [
  { value: '', label: 'Offen' },
  { value: 'rot', label: 'Rot: nur Gym' },
  { value: 'orange', label: 'Orange: Gym + individuelles Field' },
  { value: 'gelb', label: 'Gelb: Non-contact Teamtraining' },
  { value: 'gelb_gruen', label: 'Gelb-Gruen: Controlled Contact' },
  { value: 'gruen', label: 'Gruen: Full Training' },
  { value: 'gruen_plus', label: 'Gruen Plus: Match Exposure' },
] as const

export const returnerDecisionOptions: Array<{ value: ReturnerDecision; label: string }> = [
  { value: 'bleiben', label: 'Bleiben' },
  { value: 'steigern', label: 'Steigern' },
  { value: 'reduzieren', label: 'Reduzieren' },
  { value: 'rueckmelden', label: 'Rueckmelden' },
]

export const returnerRedFlags = [
  'Schwellung/Effusion',
  'Beweglichkeitsverlust',
  'Instabilitaet',
  'veraendertes Laufbild',
  'Schmerzprovokation',
  'neurologische Symptome',
  'Concussion-Verdacht',
  'schlechter naechster Morgen',
]

const harmlessConcernValues = new Set([
  '-',
  'kein',
  'keine',
  'nein',
  'nichts',
  'no',
  'none',
  'ok',
  'okay',
  'schmerzfrei',
  'stabil',
  'unauffaellig',
  'unauffällig',
])

const harmlessConcernPhrases = [
  'keine symptome',
  'keine probleme',
  'kein problem',
  'kein schmerz',
  'ohne schmerz',
  'ohne symptome',
]

function normalizedText(value: string) {
  return value.trim().toLocaleLowerCase('de-AT')
}

function isFilled(value: string) {
  return value.trim().length > 0
}

export function hasReturnerConcern(value: string) {
  const normalized = normalizedText(value)

  if (!normalized || harmlessConcernValues.has(normalized)) {
    return false
  }

  if (harmlessConcernPhrases.some((phrase) => normalized.includes(phrase))) {
    return false
  }

  return true
}

export function hasCompleteReturnerCaps(entry: Pick<ReturnerEntry, 'speedCap' | 'codDecelCap' | 'conditioningCap' | 'contactCap' | 'allowedToday' | 'completed'>) {
  return [
    entry.speedCap,
    entry.codDecelCap,
    entry.conditioningCap,
    entry.contactCap,
    entry.allowedToday,
    entry.completed,
  ].every(isFilled)
}

export function canConsiderReturnerProgression(entry: ReturnerEntry) {
  if (entry.decision === 'rueckmelden' || entry.decision === 'reduzieren') {
    return false
  }

  return hasCompleteReturnerCaps(entry) && !hasReturnerConcern(entry.symptomsDuring) && !hasReturnerConcern(entry.nextMorning)
}

export function suggestReturnerDecision(entry: ReturnerEntry): ReturnerDecision {
  if (hasReturnerConcern(entry.symptomsDuring) || hasReturnerConcern(entry.nextMorning)) {
    return 'rueckmelden'
  }

  if (!hasCompleteReturnerCaps(entry)) {
    return 'bleiben'
  }

  return 'steigern'
}
