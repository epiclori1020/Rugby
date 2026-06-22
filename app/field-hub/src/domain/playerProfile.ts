import type { BaselineEntry } from './baseline'
import { hasBaselineContent } from './baseline'
import type { PlayerSessionEntry, SessionLog, TrafficLight } from './checkIn'
import { deriveAttendanceStatus, type AttendanceStatus } from './checkIn'
import type { ExerciseResult } from './exercises'
import type { PlayerExposureSummary } from './exposures'
import type { MetricResult } from './metrics'
import { buildPlayerAnalysisSummary, type PlayerAnalysisSummary } from './playerAnalysis'
import type { Player } from './players'
import type { ProgressEntry } from './postSession'
import type { ReturnerEntry } from './returners'

type SessionDated = {
  sessionDate: string
}

export type PlayerProfileLatestSession = SessionDated & {
  attendanceStatus: AttendanceStatus
  readiness: number | null
  painScore: number | null
  trafficLight: TrafficLight | null
  source: PlayerSessionEntry['checkInSource']
}

export type PlayerProfileOpenIssues = {
  severity: 'none' | 'yellow' | 'red'
  items: string[]
}

export type PlayerProfileLoad = SessionDated & {
  sessionRpe: number | null
  durationMinutes: number | null
  sessionLoad: number | null
}

export type PlayerProfileBaseline = BaselineEntry & SessionDated
export type PlayerProfileProgression = ProgressEntry & SessionDated
export type PlayerProfileReturner = ReturnerEntry & SessionDated
export type PlayerProfileExposure = PlayerExposureSummary & SessionDated
export type PlayerProfileMetric = MetricResult & SessionDated
export type PlayerProfileExerciseResult = ExerciseResult & SessionDated

export type PlayerProfileSummary = {
  playerId: string
  player: Player
  latestSession: PlayerProfileLatestSession | null
  openIssues: PlayerProfileOpenIssues
  latestLoad: PlayerProfileLoad | null
  latestBaseline: PlayerProfileBaseline | null
  latestProgression: PlayerProfileProgression | null
  latestReturner: PlayerProfileReturner | null
  recentExposures: PlayerProfileExposure[]
  recentMetrics: PlayerProfileMetric[]
  recentExerciseResults: PlayerProfileExerciseResult[]
  analysis: PlayerAnalysisSummary
}

export type BuildPlayerProfileSummaryInput = {
  player: Player
  todayKey?: string
  sessionLogs: SessionLog[]
  entries: PlayerSessionEntry[]
  baselineEntries: BaselineEntry[]
  progressEntries: ProgressEntry[]
  returnerEntries: ReturnerEntry[]
  exposureSummaries?: PlayerExposureSummary[]
  metricResults?: MetricResult[]
  exerciseResults?: ExerciseResult[]
}

function dateBySessionLogId(sessionLogs: SessionLog[]) {
  return new Map(sessionLogs.filter((sessionLog) => !sessionLog.deletedAt).map((sessionLog) => [sessionLog.id, sessionLog.date]))
}

function sessionDateFor(sessionDates: Map<string, string>, sessionLogId: string | null, fallback: string) {
  return sessionLogId ? (sessionDates.get(sessionLogId) ?? fallback.slice(0, 10)) : fallback.slice(0, 10)
}

function newestFirst<T extends { sessionLogId: string | null; createdAt: string; clientUpdatedAt: string }>(
  items: T[],
  sessionDates: Map<string, string>,
) {
  return [...items].sort((a, b) => {
    const dateA = sessionDateFor(sessionDates, a.sessionLogId, a.createdAt)
    const dateB = sessionDateFor(sessionDates, b.sessionLogId, b.createdAt)

    if (dateA !== dateB) {
      return dateB.localeCompare(dateA)
    }

    return b.clientUpdatedAt.localeCompare(a.clientUpdatedAt)
  })
}

function hasProgressContent(entry: ProgressEntry) {
  return [
    entry.mainExercise,
    entry.load,
    entry.reps,
    entry.rpe,
    entry.powerOrSprint,
    entry.conditioning,
    entry.note,
  ].some((value) => value.trim().length > 0)
}

function hasReturnerContent(entry: ReturnerEntry) {
  return [
    entry.medicalContactNote,
    entry.currentStage,
    entry.speedCap,
    entry.codDecelCap,
    entry.conditioningCap,
    entry.contactCap,
    entry.allowedToday,
    entry.plannedCaps,
    entry.completed,
    entry.symptomsDuring,
    entry.nextMorning,
  ].some((value) => value.trim().length > 0) || entry.decision !== null
}

