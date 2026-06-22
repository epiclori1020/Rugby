import type { SessionDefinition } from '../content/types'
import { deriveAttendanceStatus, type PlayerSessionEntry, type SessionLog, type TrafficLight } from './checkIn'
import { exposureTypes, type ExposureStatus, type ExposureType, type PlayerExposureSummary } from './exposures'
import type { ExerciseResult } from './exercises'
import {
  buildLoadSpikeRatio,
  buildRollingLoadFromPoints,
  dateDaysBefore,
  type RollingLoadWindow,
} from './loadAnalysis'
import type { MetricResult } from './metrics'
import type { Player, PlayerCluster } from './players'
import type { SessionBlockLog, SessionBlockStatus } from './sessionBlocks'

export type AnalysisRangeWeeks = 4 | 8
export type AnalysisClusterFilter = PlayerCluster | 'all'
export type AnalysisExposureFilter = ExposureType | 'all'

export type AnalysisFilters = {
  startDate: string
  endDate: string
  cluster: AnalysisClusterFilter
  position: string
  exposureType: AnalysisExposureFilter
}

export type AnalysisWeeklySummary = {
  weekStart: string
  weekLabel: string
  sessionCount: number
  rosterSlotCount: number
  presentCount: number
  absentCount: number
  openCount: number
  attendanceRate: number | null
  readinessAverage: number | null
  readinessTrend: number | null
  weeklyLoad: number
}

export type AnalysisTrafficDistribution = Record<TrafficLight, number>
export type AnalysisExposureDistribution = Record<Exclude<ExposureStatus, 'none'>, number>

export type AnalysisWeeklyExposureSummary = {
  weekStart: string
  weekLabel: string
  completed: number
  reduced: number
  skipped: number
}

export type AnalysisRollingLoad = RollingLoadWindow<7 | 28>

export type AnalysisPlannedVsActual = {
  planned: number
  open: number
  done: number
  reduced: number
  changed: number
  skipped: number
}

export type AnalysisLoadSpikeAdvisory = {
  ratio: number
  level: 'normal' | 'watch' | 'high'
  message: string
} | null

export type AnalysisDataCoverage = {
  sessions: number
  checkIns: number
  blockLogs: number
  exposureSummaries: number
  metricResults: number
  exerciseResults: number
}

export type TeamAnalysisSummary = {
  rosterSize: number
  sessionCount: number
  weeklySummaries: AnalysisWeeklySummary[]
  trafficDistribution: AnalysisTrafficDistribution
  rolling7dLoad: AnalysisRollingLoad
  rolling28dLoad: AnalysisRollingLoad
  loadSpikeAdvisory: AnalysisLoadSpikeAdvisory
  weeklyExposureSummaries: AnalysisWeeklyExposureSummary[]
  plannedVsActual: AnalysisPlannedVsActual
  dataCoverage: AnalysisDataCoverage
}

export type BuildTeamAnalysisInput = {
  players: Player[]
  sessionDefinitions: SessionDefinition[]
  sessionLogs: SessionLog[]
  entries: PlayerSessionEntry[]
  sessionBlockLogs: SessionBlockLog[]
  exposureSummaries: PlayerExposureSummary[]
  metricResults: MetricResult[]
  exerciseResults: ExerciseResult[]
  filters: AnalysisFilters
}

