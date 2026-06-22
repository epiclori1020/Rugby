import { describe, expect, it } from 'vitest'
import type { BaselineEntry } from './baseline'
import type { PlayerSessionEntry, SessionLog } from './checkIn'
import { emptyCheckInDraft } from './checkIn'
import type { Player } from './players'
import type { ProgressEntry } from './postSession'
import {
  derivePostSessionCompletion,
  findLatestRelevantPostSessionWork,
} from './postSessionCompletion'

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
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T18:00:00.000Z',
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
    status: 'planned',
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
    painScore: 1,
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
    mainExercise: 'Trap Bar Deadlift',
    load: '90 kg',
    reps: '3x5',
    rpe: '7',
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

function baseline(playerId: string, overrides: Partial<BaselineEntry> = {}): BaselineEntry {
  return {
    id: `baseline-${playerId}`,
    userId,
    playerId,
    sessionLogId: 'log-1',
    broadJumpCm: 240,
    medBallChestPassM: null,
    medBallWeightKg: null,
    sprint30m: null,
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

describe('derivePostSessionCompletion', () => {
  it('marks missing hard post-session documentation as partially complete', () => {
    const max = player('player-1', 'Max')
    const tina = player('player-2', 'Tina', { returnerStatus: 'ja' })
    const result = derivePostSessionCompletion({
      activePlayers: [max, tina],
      sessionLog: sessionLog(),
      sessionType: 'training',
      entries: [
        entry(max.id, { sessionRpe: null }),
        entry(tina.id, {
          trafficLight: 'yellow',
          returnerFlag: 'ja',
          limits: ['kein_sprint'],
          postPainScore: null,
          e2Decision: null,
          nextStep: null,
        }),
      ],
      progressEntries: [],
      baselineEntries: [],
      lastExportAt: null,
    })

    expect(result.status).toBe('teilweise_abgeschlossen')
    expect(result.blockers.map((item) => item.kind)).toEqual(
      expect.arrayContaining(['session_status', 'missing_srpe', 'missing_post_pain', 'missing_e2_next_step']),
    )
    expect(result.blockers.find((item) => item.kind === 'missing_srpe')?.playerNames).toContain('Max')
    expect(result.blockers.find((item) => item.kind === 'missing_e2_next_step')?.playerNames).toContain('Tina')
  })

  it('keeps progression and optional baseline gaps advisory so field closure is not over-blocked', () => {
    const max = player('player-1', 'Max')
    const result = derivePostSessionCompletion({
      activePlayers: [max],
      sessionLog: sessionLog({ status: 'completed' }),
      sessionType: 'baseline',
      entries: [entry(max.id, { e2Decision: 'kein_sprint', nextStep: 'halten' })],
      progressEntries: [],
      baselineEntries: [],
      lastExportAt: '2026-06-18T19:00:00.000Z',
    })

    expect(result.status).toBe('abgeschlossen')
    expect(result.blockers).toEqual([])
    expect(result.advisories.map((item) => item.kind)).toEqual(
      expect.arrayContaining(['progression_advisory', 'baseline_advisory', 'backup_export']),
    )
  })

  it('returns abgeschlossen when hard documentation is complete and export is current', () => {
    const max = player('player-1', 'Max')
    const result = derivePostSessionCompletion({
      activePlayers: [max],
      sessionLog: sessionLog({ status: 'completed' }),
      sessionType: 'training',
      entries: [entry(max.id)],
      progressEntries: [progress(max.id)],
      baselineEntries: [baseline(max.id)],
      lastExportAt: '2026-06-18T21:00:00.000Z',
    })

    expect(result.status).toBe('abgeschlossen')
    expect(result.blockers).toEqual([])
    expect(result.needsBackupExport).toBe(false)
  })

  it('requires post-pain when a player had pre-session pain even without a yellow traffic light', () => {
    const max = player('player-1', 'Max')
    const result = derivePostSessionCompletion({
      activePlayers: [max],
      sessionLog: sessionLog({ status: 'completed' }),
      sessionType: 'training',
      entries: [
        entry(max.id, {
          painScore: 1,
          postPainScore: null,
          trafficLight: 'green',
          trafficLightSuggestion: 'green',
          e2Decision: 'normal',
          nextStep: 'halten',
        }),
      ],
      progressEntries: [],
      baselineEntries: [],
      lastExportAt: '2026-06-18T21:00:00.000Z',
    })

    expect(result.status).toBe('teilweise_abgeschlossen')
    expect(result.blockers.find((item) => item.kind === 'missing_post_pain')?.playerNames).toContain('Max')
  })

  it('requires a next step when E2 is not normal', () => {
    const max = player('player-1', 'Max')
    const result = derivePostSessionCompletion({
      activePlayers: [max],
      sessionLog: sessionLog({ status: 'completed' }),
      sessionType: 'training',
      entries: [
        entry(max.id, {
          painScore: 0,
          postPainScore: 0,
          trafficLight: 'green',
          trafficLightSuggestion: 'green',
          e2Decision: 'kein_sprint',
          nextStep: null,
        }),
      ],
      progressEntries: [],
      baselineEntries: [],
      lastExportAt: '2026-06-18T21:00:00.000Z',
    })

    expect(result.status).toBe('teilweise_abgeschlossen')
    expect(result.blockers.find((item) => item.kind === 'missing_e2_next_step')?.playerNames).toContain('Max')
  })
})

describe('findLatestRelevantPostSessionWork', () => {
  it('prefers the newest dated session with incomplete closure work at or before today', () => {
    const max = player('player-1', 'Max')
    const oldCompleted = sessionLog({
      id: 'log-old',
      sessionDefinitionId: 'session-old',
      date: '2026-06-16',
      status: 'completed',
      clientUpdatedAt: '2026-06-16T20:00:00.000Z',
    })
    const recentOpen = sessionLog({
      id: 'log-new',
      sessionDefinitionId: 'session-new',
      date: '2026-06-18',
      status: 'planned',
      clientUpdatedAt: '2026-06-18T20:00:00.000Z',
    })

    const result = findLatestRelevantPostSessionWork({
      activePlayers: [max],
      sessionLogs: [oldCompleted, recentOpen],
      entries: [entry(max.id, { sessionLogId: 'log-new', sessionRpe: null })],
      progressEntries: [],
      baselineEntries: [],
      lastExportAt: null,
      todayKey: '2026-06-21',
      getSessionType: () => 'training',
    })

    expect(result?.sessionLog.id).toBe('log-new')
    expect(result?.completion.status).toBe('teilweise_abgeschlossen')
  })
})
