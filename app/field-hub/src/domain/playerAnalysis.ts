import { deriveAttendanceStatus, type AttendanceStatus, type PlayerSessionEntry, type SessionLog } from './checkIn'
import { exposureTypes, type ExposureStatusMap, type PlayerExposureSummary } from './exposures'
import type { ExerciseResult } from './exercises'
import { buildRollingLoadFromPoints, type RollingLoadWindow } from './loadAnalysis'
import type { MetricResult } from './metrics'
import type { ProgressEntry } from './postSession'
import type { ReturnerEntry } from './returners'

export type PlayerAnalysisSourceTable =
  | 'player_session_entries'
  | 'progress_entries'
  | 'returner_entries'
  | 'player_exposure_summaries'
  | 'metric_results'
  | 'exercise_results'

export type PlayerAnalysisCorrectionTarget = 'check-in' | 'nachbereitung' | 'training' | 'returner'

export type PlayerAnalysisSource = {
  sessionLogId: string | null
  sessionDefinitionId: string | null
  sessionDate: string
  table: PlayerAnalysisSourceTable
  recordId: string
  correctionTarget: PlayerAnalysisCorrectionTarget
}

export type PlayerAnalysisPoint<TValue> = PlayerAnalysisSource & {
  value: TValue
  label: string
}

export type PlayerAnalysisSummary = {
  attendance: PlayerAnalysisPoint<AttendanceStatus>[]
  readiness: PlayerAnalysisPoint<number>[]
  painScores: PlayerAnalysisPoint<number>[]
  painLocations: PlayerAnalysisPoint<string>[]
  load: PlayerAnalysisPoint<{ sessionRpe: number | null; durationMinutes: number | null; sessionLoad: number | null }>[]
  rollingLoad: Array<{ label: '7d' | '28d'; total: number | null; entryCount: number }>
  metricsByKey: Array<{ metricKey: string; points: PlayerAnalysisPoint<number>[] }>
  exercisesByKey: Array<{
    exerciseKey: string
    points: Array<PlayerAnalysisPoint<{ loadValue: number | null; rpe: number | null; reps: string }>>
  }>
  exposures: PlayerAnalysisPoint<ExposureStatusMap>[]
  exposureGaps: Array<{ exposureType: string; sessionsSinceSeen: number | null }>
  returner: PlayerAnalysisPoint<{
    stage: string
    decision: string | null
    speedCap: string
    codDecelCap: string
    conditioningCap: string
    contactCap: string
  }>[]
}

export type BuildPlayerAnalysisSummaryInput = {
  playerId: string
  todayKey?: string
  sessionLogs: SessionLog[]
  entries: PlayerSessionEntry[]
  progressEntries: ProgressEntry[]
  returnerEntries: ReturnerEntry[]
  exposureSummaries: PlayerExposureSummary[]
  metricResults: MetricResult[]
  exerciseResults: ExerciseResult[]
}

const historyLimit = 12
const painLocationLimit = 8
const groupedRowLimit = 20
const groupedVisibleLimit = 8
const exposureLimit = 8
const returnerLimit = 8

function dateBySessionLogId(sessionLogs: SessionLog[]) {
  return new Map(sessionLogs.filter((sessionLog) => !sessionLog.deletedAt).map((sessionLog) => [sessionLog.id, sessionLog]))
}

function sessionDateFor(sessionLogs: Map<string, SessionLog>, sessionLogId: string | null, fallback: string) {
  return sessionLogId ? (sessionLogs.get(sessionLogId)?.date ?? fallback.slice(0, 10)) : fallback.slice(0, 10)
}

function sessionDefinitionIdFor(sessionLogs: Map<string, SessionLog>, sessionLogId: string | null) {
  return sessionLogId ? (sessionLogs.get(sessionLogId)?.sessionDefinitionId ?? null) : null
}

