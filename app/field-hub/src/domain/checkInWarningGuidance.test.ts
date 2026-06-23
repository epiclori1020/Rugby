import { describe, expect, test } from 'vitest'
import { emptyCheckInDraft, type PlayerSessionEntry, type PlayerWarning } from './checkIn'
import type { ReturnerCapSummary } from './returners'
import { buildCheckInGuidance, deriveAdvisoryConsequences } from './checkInWarningGuidance'

function entry(overrides: Partial<PlayerSessionEntry> = {}): PlayerSessionEntry {
  return {
    ...emptyCheckInDraft,
    id: 'entry-1',
    userId: 'user-1',
    sessionLogId: 'session-1',
    playerId: 'player-1',
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
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function warning(overrides: Partial<PlayerWarning> = {}): PlayerWarning {
  return {
    playerId: 'player-1',
    trafficLight: 'yellow',
    returnerFlag: 'nein',
    limits: [],
    observation: '',
    e2Decision: null,
    nextStep: null,
    postPainScore: null,
    postPainLocation: '',
    sessionLoad: null,
    sessionDate: '2026-06-13',
    ...overrides,
  }
}

function returnerCap(overrides: Partial<ReturnerCapSummary> = {}): ReturnerCapSummary {
  return {
    playerId: 'player-1',
    sessionLogId: 'returner-session-1',
    currentStage: 'gelb',
    speedCap: 'max 70 Prozent',
    codDecelCap: 'nur geplante Richtungswechsel',
    conditioningCap: 'kein Bronco',
    contactCap: 'kein Kontakt',
    allowedToday: 'Skill non-contact',
    plannedCaps: '',
    completed: '',
    symptomsDuring: '',
    nextMorning: '',
    decision: 'bleiben',
    sessionDate: '2026-06-13',
    ...overrides,
  }
}

describe('deriveAdvisoryConsequences', () => {
  test('respects a manual green coach traffic light instead of stale red limits', () => {
    const consequences = deriveAdvisoryConsequences(
      entry({
        trafficLight: 'green',
        trafficLightSuggestion: 'red',
        trafficLightWasManual: true,
        limits: ['kein_sprint', 'kein_cond', 'kein_schweres_heben', 'klaeren'],
      }),
    )

    expect(consequences.recommendedLimits).toEqual([])
    expect(consequences.staleStoredLimits).toEqual(['kein_sprint', 'kein_cond', 'kein_schweres_heben', 'klaeren'])
  })

  test('derives red advisory consequences from the visible automatic traffic light', () => {
    const consequences = deriveAdvisoryConsequences(entry({ trafficLight: 'red', trafficLightSuggestion: 'red' }))

    expect(consequences.recommendedLimits).toEqual(['kein_sprint', 'kein_cond', 'kein_schweres_heben', 'klaeren'])
    expect(consequences.staleStoredLimits).toEqual([])
  })
})

describe('buildCheckInGuidance', () => {
  test('treats returner offen as an open decision instead of a load warning', () => {
    const guidance = buildCheckInGuidance({ entry: entry({ returnerFlag: 'offen' }) })

    expect(guidance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'decision_open',
          title: 'Returner klären',
          consequence: 'Keine Belastungswarnung; zuerst Returner ja/nein wählen.',
        }),
      ]),
    )
    expect(guidance.map((item) => item.level)).not.toContain('check_today')
    expect(guidance.map((item) => item.level)).not.toContain('recommended_limit')
  })

  test('explains returner ja as load adjustment without medical clearance language', () => {
    const guidance = buildCheckInGuidance({ entry: entry({ returnerFlag: 'ja' }) })

    expect(guidance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'adjust_load',
          title: 'Returner heute',
          coachAction: 'Returner-Caps prüfen und Belastung vor Sprint, COD, Conditioning und Kontakt bewusst wählen.',
        }),
      ]),
    )
  })

  test('shows returner caps separately from returner status', () => {
    const guidance = buildCheckInGuidance({ entry: entry({ returnerFlag: 'ja' }), returnerCap: returnerCap() })

    expect(guidance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'info',
          source: 'returner_caps',
          title: 'Returner-Caps',
          consequence: 'Caps sind ein Belastungsplan, keine medizinische Freigabe.',
        }),
      ]),
    )
  })

  test('explains yellow and red traffic lights with advisory consequences', () => {
    const yellow = buildCheckInGuidance({ entry: entry({ trafficLight: 'yellow', trafficLightSuggestion: 'yellow' }) })
    const red = buildCheckInGuidance({ entry: entry({ trafficLight: 'red', trafficLightSuggestion: 'red' }) })

    expect(yellow).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ level: 'adjust_load', title: 'Gelb: Belastung anpassen' }),
      ]),
    )
    expect(red).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ level: 'check_today', title: 'Rot: heute prüfen' }),
      ]),
    )
  })

  test('explains red flags with clear advisory no-normal-progression language', () => {
    const guidance = buildCheckInGuidance({ entry: entry({ redFlag: 'head_neck_neuro' }) })

    expect(guidance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Red Flag prüfen',
          coachAction: 'Medical/Physio klären; keine normale Progression übernehmen.',
          consequence: 'Keine normale Progression; App bleibt beratend und sperrt keine Coach-Entscheidung.',
        }),
      ]),
    )
  })

  test('marks stored limits as something to review when they disagree with current coach traffic light', () => {
    const guidance = buildCheckInGuidance({
      entry: entry({
        trafficLight: 'green',
        trafficLightSuggestion: 'red',
        trafficLightWasManual: true,
        limits: ['kein_sprint', 'kein_cond', 'klaeren'],
      }),
    })

    expect(guidance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'decision_open',
          title: 'Gespeicherte Limits prüfen',
          consequence: 'Nicht automatisch als heutiges Limit anzeigen; Coach-Entscheidung und aktuelle Lage prüfen.',
        }),
      ]),
    )
  })

  test('turns carry-over e2, next step, post pain and limits into clear previous-session notes', () => {
    const guidance = buildCheckInGuidance({
      entry: entry(),
      warning: warning({
        trafficLight: 'red',
        e2Decision: 'kein_sprint',
        nextStep: 'klaeren',
        postPainScore: 5,
        postPainLocation: 'Knie',
        limits: ['kein_sprint', 'klaeren'],
      }),
    })

    expect(guidance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'carryover', title: 'Vorwarnung aus letzter Einheit' }),
        expect.objectContaining({ source: 'carryover', title: 'E2 aus letzter Einheit' }),
        expect.objectContaining({ source: 'carryover', title: 'Post-Pain aus letzter Einheit' }),
        expect.objectContaining({ source: 'carryover', title: 'Alte Limits prüfen' }),
      ]),
    )
  })

  test('does not use mandatory or blocking language', () => {
    const guidanceText = buildCheckInGuidance({
      entry: entry({
        trafficLight: 'red',
        trafficLightSuggestion: 'red',
        redFlag: 'head_neck_neuro',
        returnerFlag: 'ja',
      }),
      warning: warning({ e2Decision: 'physio', nextStep: 'klaeren', postPainScore: 6 }),
      returnerCap: returnerCap(),
    })
      .map((item) => Object.values(item).join(' '))
      .join(' ')
      .toLocaleLowerCase('de-AT')

    expect(guidanceText).not.toContain('pflicht')
    expect(guidanceText).not.toContain('sperre')
    expect(guidanceText).not.toContain('blockiert')
    expect(guidanceText).not.toContain('muss')
    expect(guidanceText).not.toContain('medizinisch freigegeben')
  })
})
