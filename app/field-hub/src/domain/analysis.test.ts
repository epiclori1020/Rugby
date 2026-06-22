import { describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import { emptyCheckInDraft, type PlayerSessionEntry, type SessionLog } from './checkIn'
import { createEmptyExposureStatuses, type PlayerExposureSummary } from './exposures'
import type { ExerciseResult } from './exercises'
import type { MetricResult } from './metrics'
import type { Player } from './players'
import type { SessionBlockLog } from './sessionBlocks'
import { analysisStartDateForRange, buildTeamAnalysisSummary, type AnalysisFilters } from './analysis'

const userId = 'user-1'

const defaultFilters: AnalysisFilters = {
  startDate: '2026-06-01',
  endDate: '2026-06-28',
  cluster: 'all',
  position: 'all',
  exposureType: 'all',
}

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    userId,
    name: 'Max Muster',
    position: 'Back Row',
    cluster: 'back_row',
    active: true,
    consentStatus: 'vorhanden',
    photoConsentStatus: 'not_asked',
    photoPath: null,
    photoUpdatedAt: null,
    returnerStatus: 'nein',
    notes: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function sessionLog(id: string, date: string, overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    id,
    userId,
    sessionDefinitionId: `session-${id}`,
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
    ...overrides,
  }
}

function entry(overrides: Partial<PlayerSessionEntry> = {}): PlayerSessionEntry {
  return {
    ...emptyCheckInDraft,
    id: 'entry-1',
    userId,
    sessionLogId: 'log-1',
    playerId: 'player-1',
    present: true,
    readiness: 4,
    painScore: 1,
    trafficLight: 'green',
    trafficLightSuggestion: 'green',
    sessionRpe: 5,
    durationMinutes: 70,
    sessionLoad: 350,
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

function sessionDefinition(sessionLogId: string): SessionDefinition {
  return {
    id: `session-${sessionLogId}`,
    date: '2026-06-16',
    kw: 'KW25',
    title: `Session ${sessionLogId}`,
    type: 'training',
    summary: '',
    primarySource: '',
    pdfRefs: [],
    goals: [],
    timeline: [
      { key: 'prep', order: 1, time: '0-10', title: 'Prep', work: 'RAMP', exposureTags: ['mobility'] },
      { key: 'speed', order: 2, time: '10-20', title: 'Speed', work: 'Accel', exposureTags: ['speed'] },
    ],
    materials: [],
    safetyNotes: [],
    coachNotes: [],
    libraryRefs: [],
  }
}

function blockLog(overrides: Partial<SessionBlockLog> = {}): SessionBlockLog {
  return {
    id: 'block-log-1',
    userId,
    sessionLogId: 'log-1',
    sessionDefinitionId: 'session-log-1',
    blockKey: 'prep',
    blockTitle: 'Prep',
    blockOrder: 1,
    plannedTime: '0-10',
    plannedWork: 'RAMP',
    status: 'done',
    reason: 'none',
    coachNote: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function exposure(overrides: Partial<PlayerExposureSummary> = {}): PlayerExposureSummary {
  return {
    id: 'exposure-1',
    userId,
    playerId: 'player-1',
    sessionLogId: 'log-1',
    sessionDefinitionId: 'session-log-1',
    sessionDate: '2026-06-16',
    statuses: { ...createEmptyExposureStatuses(), speed: 'completed', contact_prep: 'reduced' },
    sources: {},
    manualOverrides: {},
    coachNote: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function metric(overrides: Partial<MetricResult> = {}): MetricResult {
  return {
    id: 'metric-1',
    userId,
    playerId: 'player-1',
    sessionLogId: 'log-1',
    metricKey: 'broad_jump',
    value: 240,
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
    ...overrides,
  }
}

function exercise(overrides: Partial<ExerciseResult> = {}): ExerciseResult {
  return {
    id: 'exercise-1',
    userId,
    playerId: 'player-1',
    sessionLogId: 'log-1',
    exerciseKey: 'trap_bar_deadlift',
    variant: 'A',
    sets: 3,
    reps: '5',
    loadValue: 90,
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
    ...overrides,
  }
}

describe('team analysis', () => {
  it('derives an empty team summary from empty local data', () => {
    const summary = buildTeamAnalysisSummary({
      players: [],
      sessionDefinitions: [],
      sessionLogs: [],
      entries: [],
      sessionBlockLogs: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
      filters: { ...defaultFilters, endDate: '2026-06-22' },
    })

    expect(summary.rosterSize).toBe(0)
    expect(summary.sessionCount).toBe(0)
    expect(summary.weeklySummaries).toEqual([])
    expect(summary.rolling7dLoad).toBeNull()
    expect(summary.dataCoverage).toEqual({
      sessions: 0,
      checkIns: 0,
      blockLogs: 0,
      exposureSummaries: 0,
      metricResults: 0,
      exerciseResults: 0,
    })
  })

  it('groups attendance, readiness, traffic lights and load by week with current roster denominator', () => {
    const players = [
      player({ id: 'player-1', cluster: 'back_row', position: 'Back Row' }),
      player({ id: 'player-2', cluster: 'back_row', position: 'Back Row' }),
    ]
    const sessionLogs = [sessionLog('log-1', '2026-06-16'), sessionLog('log-2', '2026-06-23')]
    const summary = buildTeamAnalysisSummary({
      players,
      sessionDefinitions: [sessionDefinition('log-1'), sessionDefinition('log-2')],
      sessionLogs,
      entries: [
        entry({ id: 'entry-1', sessionLogId: 'log-1', playerId: 'player-1', readiness: 4, sessionLoad: 350 }),
        entry({
          id: 'entry-2',
          sessionLogId: 'log-1',
          playerId: 'player-2',
          present: false,
          readiness: 2,
          trafficLight: 'yellow',
          coachEditedAt: '2026-06-16T18:10:00.000Z',
          sessionLoad: null,
        }),
        entry({
          id: 'entry-3',
          sessionLogId: 'log-2',
          playerId: 'player-1',
          readiness: 5,
          trafficLight: 'green',
          sessionLoad: 400,
        }),
      ],
      sessionBlockLogs: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
      filters: defaultFilters,
    })

    expect(summary.weeklySummaries).toMatchObject([
      {
        weekStart: '2026-06-15',
        sessionCount: 1,
        rosterSlotCount: 2,
        presentCount: 1,
        absentCount: 1,
        openCount: 0,
        attendanceRate: 50,
        readinessAverage: 3,
        readinessTrend: null,
        weeklyLoad: 350,
      },
      {
        weekStart: '2026-06-22',
        sessionCount: 1,
        rosterSlotCount: 2,
        presentCount: 1,
        absentCount: 0,
        openCount: 1,
        attendanceRate: 50,
        readinessAverage: 5,
        readinessTrend: 2,
        weeklyLoad: 400,
      },
    ])
    expect(summary.trafficDistribution).toEqual({ green: 2, yellow: 1, red: 0 })
    expect(summary.rolling7dLoad).toEqual({ days: 7, total: 400, entryCount: 1 })
    expect(summary.rolling28dLoad).toEqual({ days: 28, total: 750, entryCount: 2 })
    expect(summary.loadSpikeAdvisory).toBeNull()
  })

  it('flags simple load spikes when enough local load coverage exists', () => {
    const sessionLogs = [
      sessionLog('log-1', '2026-06-02'),
      sessionLog('log-2', '2026-06-09'),
      sessionLog('log-3', '2026-06-16'),
      sessionLog('log-4', '2026-06-23'),
    ]
    const summary = buildTeamAnalysisSummary({
      players: [player()],
      sessionDefinitions: sessionLogs.map((log) => sessionDefinition(log.id)),
      sessionLogs,
      entries: [
        entry({ id: 'entry-1', sessionLogId: 'log-1', sessionLoad: 200 }),
        entry({ id: 'entry-2', sessionLogId: 'log-2', sessionLoad: 200 }),
        entry({ id: 'entry-3', sessionLogId: 'log-3', sessionLoad: 200 }),
        entry({ id: 'entry-4', sessionLogId: 'log-4', sessionLoad: 600 }),
      ],
      sessionBlockLogs: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
      filters: defaultFilters,
    })

    expect(summary.rolling7dLoad).toEqual({ days: 7, total: 600, entryCount: 1 })
    expect(summary.rolling28dLoad).toEqual({ days: 28, total: 1200, entryCount: 4 })
    expect(summary.loadSpikeAdvisory).toMatchObject({
      ratio: 1.93,
      level: 'high',
    })
  })

  it('does not flag load spikes before 21 days of local load coverage exist', () => {
    const sessionLogs = [
      sessionLog('log-1', '2026-06-16'),
      sessionLog('log-2', '2026-06-18'),
      sessionLog('log-3', '2026-06-20'),
      sessionLog('log-4', '2026-06-22'),
    ]
    const summary = buildTeamAnalysisSummary({
      players: [player()],
      sessionDefinitions: sessionLogs.map((log) => sessionDefinition(log.id)),
      sessionLogs,
      entries: [
        entry({ id: 'entry-1', sessionLogId: 'log-1', sessionLoad: 200 }),
        entry({ id: 'entry-2', sessionLogId: 'log-2', sessionLoad: 200 }),
        entry({ id: 'entry-3', sessionLogId: 'log-3', sessionLoad: 200 }),
        entry({ id: 'entry-4', sessionLogId: 'log-4', sessionLoad: 600 }),
      ],
      sessionBlockLogs: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
      filters: { ...defaultFilters, endDate: '2026-06-22' },
    })

    expect(summary.rolling7dLoad).toEqual({ days: 7, total: 1200, entryCount: 4 })
    expect(summary.rolling28dLoad).toEqual({ days: 28, total: 1200, entryCount: 4 })
    expect(summary.loadSpikeAdvisory).toBeNull()
  })

  it('applies cluster, position and exposure filters and ignores deleted or inactive rows', () => {
    const players = [
      player({ id: 'player-1', cluster: 'back_row', position: 'Back Row' }),
      player({ id: 'player-2', cluster: 'centres', position: 'Centre' }),
      player({ id: 'player-3', cluster: 'back_row', position: 'Back Row', active: false }),
    ]
    const summary = buildTeamAnalysisSummary({
      players,
      sessionDefinitions: [sessionDefinition('log-1')],
      sessionLogs: [sessionLog('log-1', '2026-06-16')],
      entries: [
        entry({ id: 'included', playerId: 'player-1' }),
        entry({ id: 'wrong-position', playerId: 'player-2', trafficLight: 'red' }),
        entry({ id: 'inactive', playerId: 'player-3', trafficLight: 'yellow' }),
        entry({ id: 'deleted', playerId: 'player-1', deletedAt: '2026-06-16T21:00:00.000Z' }),
        entry({ id: 'null-player', playerId: null }),
      ],
      sessionBlockLogs: [blockLog()],
      exposureSummaries: [
        exposure({ id: 'included', playerId: 'player-1' }),
        exposure({ id: 'filtered-type', playerId: 'player-1', statuses: { ...createEmptyExposureStatuses(), speed: 'completed' } }),
        exposure({ id: 'wrong-player', playerId: 'player-2' }),
        exposure({ id: 'deleted', playerId: 'player-1', deletedAt: '2026-06-16T21:00:00.000Z' }),
      ],
      metricResults: [metric(), metric({ id: 'deleted-metric', deletedAt: '2026-06-16T21:00:00.000Z' })],
      exerciseResults: [exercise(), exercise({ id: 'wrong-player-exercise', playerId: 'player-2' })],
      filters: {
        ...defaultFilters,
        cluster: 'back_row',
        position: 'Back Row',
        exposureType: 'contact_prep',
      },
    })

    expect(summary.rosterSize).toBe(1)
    expect(summary.dataCoverage.checkIns).toBe(1)
    expect(summary.trafficDistribution).toEqual({ green: 1, yellow: 0, red: 0 })
    expect(summary.weeklyExposureSummaries).toMatchObject([{ completed: 0, reduced: 1, skipped: 0 }])
    expect(summary.dataCoverage).toMatchObject({
      blockLogs: 1,
      exposureSummaries: 2,
      metricResults: 1,
      exerciseResults: 1,
    })
  })

  it('counts static planned blocks and treats missing or planned block logs as open', () => {
    const summary = buildTeamAnalysisSummary({
      players: [player()],
      sessionDefinitions: [sessionDefinition('log-1')],
      sessionLogs: [sessionLog('log-1', '2026-06-16')],
      entries: [],
      sessionBlockLogs: [
        blockLog({ blockKey: 'prep', status: 'planned' }),
        blockLog({ id: 'deleted-block', blockKey: 'speed', status: 'skipped', deletedAt: '2026-06-16T21:00:00.000Z' }),
      ],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
      filters: defaultFilters,
    })

    expect(summary.plannedVsActual).toEqual({
      planned: 2,
      open: 2,
      done: 0,
      reduced: 0,
      changed: 0,
      skipped: 0,
    })
  })

  it('calculates the bounded default start date for range presets', () => {
    expect(analysisStartDateForRange('2026-06-28', 4)).toBe('2026-06-01')
    expect(analysisStartDateForRange('2026-06-28', 8)).toBe('2026-05-04')
  })
})
