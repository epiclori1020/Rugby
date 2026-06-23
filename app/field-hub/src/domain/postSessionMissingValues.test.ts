import { describe, expect, it } from 'vitest'
import type { MetricResult } from './metrics'
import { emptyCheckInDraft, type PlayerSessionEntry, type SessionLog } from './checkIn'
import type { Player } from './players'
import type { ProgressEntry } from './postSession'
import { deriveMissingPostSessionValues } from './postSessionMissingValues'

const userId = 'user-1'

function player(id: string, name: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    userId,
    name,
    position: 'Back Row',
    cluster: 'back_row',
    active: true,
    consentStatus: 'vorhanden',
    photoConsentStatus: 'not_asked',
    photoPath: null,
    photoUpdatedAt: null,
    returnerStatus: 'nein',
    notes: '',
    createdAt: '2026-06-18T18:00:00.000Z',
    updatedAt: '2026-06-18T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-18T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function sessionLog(overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    id: 'log-1',
    userId,
    sessionDefinitionId: 'session-1',
    date: '2026-06-18',
    status: 'completed',
    coach: '',
    groupSize: null,
    weatherOrHeatNote: '',
    planChanged: false,
    durationMinutes: 75,
    contactIndex: '',
    speedExposureNote: '',
    coachReview: '',
    createdAt: '2026-06-18T18:00:00.000Z',
    updatedAt: '2026-06-18T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-18T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function entry(playerId: string, overrides: Partial<PlayerSessionEntry> = {}): PlayerSessionEntry {
  return {
    ...emptyCheckInDraft,
    id: `entry-${playerId}`,
    userId,
    sessionLogId: 'log-1',
    playerId,
    present: true,
    readiness: 4,
    painScore: 0,
    trafficLight: 'green',
    trafficLightSuggestion: 'green',
    sessionRpe: 6,
    durationMinutes: 75,
    sessionLoad: 450,
    postPainScore: 0,
    postPainLocation: '',
    e2Decision: 'normal',
    nextStep: 'halten',
    checkInSource: 'coach',
    playerSubmittedAt: null,
    coachEditedAt: '2026-06-18T18:10:00.000Z',
    playerNote: '',
    createdAt: '2026-06-18T18:00:00.000Z',
    updatedAt: '2026-06-18T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-18T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function progress(playerId: string, overrides: Partial<ProgressEntry> = {}): ProgressEntry {
  return {
    id: `progress-${playerId}`,
    userId,
    playerId,
    sessionLogId: 'log-1',
    mainExercise: '',
    load: '',
    reps: '',
    rpe: '',
    powerOrSprint: '',
    conditioning: '',
    note: '',
    createdAt: '2026-06-18T18:00:00.000Z',
    updatedAt: '2026-06-18T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-18T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function metric(playerId: string, metricKey: MetricResult['metricKey'], value: number): MetricResult {
  return {
    id: `metric-${playerId}-${metricKey}`,
    userId,
    playerId,
    sessionLogId: 'log-1',
    metricKey,
    value,
    attempt: 1,
    isValid: true,
    bodySide: 'none',
    contextNote: '',
    createdAt: '2026-06-18T18:00:00.000Z',
    updatedAt: '2026-06-18T20:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-18T20:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
  }
}

describe('deriveMissingPostSessionValues', () => {
  it('returns required player-specific rows for missing sRPE, post-pain and E2/Next Step', () => {
    const max = player('player-1', 'Max')
    const result = deriveMissingPostSessionValues({
      activePlayers: [max],
      sessionLog: sessionLog({ durationMinutes: null }),
      sessionType: 'training',
      entries: [
        entry(max.id, {
          sessionRpe: null,
          painScore: 3,
          postPainScore: null,
          trafficLight: 'yellow',
          e2Decision: null,
          nextStep: null,
        }),
      ],
      progressEntries: [],
      metricResults: [],
      lastExportAt: '2026-06-18T21:00:00.000Z',
    })

    expect(result.map((item) => item.kind)).toEqual([
      'missing_duration',
      'missing_srpe',
      'missing_post_pain',
      'missing_e2',
      'missing_next_step',
    ])
    expect(result.every((item) => item.severity === 'required')).toBe(true)
    expect(result.find((item) => item.kind === 'missing_srpe')).toMatchObject({
      playerId: max.id,
      playerName: 'Max',
      target: 'post_session',
      fieldKey: 'sessionRpe',
    })
  })

  it('ignores absent players and creates expected progression rows only when relevant', () => {
    const max = player('player-1', 'Max')
    const tina = player('player-2', 'Tina')
    const result = deriveMissingPostSessionValues({
      activePlayers: [max, tina],
      sessionLog: sessionLog(),
      sessionType: 'training',
      entries: [
        entry(max.id, { present: false, sessionRpe: null }),
        entry(tina.id, { e2Decision: 'kein_sprint', nextStep: 'halten' }),
      ],
      progressEntries: [progress(tina.id)],
      metricResults: [],
      lastExportAt: '2026-06-18T21:00:00.000Z',
    })

    expect(result.find((item) => item.kind === 'missing_srpe')).toBeUndefined()
    expect(result).toContainEqual(
      expect.objectContaining({
        kind: 'missing_progression',
        severity: 'expected',
        playerId: tina.id,
      }),
    )
  })

  it('suggests active baseline metrics in baseline sessions without requiring 30m or MABU', () => {
    const max = player('player-1', 'Max')
    const result = deriveMissingPostSessionValues({
      activePlayers: [max],
      sessionLog: sessionLog(),
      sessionType: 'baseline',
      entries: [entry(max.id)],
      progressEntries: [],
      metricResults: [metric(max.id, 'broad_jump', 245)],
      lastExportAt: '2026-06-18T21:00:00.000Z',
    })

    const metricKeys = result.filter((item) => item.kind === 'missing_metric').map((item) => item.metricKey)

    expect(metricKeys).toEqual(['med_ball_chest_pass', 'sprint_10m'])
    expect(metricKeys).not.toContain('sprint_30m')
    expect(metricKeys).not.toContain('mabu')
    expect(result.filter((item) => item.kind === 'missing_metric').every((item) => item.severity === 'optional')).toBe(true)
  })
})