function deriveOpenIssues(entry: PlayerSessionEntry | null): PlayerProfileOpenIssues {
  if (!entry) {
    return { severity: 'none', items: [] }
  }

  const items: string[] = []
  const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion

  if (trafficLight === 'yellow') {
    items.push('Ampel Gelb')
  } else if (trafficLight === 'red') {
    items.push('Ampel Rot')
  }

  if (entry.redFlag !== 'none') {
    items.push('Red Flag: Kopf/Nacken/neurologisch oder Instabilitaet')
  }

  if (entry.movementConcern) {
    items.push('Movement Concern')
  }

  if (entry.limits.length > 0) {
    items.push(`Limits: ${entry.limits.join(', ')}`)
  }

  if (entry.postPainScore !== null && entry.postPainScore >= 3) {
    const location = entry.postPainLocation.trim()
    items.push(`Post-Pain ${entry.postPainScore}/10${location ? ` ${location}` : ''}`)
  }

  if (entry.e2Decision && entry.e2Decision !== 'normal') {
    items.push(`E2: ${entry.e2Decision}`)
  }

  if (entry.nextStep === 'reduzieren' || entry.nextStep === 'klaeren') {
    items.push(`Next Step: ${entry.nextStep}`)
  }

  const severity =
    trafficLight === 'red' ||
    entry.redFlag !== 'none' ||
    entry.movementConcern ||
    entry.limits.includes('physio') ||
    entry.limits.includes('klaeren') ||
    entry.e2Decision === 'physio' ||
    entry.nextStep === 'klaeren'
      ? 'red'
      : items.length > 0
        ? 'yellow'
        : 'none'

  return { severity, items }
}

export function buildPlayerProfileSummary({
  player,
  todayKey,
  sessionLogs,
  entries,
  baselineEntries,
  progressEntries,
  returnerEntries,
  exposureSummaries = [],
  metricResults = [],
  exerciseResults = [],
}: BuildPlayerProfileSummaryInput): PlayerProfileSummary {
  const sessionDates = dateBySessionLogId(sessionLogs)
  const playerEntries = newestFirst(
    entries.filter((entry) => entry.playerId === player.id && !entry.deletedAt),
    sessionDates,
  )
  const latestEntry = playerEntries[0] ?? null
  const latestLoadEntry =
    playerEntries.find(
      (entry) => entry.sessionRpe !== null || entry.durationMinutes !== null || entry.sessionLoad !== null,
    ) ?? null
  const latestBaselineSource =
    newestFirst(
      baselineEntries.filter((entry) => entry.playerId === player.id && !entry.deletedAt && hasBaselineContent(entry)),
      sessionDates,
    )[0] ?? null
  const latestProgressionSource =
    newestFirst(
      progressEntries.filter((entry) => entry.playerId === player.id && !entry.deletedAt && hasProgressContent(entry)),
      sessionDates,
    )[0] ?? null
  const latestReturnerSource =
    newestFirst(
      returnerEntries.filter((entry) => entry.playerId === player.id && !entry.deletedAt && hasReturnerContent(entry)),
      sessionDates,
    )[0] ?? null
  const recentExposureSources = newestFirst(
    exposureSummaries.filter((entry) => entry.playerId === player.id && !entry.deletedAt),
    sessionDates,
  ).slice(0, 6)
  const recentMetricSources = newestFirst(
    metricResults.filter((entry) => entry.playerId === player.id && !entry.deletedAt),
    sessionDates,
  ).slice(0, 12)
  const recentExerciseSources = newestFirst(
    exerciseResults.filter((entry) => entry.playerId === player.id && !entry.deletedAt),
    sessionDates,
  ).slice(0, 12)

  return {
    playerId: player.id,
    player,
    latestSession: latestEntry
      ? {
          sessionDate: sessionDateFor(sessionDates, latestEntry.sessionLogId, latestEntry.createdAt),
          attendanceStatus: deriveAttendanceStatus(latestEntry),
          readiness: latestEntry.readiness,
          painScore: latestEntry.painScore,
          trafficLight: latestEntry.trafficLight ?? latestEntry.trafficLightSuggestion,
          source: latestEntry.checkInSource,
        }
      : null,
    openIssues: deriveOpenIssues(latestEntry),
    latestLoad: latestLoadEntry
      ? {
          sessionDate: sessionDateFor(sessionDates, latestLoadEntry.sessionLogId, latestLoadEntry.createdAt),
          sessionRpe: latestLoadEntry.sessionRpe,
          durationMinutes: latestLoadEntry.durationMinutes,
          sessionLoad: latestLoadEntry.sessionLoad,
        }
      : null,
    latestBaseline: latestBaselineSource
      ? {
          ...latestBaselineSource,
          sessionDate: sessionDateFor(sessionDates, latestBaselineSource.sessionLogId, latestBaselineSource.createdAt),
        }
      : null,
    latestProgression: latestProgressionSource
      ? {
          ...latestProgressionSource,
          sessionDate: sessionDateFor(
            sessionDates,
            latestProgressionSource.sessionLogId,
            latestProgressionSource.createdAt,
          ),
        }
      : null,
    latestReturner: latestReturnerSource
      ? {
          ...latestReturnerSource,
          sessionDate: sessionDateFor(sessionDates, latestReturnerSource.sessionLogId, latestReturnerSource.createdAt),
        }
      : null,
    recentExposures: recentExposureSources.map((entry) => ({
      ...entry,
      sessionDate: sessionDateFor(sessionDates, entry.sessionLogId ?? '', entry.createdAt),
    })),
    recentMetrics: recentMetricSources.map((entry) => ({
      ...entry,
      sessionDate: sessionDateFor(sessionDates, entry.sessionLogId ?? '', entry.createdAt),
    })),
    recentExerciseResults: recentExerciseSources.map((entry) => ({
      ...entry,
      sessionDate: sessionDateFor(sessionDates, entry.sessionLogId, entry.createdAt),
    })),
    analysis: buildPlayerAnalysisSummary({
      playerId: player.id,
      todayKey,
      sessionLogs,
      entries,
      progressEntries,
      returnerEntries,
      exposureSummaries,
      metricResults,
      exerciseResults,
    }),
  }
}