function sourceFor(
  sessionLogs: Map<string, SessionLog>,
  source: {
    id: string
    sessionLogId: string | null
    createdAt: string
  },
  table: PlayerAnalysisSourceTable,
  correctionTarget: PlayerAnalysisCorrectionTarget,
): PlayerAnalysisSource {
  return {
    sessionLogId: source.sessionLogId,
    sessionDefinitionId: sessionDefinitionIdFor(sessionLogs, source.sessionLogId),
    sessionDate: sessionDateFor(sessionLogs, source.sessionLogId, source.createdAt),
    table,
    recordId: source.id,
    correctionTarget,
  }
}

function newestFirst<T extends { sessionLogId: string | null; createdAt: string; clientUpdatedAt: string }>(
  items: T[],
  sessionLogs: Map<string, SessionLog>,
) {
  return [...items].sort((a, b) => {
    const dateA = sessionDateFor(sessionLogs, a.sessionLogId, a.createdAt)
    const dateB = sessionDateFor(sessionLogs, b.sessionLogId, b.createdAt)

    if (dateA !== dateB) {
      return dateB.localeCompare(dateA)
    }

    return b.clientUpdatedAt.localeCompare(a.clientUpdatedAt)
  })
}

function groupPointsByKey<TPoint extends PlayerAnalysisPoint<unknown>>(
  points: TPoint[],
  keyFor: (point: TPoint) => string,
) {
  const groups = new Map<string, TPoint[]>()
  for (const point of points) {
    groups.set(keyFor(point), [...(groups.get(keyFor(point)) ?? []), point])
  }

  return [...groups.entries()].map(([key, groupedPoints]) => ({
    key,
    points: groupedPoints.slice(0, groupedVisibleLimit),
  }))
}

