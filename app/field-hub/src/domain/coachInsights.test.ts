import { describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import { emptyCheckInDraft, type PlayerSessionEntry, type SessionLog } from './checkIn'
import { createEmptyExposureStatuses, type PlayerExposureSummary } from './exposures'
import type { Player } from './players'
import type { ReturnerEntry } from './returners'
import type { SessionBlockLog } from './sessionBlocks'
import { buildCoachInsights, type CoachInsight } from './coachInsights'

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
    ...overrides,
  }
}

function entry(id: string, sessionLogId: string, overrides: Partial<PlayerSessionEntry> = {}): PlayerSessionEntry {
  return {
    ...emptyCheckInDraft,
    id,
    userId,
    sessionLogId,
    playerId: 'player-1',
    present: true,
    readiness: 4,
    painScore: 1,
    trafficLight: 'green',
    trafficLightSuggestion: 'green',
    sessionRpe: 5,
    durationMinutes: 75,
    sessionLoad: 375,
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

function sessionDefinition(id: string, date = '2026-06-16', exposureTags: SessionDefinition['timeline'][number]['exposureTags'] = ['speed']): SessionDefinition {
  return {
    id,
    date,
    kw: 'KW25',
    title: `Session ${id}`,
    type: 'training',
    summary: '',
    primarySource: '',
    pdfRefs: [],
    goals: [],
    timeline: [
      {
        key: `${id}:block`,
        order: 1,
        time: '0-10',
        title: 'Relevant Block',
        work: 'Planned work',
        exposureTags,
      },
    ],
    materials: [],
    safetyNotes: [],
    coachNotes: [],
    libraryRefs: [],
  }
}

function blockLog(id: string, sessionLogId: string, overrides: Partial<SessionBlockLog> = {}): SessionBlockLog {
  const definitionId = sessionLogId.replace('log', 'session')

  return {
    id,
    userId,
    sessionLogId,
    sessionDefinitionId: definitionId,
    blockKey: `${definitionId}:block`,
    blockTitle: 'Relevant Block',
    blockOrder: 1,
    plannedTime: '0-10',
    plannedWork: 'Planned work',
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

function exposure(id: string, sessionLogId: string, sessionDate: string, overrides: Partial<PlayerExposureSummary> = {}): PlayerExposureSummary {
  return {
    id,
    userId,
    playerId: 'player-1',
    sessionLogId,
    sessionDefinitionId: sessionLogId.replace('log', 'session'),
    sessionDate,
    statuses: createEmptyExposureStatuses(),
    sources: {},
    manualOverrides: {},
    coachNote: '',
    createdAt: `${sessionDate}T18:00:00.000Z`,
    updatedAt: `${sessionDate}T20:00:00.000Z`,
    deletedAt: null,
    clientUpdatedAt: `${sessionDate}T20:00:00.000Z`,
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function returner(id: string, sessionLogId: string, overrides: Partial<ReturnerEntry> = {}): ReturnerEntry {
  return {
    id,
    userId,
    playerId: 'player-1',
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

function build(overrides: Partial<Parameters<typeof buildCoachInsights>[0]> = {}) {
  return buildCoachInsights({
    players: [player()],
    sessionDefinitions: [sessionDefinition('session-1')],
    sessionLogs: [sessionLog('log-1', '2026-06-16')],
    entries: [entry('entry-1', 'log-1')],
    returnerEntries: [],
    sessionBlockLogs: [],
    exposureSummaries: [exposure('exposure-1', 'log-1', '2026-06-16', {
      statuses: { ...createEmptyExposureStatuses(), speed: 'completed' },
    })],
    todayKey: '2026-06-22',
    ...overrides,
  })
}

function insightByRule(insights: CoachInsight[], rule: CoachInsight['rule']) {
  return insights.find((insight) => insight.rule === rule)
}

describe('buildCoachInsights', () => {
  it('returns a quiet empty list when local data has no open coaching points', () => {
    expect(build()).toEqual([])
  })

  it('flags a player without speed exposure in the last 14 days', () => {
    const insights = build({
      exposureSummaries: [exposure('exposure-1', 'log-1', '2026-06-16')],
    })

    expect(insightByRule(insights, 'speed_gap_14d')).toMatchObject({
      id: 'coach-insight:speed_gap_14d:player-1:2026-06-22',
      severity: 'medium',
      targetTab: 'nachbereitung',
    })
  })

  it('flags two consecutive attended yellow or red sessions for the same player', () => {
    const insights = build({
      sessionLogs: [sessionLog('log-1', '2026-06-16'), sessionLog('log-2', '2026-06-18')],
      entries: [
        entry('entry-1', 'log-1', { trafficLight: 'yellow', trafficLightSuggestion: 'yellow' }),
        entry('entry-2', 'log-2', { trafficLight: 'red', trafficLightSuggestion: 'red' }),
      ],
    })

    expect(insightByRule(insights, 'consecutive_yellow_red')).toMatchObject({
      severity: 'high',
      targetTab: 'check-in',
      sources: [
        expect.objectContaining({ recordId: 'entry-2', correctionTarget: 'check-in' }),
        expect.objectContaining({ recordId: 'entry-1', correctionTarget: 'check-in' }),
      ],
    })
  })

  it('flags completed sessions where present players are missing sRPE', () => {
    const insights = build({
      entries: [entry('entry-1', 'log-1', { sessionRpe: null, sessionLoad: null })],
    })

    expect(insightByRule(insights, 'missing_srpe_completed_session')).toMatchObject({
      severity: 'medium',
      targetTab: 'nachbereitung',
      sources: [expect.objectContaining({ table: 'player_session_entries', recordId: 'entry-1' })],
    })
  })

  it('flags returners with completed caps but no decision', () => {
    const insights = build({
      returnerEntries: [returner('returner-1', 'log-1', { decision: null })],
    })

    expect(insightByRule(insights, 'returner_caps_missing_decision')).toMatchObject({
      severity: 'medium',
      targetTab: 'returner',
      sources: [expect.objectContaining({ table: 'returner_entries', recordId: 'returner-1' })],
    })
  })

  it('flags planned speed contact or conditioning blocks skipped in two consecutive relevant sessions', () => {
    const insights = build({
      sessionDefinitions: [
        sessionDefinition('session-1', '2026-06-16', ['speed']),
        sessionDefinition('session-2', '2026-06-18', ['speed']),
      ],
      sessionLogs: [sessionLog('log-1', '2026-06-16'), sessionLog('log-2', '2026-06-18')],
      sessionBlockLogs: [
        blockLog('block-1', 'log-1', { status: 'skipped', reason: 'time' }),
        blockLog('block-2', 'log-2', { status: 'skipped', reason: 'time' }),
      ],
    })

    expect(insightByRule(insights, 'consecutive_skipped_planned_block')).toMatchObject({
      severity: 'medium',
      targetTab: 'training',
      sources: [
        expect.objectContaining({ recordId: 'block-2', correctionTarget: 'training' }),
        expect.objectContaining({ recordId: 'block-1', correctionTarget: 'training' }),
      ],
    })
  })

  it('does not flag skipped blocks when a relevant completed block breaks the sequence', () => {
    const insights = build({
      sessionDefinitions: [
        sessionDefinition('session-1', '2026-06-14', ['speed']),
        sessionDefinition('session-2', '2026-06-16', ['speed']),
        sessionDefinition('session-3', '2026-06-18', ['speed']),
      ],
      sessionLogs: [
        sessionLog('log-1', '2026-06-14'),
        sessionLog('log-2', '2026-06-16'),
        sessionLog('log-3', '2026-06-18'),
      ],
      sessionBlockLogs: [
        blockLog('block-1', 'log-1', { status: 'skipped', reason: 'time' }),
        blockLog('block-2', 'log-2', { status: 'done', reason: 'none' }),
        blockLog('block-3', 'log-3', { status: 'skipped', reason: 'time' }),
      ],
    })

    expect(insightByRule(insights, 'consecutive_skipped_planned_block')).toBeUndefined()
  })

  it('flags post pain without E2 or next step', () => {
    const insights = build({
      entries: [entry('entry-1', 'log-1', { postPainScore: 3, e2Decision: null, nextStep: null })],
    })

    expect(insightByRule(insights, 'post_pain_missing_next_step')).toMatchObject({
      severity: 'high',
      targetTab: 'nachbereitung',
      sources: [expect.objectContaining({ recordId: 'entry-1' })],
    })
  })

  it('flags team and player 7d vs 28d load spikes when coverage is sufficient', () => {
    const logs = [
      sessionLog('log-1', '2026-06-02'),
      sessionLog('log-2', '2026-06-09'),
      sessionLog('log-3', '2026-06-16'),
      sessionLog('log-4', '2026-06-22'),
    ]
    const insights = build({
      sessionLogs: logs,
      entries: [
        entry('entry-1', 'log-1', { sessionLoad: 200 }),
        entry('entry-2', 'log-2', { sessionLoad: 200 }),
        entry('entry-3', 'log-3', { sessionLoad: 200 }),
        entry('entry-4', 'log-4', { sessionLoad: 600 }),
      ],
      todayKey: '2026-06-22',
    })
    const loadSpikeInsights = insights.filter((insight) => insight.rule === 'load_spike')

    expect(loadSpikeInsights).toHaveLength(2)
    expect(loadSpikeInsights.map((insight) => insight.severity)).toEqual(['high', 'high'])
    expect(loadSpikeInsights.map((insight) => insight.id)).toEqual([
      'coach-insight:load_spike:team:2026-06-22',
      'coach-insight:load_spike:player-1:2026-06-22',
    ])
  })

  it('does not flag load spikes before at least 21 days of load history are covered', () => {
    const logs = [
      sessionLog('log-1', '2026-06-16'),
      sessionLog('log-2', '2026-06-18'),
      sessionLog('log-3', '2026-06-20'),
      sessionLog('log-4', '2026-06-22'),
    ]
    const insights = build({
      sessionLogs: logs,
      entries: [
        entry('entry-1', 'log-1', { sessionLoad: 200 }),
        entry('entry-2', 'log-2', { sessionLoad: 200 }),
        entry('entry-3', 'log-3', { sessionLoad: 200 }),
        entry('entry-4', 'log-4', { sessionLoad: 600 }),
      ],
      todayKey: '2026-06-22',
    })

    expect(insights.filter((insight) => insight.rule === 'load_spike')).toEqual([])
  })

  it('flags unusually low or dense contact prep exposure patterns', () => {
    const lowInsights = build({
      sessionDefinitions: [
        sessionDefinition('session-1', '2026-06-16', ['contact_prep']),
        sessionDefinition('session-2', '2026-06-18', ['contact_prep']),
      ],
      sessionLogs: [sessionLog('log-1', '2026-06-16'), sessionLog('log-2', '2026-06-18')],
      entries: [entry('entry-1', 'log-1'), entry('entry-2', 'log-2')],
      exposureSummaries: [exposure('exposure-1', 'log-1', '2026-06-16'), exposure('exposure-2', 'log-2', '2026-06-18')],
    })
    const denseInsights = build({
      sessionLogs: [sessionLog('log-1', '2026-06-16'), sessionLog('log-2', '2026-06-18')],
      entries: [entry('entry-1', 'log-1'), entry('entry-2', 'log-2')],
      exposureSummaries: [
        exposure('exposure-1', 'log-1', '2026-06-16', {
          statuses: { ...createEmptyExposureStatuses(), contact_prep: 'completed' },
        }),
        exposure('exposure-2', 'log-2', '2026-06-18', {
          statuses: { ...createEmptyExposureStatuses(), contact_prep: 'reduced' },
        }),
      ],
    })

    expect(insightByRule(lowInsights, 'contact_exposure_pattern')).toMatchObject({
      id: 'coach-insight:contact_exposure_pattern:low:player-1:2026-06-22',
      severity: 'medium',
    })
    expect(insightByRule(denseInsights, 'contact_exposure_pattern')).toMatchObject({
      id: 'coach-insight:contact_exposure_pattern:dense:player-1:2026-06-22',
      severity: 'medium',
    })
  })

  it('ignores dense contact prep clusters whose latest exposure is older than 21 days', () => {
    const insights = build({
      sessionLogs: [sessionLog('log-1', '2026-05-01'), sessionLog('log-2', '2026-05-04')],
      entries: [entry('entry-1', 'log-1'), entry('entry-2', 'log-2')],
      exposureSummaries: [
        exposure('exposure-1', 'log-1', '2026-05-01', {
          statuses: { ...createEmptyExposureStatuses(), contact_prep: 'completed' },
        }),
        exposure('exposure-2', 'log-2', '2026-05-04', {
          statuses: { ...createEmptyExposureStatuses(), contact_prep: 'reduced' },
        }),
      ],
      todayKey: '2026-06-22',
    })

    expect(insightByRule(insights, 'contact_exposure_pattern')).toBeUndefined()
  })

  it('keeps every insight source traceable and avoids medical clearance or diagnosis wording', () => {
    const insights = build({
      entries: [entry('entry-1', 'log-1', { postPainScore: 4, e2Decision: null, nextStep: null })],
      returnerEntries: [returner('returner-1', 'log-1', { decision: null })],
      exposureSummaries: [exposure('exposure-1', 'log-1', '2026-06-16')],
    })
    const serialized = JSON.stringify(insights).toLocaleLowerCase('de-AT')

    expect(insights.length).toBeGreaterThan(0)
    for (const insight of insights) {
      expect(insight.sources.length).toBeGreaterThan(0)
      expect(insight.sources.some((source) => source.playerId || source.sessionLogId || source.sessionDefinitionId)).toBe(true)
    }
    expect(serialized).not.toContain('freigabe')
    expect(serialized).not.toContain('diagnose')
    expect(serialized).not.toContain('arztbrief')
    expect(serialized).not.toContain('clearance')
    expect(serialized).not.toContain('cleared')
  })
})
