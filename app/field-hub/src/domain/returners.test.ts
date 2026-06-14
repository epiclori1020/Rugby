import { describe, expect, test } from 'vitest'
import {
  canConsiderReturnerProgression,
  hasReturnerConcern,
  suggestReturnerDecision,
  type ReturnerEntry,
} from './returners'

function returnerEntry(overrides: Partial<ReturnerEntry> = {}): ReturnerEntry {
  return {
    id: 'returner-1',
    userId: 'user-1',
    playerId: 'player-1',
    sessionLogId: 'session-1',
    medicalContactNote: '',
    currentStage: 'gelb',
    speedCap: '4x10 m smooth',
    codDecelCap: 'geplante Decels, keine offenen Cuts',
    conditioningCap: 'Airbike kurz, kein Zusatzblock',
    contactCap: 'kein Kontakt',
    allowedToday: 'Team-Warm-up plus individuelle Speed-Caps',
    plannedCaps: 'Speed bleibt submaximal, kein Contact Prep',
    completed: 'alles wie geplant',
    symptomsDuring: '',
    nextMorning: '',
    decision: null,
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

describe('hasReturnerConcern', () => {
  test.each([
    '',
    'ok',
    'okay',
    'nein',
    'keine',
    'nichts',
    'stabil',
    'unauffaellig',
    'unauffällig',
    'schmerzfrei',
    'keine Symptome',
    'ohne Schmerz',
    '-',
  ])(
    'treats harmless note "%s" as stable',
    (note) => {
      expect(hasReturnerConcern(note)).toBe(false)
    },
  )

  test.each([
    'Schwellung nach Training',
    'Instabilitaet beim Cut',
    'neurologische Symptome',
    'Concussion-Verdacht',
    'naechster Morgen schlechter',
    'Ziehen in der Wade',
    'offen',
  ])('treats red flag note "%s" as a concern', (note) => {
    expect(hasReturnerConcern(note)).toBe(true)
  })
})

describe('suggestReturnerDecision', () => {
  test('keeps returner stable when caps are incomplete', () => {
    expect(suggestReturnerDecision(returnerEntry({ speedCap: '' }))).toBe('bleiben')
  })

  test('allows a conservative progression suggestion only when full caps are stable', () => {
    expect(suggestReturnerDecision(returnerEntry())).toBe('steigern')
  })

  test('requires medical feedback when symptoms or next morning are concerning', () => {
    expect(suggestReturnerDecision(returnerEntry({ symptomsDuring: 'Schmerzprovokation bei Decel' }))).toBe(
      'rueckmelden',
    )
    expect(suggestReturnerDecision(returnerEntry({ nextMorning: 'schlechter Morgen, steif' }))).toBe(
      'rueckmelden',
    )
  })

  test('does not treat the suggestion as medical clearance', () => {
    expect(canConsiderReturnerProgression(returnerEntry({ decision: 'rueckmelden' }))).toBe(false)
    expect(canConsiderReturnerProgression(returnerEntry({ symptomsDuring: 'Concussion-Verdacht' }))).toBe(false)
    expect(canConsiderReturnerProgression(returnerEntry({ decision: 'steigern' }))).toBe(true)
  })
})
