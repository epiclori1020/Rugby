import { describe, expect, it } from 'vitest'
import type { PlayerSessionEntry, PlayerWarning } from './checkIn'
import type { CoachInsight } from './coachInsights'
import type { Player } from './players'
import { buildTodaySquadSummary } from './todaySquad'

function player(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    userId: 'user-1',
    name: `Spieler ${id}`,
    position: 'Back Row',
    cluster: 'back_row',
    active: true,
    consentStatus: 'vorhanden',
    photoConsentStatus: 'not_asked',
    photoPath: null,
    photoUpdatedAt: null,
    returnerStatus: 'nein',
    notes: '',
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-07-10T10:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-07-10T10:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function entry(playerId: string, overrides: Partial<PlayerSessionEntry> = {}): PlayerSessionEntry {
  return {
    id: `entry-${playerId}`,
    userId: 'user-1',
    sessionLogId: 'session-log-1',
    playerId,
    present: true,
    readiness: 4,
    lifeFlag: '',
    painScore: 0,
    painLocation: '',
    returnerFlag: 'nein',
    redFlag: 'none',
    movementConcern: false,
    previousWarning: false,
    sessionReaction: 'none',
    trafficLight: 'green',
    trafficLightSuggestion: 'green',
    trafficLightWasManual: false,
    trainingVariant: null,
    limits: [],
    observation: '',
    sessionRpe: null,
    durationMinutes: null,
    sessionLoad: null,
    postPainScore: null,
    postPainLocation: '',
    e2Decision: null,
    nextStep: null,
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-07-10T10:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-07-10T10:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function warning(playerId: string, overrides: Partial<PlayerWarning> = {}): PlayerWarning {
  return {
    playerId,
    trafficLight: 'yellow',
    returnerFlag: 'nein',
    limits: [],
    observation: '',
    e2Decision: null,
    nextStep: 'reduzieren',
    postPainScore: 3,
    postPainLocation: '',
    sessionLoad: null,
    sessionDate: '2026-07-09',
    ...overrides,
  }
}

function insight(playerId: string, overrides: Partial<CoachInsight> = {}): CoachInsight {
  return {
    id: `insight-${playerId}`,
    rule: 'consecutive_yellow_red',
    severity: 'high',
    title: 'Wiederholte Ampel',
    reason: 'Zwei Einheiten hintereinander gelb oder rot.',
    targetTab: 'check-in',
    sources: [
      {
        playerId,
        playerName: `Spieler ${playerId}`,
        sessionLogId: 'session-log-old',
        sessionDefinitionId: 'session-old',
        sessionDate: '2026-07-09',
        table: 'player_session_entries',
        recordId: `record-${playerId}`,
        correctionTarget: 'check-in',
      },
    ],
    ...overrides,
  }
}

describe('buildTodaySquadSummary', () => {
  it('uses expected plus unexpectedly present players as the operational squad', () => {
    const summary = buildTodaySquadSummary({
      coachInsights: [],
      entries: [entry('unexpected')],
      expectedPlayerIds: ['expected'],
      players: [player('expected'), player('unexpected'), player('bench')],
      warnings: [],
    })

    expect(summary.squadPlayerIds).toEqual(['expected', 'unexpected'])
    expect(summary.squadCount).toBe(2)
    expect(summary.presentCount).toBe(1)
  })

  it('does not fall back to every active player when the expected list only contains inactive players', () => {
    const summary = buildTodaySquadSummary({
      coachInsights: [],
      entries: [entry('unexpected')],
      expectedPlayerIds: ['inactive'],
      players: [player('inactive', { active: false }), player('unexpected'), player('bench')],
      warnings: [],
    })

    expect(summary.squadPlayerIds).toEqual(['unexpected'])
    expect(summary.squadCount).toBe(1)
  })

  it('counts only explicit returners among present players and keeps offen as clarification', () => {
    const summary = buildTodaySquadSummary({
      coachInsights: [],
      entries: [entry('open', { returnerFlag: 'offen' }), entry('returner', { returnerFlag: 'ja' })],
      expectedPlayerIds: ['open', 'returner'],
      players: [player('open', { returnerStatus: 'offen' }), player('returner', { returnerStatus: 'ja' })],
      warnings: [],
    })

    expect(summary.returnerCount).toBe(1)
    expect(summary.attentionRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ playerId: 'open', tone: 'open' }),
        expect.objectContaining({ playerId: 'returner', tone: 'returner' }),
      ]),
    )
  })

  it('aggregates current status, carry-over warning and insight into one row per present player', () => {
    const summary = buildTodaySquadSummary({
      coachInsights: [insight('flagged')],
      entries: [entry('flagged', { trafficLight: 'red', trafficLightSuggestion: 'red' })],
      expectedPlayerIds: ['flagged'],
      players: [player('flagged')],
      warnings: [warning('flagged')],
    })

    expect(summary.redCount).toBe(1)
    expect(summary.attentionRows).toHaveLength(1)
    expect(summary.attentionRows[0]).toMatchObject({
      playerId: 'flagged',
      tone: 'red',
    })
    expect(summary.attentionRows[0].reasons.length).toBeGreaterThanOrEqual(3)
  })

  it('derives red and yellow scoreboard counts from the highest aggregated reason per present player', () => {
    const summary = buildTodaySquadSummary({
      coachInsights: [],
      entries: [entry('flagged', { trafficLight: 'yellow' })],
      expectedPlayerIds: ['flagged'],
      players: [player('flagged')],
      warnings: [warning('flagged', { trafficLight: 'red', nextStep: 'klaeren' })],
    })

    expect(summary.redCount).toBe(1)
    expect(summary.yellowCount).toBe(0)
    expect(summary.attentionRows[0].tone).toBe('red')
  })

  it('counts an explicit returner warning only when that player is present', () => {
    const summary = buildTodaySquadSummary({
      coachInsights: [],
      entries: [entry('present')],
      expectedPlayerIds: ['present', 'waiting'],
      players: [player('present'), player('waiting')],
      warnings: [
        warning('present', { trafficLight: null, nextStep: null, postPainScore: null, returnerFlag: 'ja' }),
        warning('waiting', { trafficLight: null, nextStep: null, postPainScore: null, returnerFlag: 'ja' }),
      ],
    })

    expect(summary.returnerCount).toBe(1)
    expect(summary.attentionRows.map((row) => row.playerId)).toEqual(['present'])
  })

  it('excludes non-present players from attention even when historical warnings exist', () => {
    const summary = buildTodaySquadSummary({
      coachInsights: [insight('waiting')],
      entries: [entry('present')],
      expectedPlayerIds: ['present', 'waiting'],
      players: [player('present'), player('waiting', { returnerStatus: 'ja' })],
      warnings: [warning('waiting', { trafficLight: 'red' })],
    })

    expect(summary.attentionRows.map((row) => row.playerId)).not.toContain('waiting')
  })

  it('sorts attention by red, yellow, returner, open and then name', () => {
    const summary = buildTodaySquadSummary({
      coachInsights: [],
      entries: [
        entry('open', { returnerFlag: 'offen' }),
        entry('returner', { returnerFlag: 'ja' }),
        entry('yellow', { trafficLight: 'yellow' }),
        entry('red', { trafficLight: 'red' }),
      ],
      expectedPlayerIds: ['open', 'returner', 'yellow', 'red'],
      players: [player('open'), player('returner'), player('yellow'), player('red')],
      warnings: [],
    })

    expect(summary.attentionRows.map((row) => row.tone)).toEqual(['red', 'yellow', 'returner', 'open'])
  })
})