type WeekBucket = {
  weekStart: string
  sessionCount: number
  rosterSlotCount: number
  presentCount: number
  absentCount: number
  openCount: number
  readinessValues: number[]
  weeklyLoad: number
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`)
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function analysisStartDateForRange(endDate: string, weeks: AnalysisRangeWeeks) {
  const date = parseDateKey(endDate)
  date.setUTCDate(date.getUTCDate() - weeks * 7 + 1)
  return toDateKey(date)
}

function isInDateRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate
}

function weekStartFor(dateKey: string) {
  const date = parseDateKey(dateKey)
  const day = date.getUTCDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diffToMonday)
  return toDateKey(date)
}

function weekLabel(weekStart: string) {
  const [, month, day] = weekStart.split('-')
  return `ab ${day}.${month}.`
}

function emptyTrafficDistribution(): AnalysisTrafficDistribution {
  return { green: 0, yellow: 0, red: 0 }
}

function emptyExposureDistribution(): AnalysisExposureDistribution {
  return { completed: 0, reduced: 0, skipped: 0 }
}

function emptyPlannedVsActual(): AnalysisPlannedVsActual {
  return { planned: 0, open: 0, done: 0, reduced: 0, changed: 0, skipped: 0 }
}

function playerMatchesFilters(player: Player, filters: AnalysisFilters) {
  if (!player.active || player.deletedAt) {
    return false
  }

  if (filters.cluster !== 'all' && player.cluster !== filters.cluster) {
    return false
  }

  if (filters.position !== 'all' && player.position !== filters.position) {
    return false
  }

  return true
}

function getWeekBucket(buckets: Map<string, WeekBucket>, dateKey: string) {
  const weekStart = weekStartFor(dateKey)
  const existing = buckets.get(weekStart)
  if (existing) {
    return existing
  }

  const bucket: WeekBucket = {
    weekStart,
    sessionCount: 0,
    rosterSlotCount: 0,
    presentCount: 0,
    absentCount: 0,
    openCount: 0,
    readinessValues: [],
    weeklyLoad: 0,
  }
  buckets.set(weekStart, bucket)
  return bucket
}

function average(values: number[]) {
  if (values.length === 0) {
    return null
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function roundOne(value: number | null) {
  return value === null ? null : Math.round(value * 10) / 10
}

function statusFromBlockLog(log: SessionBlockLog | undefined): Exclude<SessionBlockStatus, 'planned'> | 'open' {
  return !log || log.status === 'planned' ? 'open' : log.status
}

function buildLoadSpikeAdvisory(
  rolling7dLoad: AnalysisRollingLoad,
  rolling28dLoad: AnalysisRollingLoad,
  firstCoveredDate: string | null,
  endDate: string,
): AnalysisLoadSpikeAdvisory {
  const spike = buildLoadSpikeRatio({
    load7d: rolling7dLoad,
    load28d: rolling28dLoad,
    firstCoveredDate,
    endDate,
  })
  if (!spike) {
    return null
  }

  if (spike.ratio >= 1.5) {
    return {
      ratio: spike.ratio,
      level: 'high',
      message: '7d Load deutlich ueber 28d-Wochenschnitt; Trainingsplanung pruefen.',
    }
  }

  if (spike.ratio >= 1.3) {
    return {
      ratio: spike.ratio,
      level: 'watch',
      message: '7d Load erhoeht gegenueber 28d-Wochenschnitt; Verlauf beobachten.',
    }
  }

  return {
    ratio: spike.ratio,
    level: 'normal',
    message: '7d Load im Rahmen des lokalen 28d-Wochenschnitts.',
  }
}

export function buildTeamAnalysisSummary({
  players,
  sessionDefinitions,
  sessionLogs,
  entries,
  sessionBlockLogs,
  exposureSummaries,
  metricResults,
  exerciseResults,
  filters,
}: BuildTeamAnalysisInput): TeamAnalysisSummary {
  const filteredPlayers = players.filter((player) => playerMatchesFilters(player, filters))
  const filteredPlayerIds = new Set(filteredPlayers.map((player) => player.id))
  const filteredSessionLogs = sessionLogs
    .filter((sessionLog) => !sessionLog.deletedAt && isInDateRange(sessionLog.date, filters.startDate, filters.endDate))
    .sort((a, b) => a.date.localeCompare(b.date))
  const filteredSessionLogIds = new Set(filteredSessionLogs.map((sessionLog) => sessionLog.id))
  const sessionDateById = new Map(filteredSessionLogs.map((sessionLog) => [sessionLog.id, sessionLog.date]))
  const entriesForRange = entries.filter(
    (entry) =>
      !entry.deletedAt &&
      entry.playerId !== null &&
      filteredPlayerIds.has(entry.playerId) &&
      filteredSessionLogIds.has(entry.sessionLogId),
  )
  const entriesBySessionAndPlayer = new Map(
    entriesForRange.map((entry) => [`${entry.sessionLogId}:${entry.playerId}`, entry]),
  )
  const weeklyBuckets = new Map<string, WeekBucket>()

  for (const sessionLog of filteredSessionLogs) {
    const bucket = getWeekBucket(weeklyBuckets, sessionLog.date)
    bucket.sessionCount += 1
    bucket.rosterSlotCount += filteredPlayers.length

    for (const player of filteredPlayers) {
      const entry = entriesBySessionAndPlayer.get(`${sessionLog.id}:${player.id}`) ?? null
      const attendance = entry ? deriveAttendanceStatus(entry) : 'open'
      if (attendance === 'present') {
        bucket.presentCount += 1
      } else if (attendance === 'absent') {
        bucket.absentCount += 1
      } else {
        bucket.openCount += 1
      }

      if (entry?.readiness !== null && entry?.readiness !== undefined) {
        bucket.readinessValues.push(entry.readiness)
      }

      if (entry?.sessionLoad !== null && entry?.sessionLoad !== undefined) {
        bucket.weeklyLoad += entry.sessionLoad
      }
    }
  }

  let previousReadinessAverage: number | null = null
  const weeklySummaries = [...weeklyBuckets.values()]
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map((bucket) => {
      const readinessAverage = roundOne(average(bucket.readinessValues))
      const readinessTrend =
        readinessAverage !== null && previousReadinessAverage !== null
          ? roundOne(readinessAverage - previousReadinessAverage)
          : null

      if (readinessAverage !== null) {
        previousReadinessAverage = readinessAverage
      }

      return {
        weekStart: bucket.weekStart,
        weekLabel: weekLabel(bucket.weekStart),
        sessionCount: bucket.sessionCount,
        rosterSlotCount: bucket.rosterSlotCount,
        presentCount: bucket.presentCount,
        absentCount: bucket.absentCount,
        openCount: bucket.openCount,
        attendanceRate:
          bucket.rosterSlotCount > 0 ? Math.round((bucket.presentCount / bucket.rosterSlotCount) * 100) : null,
        readinessAverage,
        readinessTrend,
        weeklyLoad: bucket.weeklyLoad,
      }
    })

  const trafficDistribution = emptyTrafficDistribution()
  for (const entry of entriesForRange) {
    const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
    if (trafficLight) {
      trafficDistribution[trafficLight] += 1
    }
  }

  const exposureBuckets = new Map<string, AnalysisExposureDistribution>()
  const filteredExposureSummaries = exposureSummaries.filter(
    (summary) =>
      !summary.deletedAt &&
      summary.playerId !== null &&
      filteredPlayerIds.has(summary.playerId) &&
      isInDateRange(summary.sessionDate, filters.startDate, filters.endDate),
  )
  const selectedExposureTypes = filters.exposureType === 'all' ? exposureTypes : [filters.exposureType]
  for (const summary of filteredExposureSummaries) {
    const weekStart = weekStartFor(summary.sessionDate)
    const bucket = exposureBuckets.get(weekStart) ?? emptyExposureDistribution()
    exposureBuckets.set(weekStart, bucket)

    for (const type of selectedExposureTypes) {
      const status = summary.statuses[type]
      if (status !== 'none') {
        bucket[status] += 1
      }
    }
  }
  const weeklyExposureSummaries = [...exposureBuckets.entries()]
    .sort(([weekStartA], [weekStartB]) => weekStartA.localeCompare(weekStartB))
    .map(([weekStart, bucket]) => ({
      weekStart,
      weekLabel: weekLabel(weekStart),
      ...bucket,
    }))

  const definitionById = new Map(sessionDefinitions.map((sessionDefinition) => [sessionDefinition.id, sessionDefinition]))
  const blockLogBySessionAndKey = new Map(
    sessionBlockLogs
      .filter((log) => !log.deletedAt && filteredSessionLogIds.has(log.sessionLogId))
      .map((log) => [`${log.sessionLogId}:${log.blockKey}`, log]),
  )
  const plannedVsActual = emptyPlannedVsActual()

  for (const sessionLog of filteredSessionLogs) {
    const sessionDefinition = definitionById.get(sessionLog.sessionDefinitionId)
    if (!sessionDefinition) {
      continue
    }

    for (const block of sessionDefinition.timeline) {
      plannedVsActual.planned += 1
      const status = statusFromBlockLog(blockLogBySessionAndKey.get(`${sessionLog.id}:${block.key}`))
      plannedVsActual[status] += 1
    }
  }

  const metricResultsForRange = metricResults.filter(
    (result) =>
      !result.deletedAt &&
      result.playerId !== null &&
      filteredPlayerIds.has(result.playerId) &&
      result.sessionLogId !== null &&
      filteredSessionLogIds.has(result.sessionLogId),
  )
  const exerciseResultsForRange = exerciseResults.filter(
    (result) =>
      !result.deletedAt &&
      result.playerId !== null &&
      filteredPlayerIds.has(result.playerId) &&
      result.sessionLogId !== null &&
      filteredSessionLogIds.has(result.sessionLogId),
  )

  const loadPoints = entriesForRange.flatMap((entry) => {
    if (!entry.playerId || !filteredPlayerIds.has(entry.playerId)) {
      return []
    }
    const sessionDate = sessionDateById.get(entry.sessionLogId)
    return sessionDate ? [{ sessionDate, load: entry.sessionLoad }] : []
  })
  const rolling7dLoad = buildRollingLoadFromPoints(loadPoints, filters.endDate, 7)
  const rolling28dLoad = buildRollingLoadFromPoints(loadPoints, filters.endDate, 28)
  const start28d = dateDaysBefore(filters.endDate, 28)
  const firstCoveredLoadDate =
    loadPoints
      .filter((point) => point.load !== null && isInDateRange(point.sessionDate, start28d, filters.endDate))
      .map((point) => point.sessionDate)
      .sort()[0] ?? null

  return {
    rosterSize: filteredPlayers.length,
    sessionCount: filteredSessionLogs.length,
    weeklySummaries,
    trafficDistribution,
    rolling7dLoad,
    rolling28dLoad,
    loadSpikeAdvisory: buildLoadSpikeAdvisory(rolling7dLoad, rolling28dLoad, firstCoveredLoadDate, filters.endDate),
    weeklyExposureSummaries,
    plannedVsActual,
    dataCoverage: {
      sessions: filteredSessionLogs.length,
      checkIns: entriesForRange.length,
      blockLogs: sessionBlockLogs.filter((log) => !log.deletedAt && filteredSessionLogIds.has(log.sessionLogId)).length,
      exposureSummaries: filteredExposureSummaries.length,
      metricResults: metricResultsForRange.length,
      exerciseResults: exerciseResultsForRange.length,
    },
  }
}
