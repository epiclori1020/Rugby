import { describe, expect, it } from 'vitest'
import {
  buildLoadSpikeRatio,
  buildRollingLoadFromPoints,
  dateDaysBefore,
  type LoadAnalysisPoint,
  type RollingLoadWindow,
} from './loadAnalysis'

describe('dateDaysBefore', () => {
  it('returns an inclusive window start', () => {
    expect(dateDaysBefore('2026-06-22', 7)).toBe('2026-06-16')
    expect(dateDaysBefore('2026-06-28', 28)).toBe('2026-06-01')
  })
})

describe('buildRollingLoadFromPoints', () => {
  const points: LoadAnalysisPoint[] = [
    { sessionDate: '2026-06-28', load: 300 },
    { sessionDate: '2026-06-26', load: null },
    { sessionDate: '2026-06-25', load: 300 },
    { sessionDate: '2026-06-20', load: 300 },
    { sessionDate: '2026-06-10', load: 300 },
    { sessionDate: '2026-06-01', load: 300 },
    { sessionDate: '2026-05-20', load: 999 },
  ]

  it('sums only loads inside the window and ignores null loads', () => {
    expect(buildRollingLoadFromPoints(points, '2026-06-28', 7)).toEqual({ days: 7, total: 600, entryCount: 2 })
    expect(buildRollingLoadFromPoints(points, '2026-06-28', 28)).toEqual({ days: 28, total: 1500, entryCount: 5 })
  })

  it('returns null when no load falls inside the window', () => {
    expect(buildRollingLoadFromPoints([{ sessionDate: '2026-05-01', load: 300 }], '2026-06-28', 7)).toBeNull()
    expect(buildRollingLoadFromPoints([{ sessionDate: '2026-06-28', load: null }], '2026-06-28', 7)).toBeNull()
  })
})

describe('buildLoadSpikeRatio', () => {
  const window = (total: number, entryCount: number, days: 7 | 28): RollingLoadWindow => ({ days, total, entryCount })

  it('computes ratio, coveredWeeks and coverageDays for sufficient history', () => {
    expect(
      buildLoadSpikeRatio({
        load7d: window(600, 2, 7),
        load28d: window(1200, 4, 28),
        firstCoveredDate: '2026-06-08',
        endDate: '2026-06-28',
      }),
    ).toEqual({ ratio: 1.5, coveredWeeks: 3, coverageDays: 21 })
  })

  it('returns null when the 28d window has fewer than 4 entries', () => {
    expect(
      buildLoadSpikeRatio({
        load7d: window(600, 2, 7),
        load28d: window(1200, 3, 28),
        firstCoveredDate: '2026-06-08',
        endDate: '2026-06-28',
      }),
    ).toBeNull()
  })

  it('returns null when there is no 7d load', () => {
    expect(
      buildLoadSpikeRatio({
        load7d: null,
        load28d: window(1200, 4, 28),
        firstCoveredDate: '2026-06-08',
        endDate: '2026-06-28',
      }),
    ).toBeNull()
  })

  it('returns null when the 28d load is null or not positive', () => {
    expect(
      buildLoadSpikeRatio({
        load7d: window(600, 2, 7),
        load28d: null,
        firstCoveredDate: '2026-06-08',
        endDate: '2026-06-28',
      }),
    ).toBeNull()
    expect(
      buildLoadSpikeRatio({
        load7d: window(600, 2, 7),
        load28d: window(0, 4, 28),
        firstCoveredDate: '2026-06-08',
        endDate: '2026-06-28',
      }),
    ).toBeNull()
  })

  it('returns null when coverage is shorter than 21 days but accepts exactly 21', () => {
    expect(
      buildLoadSpikeRatio({
        load7d: window(600, 2, 7),
        load28d: window(1200, 4, 28),
        firstCoveredDate: '2026-06-09',
        endDate: '2026-06-28',
      }),
    ).toBeNull()

    expect(
      buildLoadSpikeRatio({
        load7d: window(600, 2, 7),
        load28d: window(1200, 4, 28),
        firstCoveredDate: '2026-06-08',
        endDate: '2026-06-28',
      }),
    ).not.toBeNull()
  })

  it('caps coveredWeeks at 4 for long history', () => {
    expect(
      buildLoadSpikeRatio({
        load7d: window(600, 2, 7),
        load28d: window(1600, 6, 28),
        firstCoveredDate: '2026-06-01',
        endDate: '2026-07-05',
      }),
    ).toEqual({ ratio: 1.5, coveredWeeks: 4, coverageDays: 35 })
  })
})
