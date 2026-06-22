export type LoadAnalysisPoint = {
  sessionDate: string
  load: number | null
}

export type RollingLoadWindow<TDays extends number = number> = {
  days: TDays
  total: number
  entryCount: number
} | null

export type LoadSpikeRatioInput<TDays extends number = number> = {
  load7d: RollingLoadWindow<TDays>
  load28d: RollingLoadWindow<TDays>
  firstCoveredDate: string | null
  endDate: string
}

export type LoadSpikeRatio = {
  ratio: number
  coveredWeeks: number
  coverageDays: number
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`)
}

export function dateDaysBefore(endDate: string, days: number) {
  const date = parseDateKey(endDate)
  date.setUTCDate(date.getUTCDate() - days + 1)
  return date.toISOString().slice(0, 10)
}

export function buildRollingLoadFromPoints<TDays extends number>(
  points: LoadAnalysisPoint[],
  endDate: string,
  days: TDays,
): RollingLoadWindow<TDays> {
  const startDate = dateDaysBefore(endDate, days)
  const pointsInRange = points.filter(
    (point) => point.load !== null && point.sessionDate >= startDate && point.sessionDate <= endDate,
  )

  if (pointsInRange.length === 0) {
    return null
  }

  return {
    days,
    total: pointsInRange.reduce((total, point) => total + (point.load ?? 0), 0),
    entryCount: pointsInRange.length,
  }
}

export function buildLoadSpikeRatio({
  load7d,
  load28d,
  firstCoveredDate,
  endDate,
}: LoadSpikeRatioInput): LoadSpikeRatio | null {
  if (!load7d || !load28d || !firstCoveredDate || load28d.entryCount < 4 || load7d.entryCount === 0 || load28d.total <= 0) {
    return null
  }

  const coverageDays = Math.floor((parseDateKey(endDate).getTime() - parseDateKey(firstCoveredDate).getTime()) / 86_400_000) + 1
  if (coverageDays < 21) {
    return null
  }

  const coveredWeeks = Math.min(4, Math.max(1, coverageDays / 7))
  return {
    ratio: Math.round((load7d.total / (load28d.total / coveredWeeks)) * 100) / 100,
    coveredWeeks,
    coverageDays,
  }
}
