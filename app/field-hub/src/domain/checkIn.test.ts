import { describe, expect, test } from 'vitest'
import {
  applyAutoTrafficLight,
  applyManualTrafficLight,
  applySuggestedTrafficLight,
  suggestTrafficLight,
  type CheckInDraft,
} from './checkIn'

function baseDraft(overrides: Partial<CheckInDraft> = {}): CheckInDraft {
  return {
    present: true,
    readiness: 4,
    lifeFlag: '',
    painScore: 0,
    painLocation: '',
    returnerFlag: 'nein',
    redFlag: 'none',
    movementConcern: false,
    previousWarning: false,
    trafficLight: null,
    trafficLightSuggestion: null,
    trafficLightWasManual: false,
    trainingVariant: null,
    limits: [],
    observation: '',
    ...overrides,
  }
}

describe('suggestTrafficLight', () => {
  test('returns green for pain 0-2 and no flags', () => {
    expect(suggestTrafficLight(baseDraft({ painScore: 2 }))).toBe('green')
  })

  test('returns yellow for pain 3-4', () => {
    expect(suggestTrafficLight(baseDraft({ painScore: 3 }))).toBe('yellow')
    expect(suggestTrafficLight(baseDraft({ painScore: 4 }))).toBe('yellow')
  })

  test('returns yellow for readiness 1-2', () => {
    expect(suggestTrafficLight(baseDraft({ readiness: 2 }))).toBe('yellow')
  })

  test.each(['nein', 'Nein', 'ok', 'okay', 'unauffaellig', 'unauffällig', 'keine', 'nichts', '-', '  ok  '])(
    'treats harmless life flag "%s" as no yellow flag',
    (lifeFlag) => {
      expect(suggestTrafficLight(baseDraft({ lifeFlag, painScore: 0, readiness: 5 }))).toBe('green')
    },
  )

  test('still treats specific life concerns as yellow', () => {
    expect(suggestTrafficLight(baseDraft({ lifeFlag: 'schlecht geschlafen, viel Stress' }))).toBe('yellow')
  })

  test('returns yellow for returner ja or offen', () => {
    expect(suggestTrafficLight(baseDraft({ returnerFlag: 'ja' }))).toBe('yellow')
    expect(suggestTrafficLight(baseDraft({ returnerFlag: 'offen' }))).toBe('yellow')
  })

  test('returns red for pain above 4', () => {
    expect(suggestTrafficLight(baseDraft({ painScore: 5 }))).toBe('red')
  })

  test('returns red for head neck neurological or instability flags', () => {
    expect(suggestTrafficLight(baseDraft({ redFlag: 'head_neck_neuro' }))).toBe('red')
    expect(suggestTrafficLight(baseDraft({ redFlag: 'acute_instability' }))).toBe('red')
  })

  test('returns red for changed movement mechanics', () => {
    expect(suggestTrafficLight(baseDraft({ movementConcern: true }))).toBe('red')
  })

  test('returns red for two yellow flags', () => {
    expect(suggestTrafficLight(baseDraft({ readiness: 2, returnerFlag: 'offen' }))).toBe('red')
  })
})

describe('applyManualTrafficLight', () => {
  test('keeps coach override instead of recomputing suggestion', () => {
    const draft = baseDraft({ painScore: 5 })

    expect(suggestTrafficLight(draft)).toBe('red')

    const corrected = applyManualTrafficLight(draft, 'yellow')

    expect(corrected.trafficLightSuggestion).toBe('red')
    expect(corrected.trafficLight).toBe('yellow')
    expect(corrected.trafficLightWasManual).toBe(true)
  })

  test('keeps the suggested traffic light when coach overrides manually', () => {
    const suggested = applySuggestedTrafficLight(baseDraft({ painScore: 0, readiness: 5, returnerFlag: 'nein' }))

    const overridden = applyManualTrafficLight(suggested, 'yellow')

    expect(overridden.trafficLightSuggestion).toBe('green')
    expect(overridden.trafficLight).toBe('yellow')
    expect(overridden.trafficLightWasManual).toBe(true)
  })
})

describe('applyAutoTrafficLight', () => {
  test('clears a coach override and returns to the live suggestion', () => {
    // Coach pins green while the situation is calm.
    const pinned = applyManualTrafficLight(baseDraft({ painScore: 0, readiness: 5 }), 'green')
    expect(pinned.trafficLightWasManual).toBe(true)

    // Pain later rises to 8. A manual override stays frozen on green (the bug we guard against).
    const raised = { ...pinned, painScore: 8 }
    expect(applySuggestedTrafficLight(raised).trafficLight).toBe('green')

    // Resetting to auto unfreezes the signal and recomputes it to red.
    const auto = applyAutoTrafficLight(raised)
    expect(auto.trafficLightWasManual).toBe(false)
    expect(auto.trafficLightSuggestion).toBe('red')
    expect(auto.trafficLight).toBe('red')
  })
})
