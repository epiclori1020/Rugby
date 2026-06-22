import { describe, expect, it } from 'vitest'
import type { PlayerSessionEntry, SessionLog } from './checkIn'
import { emptyCheckInDraft } from './checkIn'
import type { PlayerExposureSummary } from './exposures'
import type { ExerciseResult } from './exercises'
import type { MetricResult } from './metrics'
import type { ReturnerEntry } from './returners'
import { buildPlayerAnalysisSummary } from './playerAnalysis'

const userId = 'user-1'
const playerId = 'player-1'

function sessionLog(id: string, date: string): SessionLog {
  return {
    id,
    userId,
    sessionDefinitionId: id.replace('log', 'session'),
    date,
    status: 'completed',
    coach: '',
    groupSize: null,
    weatherOrHeatNote: '',
    planChanged: false,
    durationMinutes: 75,
    contactIndex: '',
    speedExposureNote: '',
    coachReview: '',
    createdAt: `${date}T18:00:00.000Z`,
    updatedAt: `${date}T20:00:00.000Z`,
    deletedAt: null,
    clientUpdatedAt: `${date}T20:00:00.000Z`,
    syncStatus: 'synced',
    syncError: null,
  }
}

function entry(id: string, sessionLogId: string, overrides: Partial<PlayerSessionEntry> = {}): PlayerSessionEntry {
  return {
    ...emptyCheckInDraft,
    id,
    userId,
    sessionLogId,
    playerId,
    present: true,
    readiness: 4,
    painScore: 1,
    painLocation: '',
    trafficLight: 'green',
    trafficLightSuggestion: 'green',
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
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function exposure(id: string, sessionLogId: string, sessionDate: string): PlayerExposureSummary {
  return {
    id,
    userId,
    playerId,
    sessionLogId,
    sessionDefinitionId: sessionLogId.replace('log', 'session'),
    sessionDate,
    statuses: {
      speed: 'completed',
      acceleration: 'none',
      cod_decel: 'none',
      lower_strength: 'skipped',
      upper_strength: 'none',
      power: 'none',
      conditioning: 'none',
      contact_prep: 'none',
      neck_trunk: 'none',
      mobility: 'none',
      reconditioning: 'none',
    },
    sources: {},
    manualOverrides: {},
    coachNote: '',
    createdAt: `${sessionDate}T18:00:00.000Z`,
    updatedAt: `${sessionDate}T20:00:00.000Z`,
    deletedAt: null,
    clientUpdatedAt: `${sessionDate}T20:00:00.000Z`,
    syncStatus: 'synced',
    syncError: null,
  }
}

function metric(id: string, sessionLogId: string, value: number): MetricResult {
  return {
    id,
    userId,
    playerId,
    sessionLogId,
    metricKey: 'broad_jump',
    value,
    attempt: 1,
    isValid: true,
    bodySide: 'none',
    contextNote: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
  }
}

function exercise(id: string, sessionLogId: string, loadValue: number): ExerciseResult {
  return {
    id,
    userId,
    playerId,
    sessionLogId,
    exerciseKey: 'trap_bar_deadlift',
    variant: 'A',
    sets: 3,
    reps: '5',
    loadValue,
    loadUnit: 'kg',
    rpe: 7,
    rir: null,
    techniqueQuality: 'good',
    painResponse: 'none',
    notes: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
  }
}

function returner(id: string, sessionLogId: string, overrides: Partial<ReturnerEntry> = {}): ReturnerEntry {
  return {
    id,
    userId,
    playerId,
    sessionLogId,
    medicalContactNote: '',
    currentStage: 'gelb',
    speedCap: '3x20 m smooth',
    codDecelCap: 'low',
    conditioningCap: 'bike',
    contactCap: 'none',
    allowedToday: 'non-contact',
    plannedCaps: '',
    completed: 'ja',
    symptomsDuring: 'keine',
    nextMorning: 'ok',
    decision: 'bleiben',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

describe('buildPlayerAnalysisSummary', () => {
  it('builds source-traceable check-in, pain and load histories newest first', () => {
    const summary = buildPlayerAnalysisSummary({
      playerId,
      sessionLogs: [sessionLog('log-1', '2026-06-16'), sessionLog('log-2', '2026-06-18')],
      entries: [
        entry('entry-old', 'log-1', { readiness: 3, painScore: 1, painLocation: 'Knie', sessionRpe: 5, durationMinutes: 70, sessionLoad: 350 }),
        entry('entry-new', 'log-2', { readiness: 2, painScore: 4, postPainLocation: 'Schulter', sessionRpe: 7, durationMinutes: 75, sessionLoad: 525 }),
        entry('deleted', 'log-2', { deletedAt: '2026-06-18T21:00:00.000Z', readiness: 1 }),
      ],
      progressEntries: [],
      returnerEntries: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
    })

    expect(summary.attendance.map((point) => point.recordId)).toEqual(['entry-new', 'entry-old'])
    expect(summary.readiness.map((point) => point.value)).toEqual([2, 3])
    expect(summary.painScores.map((point) => point.value)).toEqual([4, 1])
    expect(summary.painLocations.map((point) => point.value)).toEqual(['Schulter', 'Knie'])
    expect(summary.load.map((point) => point.value.sessionLoad)).toEqual([525, 350])
    expect(summary.load[0]).toMatchObject({
      sessionLogId: 'log-2',
      sessionDefinitionId: 'session-2',
      table: 'player_session_entries',
      correctionTarget: 'nachbereitung',
    })
  })

  it('calculates rolling load windows and groups metric, exercise, exposure and returner histories', () => {
    const summary = buildPlayerAnalysisSummary({
      playerId,
      todayKey: '2026-06-18',
      sessionLogs: [
        sessionLog('log-1', '2026-06-02'),
        sessionLog('log-2', '2026-06-12'),
        sessionLog('log-3', '2026-06-18'),
      ],
      entries: [
        entry('entry-old', 'log-1', { sessionLoad: 300 }),
        entry('entry-mid', 'log-2', { sessionLoad: 400 }),
        entry('entry-new', 'log-3', { sessionLoad: 500 }),
      ],
      progressEntries: [],
      returnerEntries: [returner('returner-1', 'log-3', { currentStage: 'gelb_gruen', decision: 'steigern' })],
      exposureSummaries: [exposure('exposure-1', 'log-3', '2026-06-18')],
      metricResults: [metric('metric-1', 'log-2', 240), metric('metric-2', 'log-3', 246)],
      exerciseResults: [exercise('exercise-1', 'log-2', 90), exercise('exercise-2', 'log-3', 95)],
    })

    expect(summary.rollingLoad).toEqual([
      { label: '7d', total: 900, entryCount: 2 },
      { label: '28d', total: 1200, entryCount: 3 },
    ])
    expect(summary.metricsByKey[0]).toMatchObject({ metricKey: 'broad_jump' })
    expect(summary.metricsByKey[0].points.map((point) => point.value)).toEqual([246, 240])
    expect(summary.exercisesByKey[0]).toMatchObject({ exerciseKey: 'trap_bar_deadlift' })
    expect(summary.exercisesByKey[0].points.map((point) => point.value.loadValue)).toEqual([95, 90])
    expect(summary.exposures[0]).toMatchObject({ recordId: 'exposure-1', correctionTarget: 'nachbereitung' })
    expect(summary.exposureGaps).toContainEqual({ exposureType: 'lower_strength', sessionsSinceSeen: null })
    expect(summary.returner[0]).toMatchObject({
      recordId: 'returner-1',
      correctionTarget: 'returner',
      value: expect.objectContaining({ stage: 'gelb_gruen', decision: 'steigern' }),
    })
    expect(JSON.stringify(summary).toLocaleLowerCase('de-AT')).not.toContain('freigabe')
  })

  it('applies display limits to compact histories', () => {
    const logs = Array.from({ length: 14 }, (_, index) => {
      const day = `${index + 1}`.padStart(2, '0')
      return sessionLog(`log-${day}`, `2026-06-${day}`)
    })
    const summary = buildPlayerAnalysisSummary({
      playerId,
      sessionLogs: logs,
      entries: logs.map((log, index) => entry(`entry-${index}`, log.id, { readiness: index + 1 })),
      progressEntries: [],
      returnerEntries: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
    })

    expect(summary.attendance).toHaveLength(12)
    expect(summary.attendance[0].sessionDate).toBe('2026-06-14')
    expect(summary.readiness).toHaveLength(12)
  })

  it('keeps rolling load based on all local load entries even when display history is limited', () => {
    const logs = Array.from({ length: 14 }, (_, index) => {
      const day = `${index + 1}`.padStart(2, '0')
      return sessionLog(`log-${day}`, `2026-06-${day}`)
    })
    const summary = buildPlayerAnalysisSummary({
      playerId,
      todayKey: '2026-06-14',
      sessionLogs: logs,
      entries: logs.map((log, index) => entry(`entry-${index}`, log.id, { sessionLoad: 100 })),
      progressEntries: [],
      returnerEntries: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
    })

    expect(summary.load).toHaveLength(12)
    expect(summary.rollingLoad).toEqual([
      { label: '7d', total: 700, entryCount: 7 },
      { label: '28d', total: 1400, entryCount: 14 },
    ])
  })

  it('does not fall back to stale session dates when no analysis date is available', () => {
    const summary = buildPlayerAnalysisSummary({
      playerId,
      sessionLogs: [sessionLog('log-1', '2026-06-01')],
      entries: [entry('entry-old', 'log-1', { sessionLoad: 500 })],
      progressEntries: [],
      returnerEntries: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
    })

    expect(summary.rollingLoad).toEqual([
      { label: '7d', total: null, entryCount: 0 },
      { label: '28d', total: null, entryCount: 0 },
    ])
  })

  it('anchors rolling load to the explicit analysis date instead of the last player session', () => {
    const input = {
      playerId,
      todayKey: '2026-06-30',
      sessionLogs: [sessionLog('log-1', '2026-06-01')],
      entries: [entry('entry-old', 'log-1', { sessionLoad: 500 })],
      progressEntries: [],
      returnerEntries: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
    } as Parameters<typeof buildPlayerAnalysisSummary>[0] & { todayKey: string }

    const summary = buildPlayerAnalysisSummary(input)

    expect(summary.rollingLoad).toEqual([
      { label: '7d', total: null, entryCount: 0 },
      { label: '28d', total: null, entryCount: 0 },
    ])
  })
})
