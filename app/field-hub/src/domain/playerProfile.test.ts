import { describe, expect, it } from 'vitest'
import type { BaselineEntry } from './baseline'
import type { PlayerSessionEntry, SessionLog } from './checkIn'
import { emptyCheckInDraft } from './checkIn'
import type { PlayerExposureSummary } from './exposures'
import type { ExerciseResult } from './exercises'
import type { MetricResult } from './metrics'
import type { Player } from './players'
import type { ProgressEntry } from './postSession'
import type { ReturnerEntry } from './returners'
import { buildPlayerProfileSummary } from './playerProfile'

const userId = 'user-1'

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
    clientUpdatedAt: '2026-06-16T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

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

function progress(overrides: Partial<ProgressEntry> = {}): ProgressEntry {
  return {
    id: 'progress-1',
    userId,
    playerId: 'player-1',
    sessionLogId: 'log-1',
    mainExercise: 'Trap Bar Deadlift',
    load: '90 kg',
    reps: '3x5',
    rpe: '7',
    powerOrSprint: '',
    conditioning: '',
    note: 'Sauber',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function baseline(overrides: Partial<BaselineEntry> = {}): BaselineEntry {
  return {
    id: 'baseline-1',
    userId,
    playerId: 'player-1',
    sessionLogId: 'log-1',
    broadJumpCm: 240,
    medBallChestPassM: 6.1,
    medBallWeightKg: 5,
    sprint30m: null,
    note: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function returner(overrides: Partial<ReturnerEntry> = {}): ReturnerEntry {
  return {
    id: 'returner-1',
    userId,
    playerId: 'player-1',
    sessionLogId: 'log-1',
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

function exposure(overrides: Partial<PlayerExposureSummary> = {}): PlayerExposureSummary {
  return {
    id: 'exposure-1',
    userId,
    playerId: 'player-1',
    sessionLogId: 'log-1',
    sessionDefinitionId: 'session-1',
    sessionDate: '2026-06-16',
    statuses: {
      speed: 'completed',
      acceleration: 'completed',
      cod_decel: 'none',
      lower_strength: 'none',
      upper_strength: 'none',
      power: 'none',
      conditioning: 'reduced',
      contact_prep: 'skipped',
      neck_trunk: 'none',
      mobility: 'none',
      reconditioning: 'none',
    },
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
    value: 246,
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

function exerciseResult(overrides: Partial<ExerciseResult> = {}): ExerciseResult {
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

describe('buildPlayerProfileSummary', () => {
  it('uses the latest player session as compact profile headline data', () => {
    const summary = buildPlayerProfileSummary({
      player: player(),
      sessionLogs: [sessionLog('log-1', '2026-06-16'), sessionLog('log-2', '2026-06-18')],
      entries: [
        entry({ id: 'entry-old', sessionLogId: 'log-1', readiness: 3, painScore: 1, trafficLight: 'green' }),
        entry({
          id: 'entry-new',
          sessionLogId: 'log-2',
          readiness: 2,
          painScore: 4,
          trafficLight: 'yellow',
          checkInSource: 'player_kiosk',
          sessionRpe: 7,
          durationMinutes: 75,
          sessionLoad: 525,
        }),
      ],
      baselineEntries: [],
      progressEntries: [],
      returnerEntries: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [],
    })

    expect(summary.latestSession).toMatchObject({
      sessionDate: '2026-06-18',
      attendanceStatus: 'present',
      readiness: 2,
      painScore: 4,
      trafficLight: 'yellow',
      source: 'player_kiosk',
    })
    expect(summary.latestLoad).toMatchObject({ sessionRpe: 7, durationMinutes: 75, sessionLoad: 525 })
  })

  it('collects latest baseline, progression, returner and open issue summaries without medical clearance wording', () => {
    const summary = buildPlayerProfileSummary({
      player: player({ returnerStatus: 'ja' }),
      sessionLogs: [sessionLog('log-1', '2026-06-16')],
      entries: [
        entry({
          sessionLogId: 'log-1',
          trafficLight: 'red',
          redFlag: 'head_neck_neuro',
          movementConcern: true,
          limits: ['physio', 'klaeren'],
          postPainScore: 5,
          e2Decision: 'physio',
          nextStep: 'klaeren',
        }),
      ],
      baselineEntries: [baseline()],
      progressEntries: [progress()],
      returnerEntries: [returner()],
      exposureSummaries: [exposure()],
      metricResults: [metric()],
      exerciseResults: [exerciseResult()],
    })

    expect(summary.openIssues.severity).toBe('red')
    expect(summary.openIssues.items).toEqual(
      expect.arrayContaining([
        'Ampel Rot',
        'Red Flag: Kopf/Nacken/neurologisch oder Instabilitaet',
        'Movement Concern',
        'Limits: physio, klaeren',
        'Post-Pain 5/10',
        'E2: physio',
        'Next Step: klaeren',
      ]),
    )
    expect(summary.latestBaseline).toMatchObject({ sessionDate: '2026-06-16', broadJumpCm: 240 })
    expect(summary.latestProgression).toMatchObject({ sessionDate: '2026-06-16', mainExercise: 'Trap Bar Deadlift' })
    expect(summary.latestReturner).toMatchObject({ sessionDate: '2026-06-16', speedCap: '3x20 m smooth' })
    expect(summary.recentExposures).toHaveLength(1)
    expect(summary.recentExposures[0].statuses.speed).toBe('completed')
    expect(summary.recentMetrics).toMatchObject([{ sessionDate: '2026-06-16', metricKey: 'broad_jump', value: 246 }])
    expect(summary.recentExerciseResults).toMatchObject([
      { sessionDate: '2026-06-16', exerciseKey: 'trap_bar_deadlift', loadValue: 90 },
    ])
    expect(summary.analysis).toMatchObject({
      readiness: [{ sessionDate: '2026-06-16', value: 4, table: 'player_session_entries' }],
      metricsByKey: [{ metricKey: 'broad_jump' }],
      exercisesByKey: [{ exerciseKey: 'trap_bar_deadlift' }],
    })
    expect(JSON.stringify(summary).toLocaleLowerCase('de-AT')).not.toContain('freigabe')
  })

  it('sorts recent exposure summaries newest first and ignores deleted exposure rows', () => {
    const summary = buildPlayerProfileSummary({
      player: player(),
      sessionLogs: [sessionLog('log-1', '2026-06-16'), sessionLog('log-2', '2026-06-18')],
      entries: [],
      baselineEntries: [],
      progressEntries: [],
      returnerEntries: [],
      exposureSummaries: [
        exposure({ id: 'old', sessionLogId: 'log-1', sessionDate: '2026-06-16' }),
        exposure({ id: 'new', sessionLogId: 'log-2', sessionDate: '2026-06-18' }),
        exposure({ id: 'deleted', sessionLogId: 'log-2', deletedAt: '2026-06-18T21:00:00.000Z' }),
      ],
      metricResults: [],
      exerciseResults: [],
    })

    expect(summary.recentExposures.map((item) => item.id)).toEqual(['new', 'old'])
  })

  it('sorts recent metric results newest first and ignores deleted metric rows', () => {
    const summary = buildPlayerProfileSummary({
      player: player(),
      sessionLogs: [sessionLog('log-1', '2026-06-16'), sessionLog('log-2', '2026-06-18')],
      entries: [],
      baselineEntries: [baseline()],
      progressEntries: [],
      returnerEntries: [],
      exposureSummaries: [],
      metricResults: [
        metric({ id: 'old', sessionLogId: 'log-1', value: 240 }),
        metric({ id: 'new', sessionLogId: 'log-2', metricKey: 'sprint_10m', value: 1.81 }),
        metric({ id: 'deleted', sessionLogId: 'log-2', deletedAt: '2026-06-18T21:00:00.000Z' }),
      ],
      exerciseResults: [],
    })

    expect(summary.latestBaseline).toMatchObject({ broadJumpCm: 240 })
    expect(summary.recentMetrics.map((item) => item.id)).toEqual(['new', 'old'])
  })

  it('sorts recent exercise results newest first and ignores deleted exercise rows', () => {
    const summary = buildPlayerProfileSummary({
      player: player(),
      sessionLogs: [sessionLog('log-1', '2026-06-16'), sessionLog('log-2', '2026-06-18')],
      entries: [],
      baselineEntries: [],
      progressEntries: [],
      returnerEntries: [],
      exposureSummaries: [],
      metricResults: [],
      exerciseResults: [
        exerciseResult({ id: 'old', sessionLogId: 'log-1', loadValue: 90 }),
        exerciseResult({ id: 'new', sessionLogId: 'log-2', loadValue: 95 }),
        exerciseResult({ id: 'deleted', sessionLogId: 'log-2', deletedAt: '2026-06-18T21:00:00.000Z' }),
      ],
    })

    expect(summary.recentExerciseResults.map((item) => item.id)).toEqual(['new', 'old'])
  })
})
