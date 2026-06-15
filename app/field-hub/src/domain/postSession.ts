import type { PlayerSessionEntry } from './checkIn'
import type { SyncStatus } from './sync'

export type E2Decision = 'normal' | 'C' | 'D' | 'kein_sprint' | 'kein_cond' | 'physio'
export type NextStep = 'steigern' | 'halten' | 'reduzieren' | 'klaeren'

export type ProgressEntry = {
  id: string
  userId: string
  playerId: string | null
  sessionLogId: string
  mainExercise: string
  load: string
  reps: string
  rpe: string
  powerOrSprint: string
  conditioning: string
  note: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

function parseRpe(rpe: string) {
  const match = rpe.trim().replace(',', '.').match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

export function calculateSessionLoad(sessionRpe: number | null, durationMinutes: number | null) {
  if (sessionRpe === null || durationMinutes === null) {
    return null
  }

  return sessionRpe * durationMinutes
}

export function suggestNextStep(entry: PlayerSessionEntry, progressEntry: ProgressEntry): NextStep {
  const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
  const rpe = parseRpe(progressEntry.rpe)
  const painIncreased =
    entry.painScore !== null && entry.postPainScore !== null && entry.postPainScore > entry.painScore

  if (
    trafficLight === 'red' ||
    entry.trainingVariant === 'D' ||
    entry.e2Decision === 'D' ||
    entry.e2Decision === 'physio' ||
    entry.limits.includes('physio') ||
    entry.limits.includes('klaeren') ||
    (rpe !== null && rpe >= 10)
  ) {
    return 'klaeren'
  }

  if (painIncreased) {
    return 'reduzieren'
  }

  if (
    trafficLight === 'yellow' ||
    entry.trainingVariant === 'C' ||
    entry.e2Decision === 'C' ||
    entry.e2Decision === 'kein_sprint' ||
    entry.e2Decision === 'kein_cond' ||
    entry.limits.length > 0 ||
    (rpe !== null && rpe >= 9)
  ) {
    return 'halten'
  }

  if (trafficLight === 'green' && (rpe === null || rpe <= 8)) {
    return 'steigern'
  }

  return 'halten'
}

export function derivePostSessionFollowUps(entry: PlayerSessionEntry, progressEntry?: ProgressEntry | null) {
  const followUps: string[] = []
  const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
  const painIncreased =
    entry.painScore !== null && entry.postPainScore !== null && entry.postPainScore > entry.painScore

  if (entry.e2Decision && entry.e2Decision !== 'normal') {
    followUps.push(`E2: ${entry.e2Decision} fuer naechste Einheit beachten.`)
  }

  if (entry.postPainScore !== null && entry.postPainScore >= 3) {
    const location = entry.postPainLocation.trim()
    followUps.push(`Pain/Issue nach Training: ${entry.postPainScore}/10${location ? ` ${location}` : ''}.`)
  }

  if (painIncreased) {
    followUps.push('Schmerz ist im Training gestiegen.')
  }

  if (trafficLight === 'yellow') {
    followUps.push('Ampel Gelb in naechster Einheit vorladen.')
  }

  if (trafficLight === 'red') {
    followUps.push('Ampel Rot in naechster Einheit vorladen.')
  }

  if (entry.limits.includes('physio') || entry.e2Decision === 'physio') {
    followUps.push('Physio/Medical Ruecksprache offen.')
  }

  if (
    progressEntry &&
    (entry.nextStep === 'reduzieren' || entry.nextStep === 'klaeren') &&
    progressEntry.mainExercise.trim()
  ) {
    followUps.push(`Progression: ${entry.nextStep} fuer ${progressEntry.mainExercise.trim()}.`)
  }

  return followUps
}