function formatPlayerRollingLoad(days: 7 | 28, rollingLoad: RollingLoadWindow<7 | 28>) {
  return {
    label: `${days}d` as const,
    total: rollingLoad?.total ?? null,
    entryCount: rollingLoad?.entryCount ?? 0,
  }
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

export function buildPlayerAnalysisSummary({
  playerId,
  todayKey,
  sessionLogs,
  entries,
  returnerEntries,
  exposureSummaries,
  metricResults,
  exerciseResults,
}: BuildPlayerAnalysisSummaryInput): PlayerAnalysisSummary {
  const sessionLogById = dateBySessionLogId(sessionLogs)
  const playerEntries = newestFirst(
    entries.filter((entry) => entry.playerId === playerId && !entry.deletedAt),
    sessionLogById,
  )
  const attendance = playerEntries.slice(0, historyLimit).map((entry) => ({
    ...sourceFor(sessionLogById, entry, 'player_session_entries', 'check-in'),
    value: deriveAttendanceStatus(entry),
    label: 'Attendance',
  }))
  const readiness = playerEntries
    .filter((entry) => entry.readiness !== null)
    .slice(0, historyLimit)
    .map((entry) => ({
      ...sourceFor(sessionLogById, entry, 'player_session_entries', 'check-in'),
      value: entry.readiness ?? 0,
      label: 'Readiness',
    }))
  const painScores = playerEntries
    .filter((entry) => entry.painScore !== null)
    .slice(0, historyLimit)
    .map((entry) => ({
      ...sourceFor(sessionLogById, entry, 'player_session_entries', 'check-in'),
      value: entry.painScore ?? 0,
      label: 'Pain',
    }))
  const painLocations = playerEntries
    .flatMap((entry) => {
      const sources: PlayerAnalysisPoint<string>[] = []
      if (entry.postPainLocation.trim()) {
        sources.push({
          ...sourceFor(sessionLogById, entry, 'player_session_entries', 'nachbereitung'),
          value: entry.postPainLocation.trim(),
          label: 'Post Pain Location',
        })
      }
      if (entry.painLocation.trim()) {
        sources.push({
          ...sourceFor(sessionLogById, entry, 'player_session_entries', 'check-in'),
          value: entry.painLocation.trim(),
          label: 'Pain Location',
        })
      }

      return sources
    })
    .slice(0, painLocationLimit)
  const allLoad = playerEntries
    .filter((entry) => entry.sessionRpe !== null || entry.durationMinutes !== null || entry.sessionLoad !== null)
    .map((entry) => ({
      ...sourceFor(sessionLogById, entry, 'player_session_entries', 'nachbereitung'),
      value: {
        sessionRpe: entry.sessionRpe,
        durationMinutes: entry.durationMinutes,
        sessionLoad: entry.sessionLoad,
      },
      label: 'sRPE Load',
    }))
  const loadPoints = allLoad.map((point) => ({
    sessionDate: point.sessionDate,
    load: point.value.sessionLoad,
  }))
  const rolling7dLoad = todayKey ? buildRollingLoadFromPoints(loadPoints, todayKey, 7) : null
  const rolling28dLoad = todayKey ? buildRollingLoadFromPoints(loadPoints, todayKey, 28) : null
  const load = allLoad.slice(0, historyLimit)
  const metricPoints = newestFirst(
    metricResults.filter((result) => result.playerId === playerId && !result.deletedAt),
    sessionLogById,
  )
    .slice(0, groupedRowLimit)
    .map((result) => ({
      ...sourceFor(sessionLogById, result, 'metric_results', 'nachbereitung'),
      value: result.value,
      label: result.metricKey,
      metricKey: result.metricKey,
    }))
  const exercisePoints = newestFirst(
    exerciseResults.filter((result) => result.playerId === playerId && !result.deletedAt),
    sessionLogById,
  )
    .slice(0, groupedRowLimit)
    .map((result) => ({
      ...sourceFor(sessionLogById, result, 'exercise_results', 'nachbereitung'),
      value: {
        loadValue: result.loadValue,
        rpe: result.rpe,
        reps: result.reps,
      },
      label: result.exerciseKey,
      exerciseKey: result.exerciseKey,
    }))
  const exposures = newestFirst(
    exposureSummaries.filter((summary) => summary.playerId === playerId && !summary.deletedAt),
    sessionLogById,
  )
    .slice(0, exposureLimit)
    .map((summary) => ({
      ...sourceFor(sessionLogById, summary, 'player_exposure_summaries', 'nachbereitung'),
      value: summary.statuses,
      label: 'Exposure',
    }))
  const returner = newestFirst(
    returnerEntries.filter((entry) => entry.playerId === playerId && !entry.deletedAt && hasReturnerContent(entry)),
    sessionLogById,
  )
    .slice(0, returnerLimit)
    .map((entry) => ({
      ...sourceFor(sessionLogById, entry, 'returner_entries', 'returner'),
      value: {
        stage: entry.currentStage,
        decision: entry.decision,
        speedCap: entry.speedCap,
        codDecelCap: entry.codDecelCap,
        conditioningCap: entry.conditioningCap,
        contactCap: entry.contactCap,
      },
      label: 'Returner',
    }))
  const exposureGaps = exposureTypes.map((type) => {
    const index = exposures.findIndex((point) => {
      const status = point.value[type]
      return status === 'completed' || status === 'reduced'
    })

    return {
      exposureType: type,
      sessionsSinceSeen: index >= 0 ? index : null,
    }
  })

  return {
    attendance,
    readiness,
    painScores,
    painLocations,
    load,
    rollingLoad: [formatPlayerRollingLoad(7, rolling7dLoad), formatPlayerRollingLoad(28, rolling28dLoad)],
    metricsByKey: groupPointsByKey(metricPoints, (point) => point.metricKey).map((group) => ({
      metricKey: group.key,
      points: group.points,
    })),
    exercisesByKey: groupPointsByKey(exercisePoints, (point) => point.exerciseKey).map((group) => ({
      exerciseKey: group.key,
      points: group.points,
    })),
    exposures,
    exposureGaps,
    returner,
  }
}
