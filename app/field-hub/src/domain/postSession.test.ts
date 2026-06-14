import { describe, expect, test } from 'vitest'
import type { PlayerSessionEntry } from './checkIn'
import { emptyCheckInDraft } from './checkIn'
import {
  calculateSessionLoad,
  derivePostSessionFollowUps,
  suggestNextStep,
  type ProgressEntry,
} from './postSession'

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
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function progress(overrides: Partial<ProgressEntry> = {}): ProgressEntry {
  return {
    id: 'progress-1',
    userId: 'user-1',
    playerId: 'player-1',
    sessionLogId: 'session-1',
    mainExercise: '',
    load: '',
    reps: '',
    rpe: '',
    powerOrSprint: '',
    conditioning: '',
    note: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

describe('calculateSessionLoad', () => {
  test('returns null when sRPE or duration is missing', () => {
    expect(calculateSessionLoad(null, 75)).toBeNull()
    expect(calculateSessionLoad(7, null)).toBeNull()
  })

  test('multiplies sRPE by duration when both values exist', () => {
    expect(calculateSessionLoad(7, 75)).toBe(525)
  })
})

describe('suggestNextStep', () => {
  test('suggests increasing after green clean work at target RPE', () => {
    expect(suggestNextStep(entry({ trafficLight: 'green' }), progress({ rpe: '7' }))).toBe('steigern')
  })

  test('suggests holding after yellow or C-variant work', () => {
    expect(suggestNextStep(entry({ trafficLight: 'yellow' }), progress({ rpe: '7' }))).toBe('halten')
    expect(suggestNextStep(entry({ trainingVariant: 'C' }), progress({ rpe: '7' }))).toBe('halten')
  })

  test('suggests reducing when pain rises after training', () => {
    expect(suggestNextStep(entry({ painScore: 1, postPainScore: 4 }), progress({ rpe: '7' }))).toBe('reduzieren')
  })

  test('suggests clarification for red, D, physio or very high RPE', () => {
    expect(suggestNextStep(entry({ trafficLight: 'red' }), progress({ rpe: '7' }))).toBe('klaeren')
    expect(suggestNextStep(entry({ trainingVariant: 'D' }), progress({ rpe: '7' }))).toBe('klaeren')
    expect(suggestNextStep(entry({ limits: ['physio'] }), progress({ rpe: '7' }))).toBe('klaeren')
    expect(suggestNextStep(entry({ trafficLight: 'green' }), progress({ rpe: '10' }))).toBe('klaeren')
  })
})

describe('derivePostSessionFollowUps', () => {
  test('creates no follow-ups for normal low-risk post-session state', () => {
    expect(
      derivePostSessionFollowUps(
        entry({ trafficLight: 'green', postPainScore: 0, e2Decision: 'normal', nextStep: 'steigern' }),
        progress({ mainExercise: 'Trap Bar Deadlift', rpe: '7' }),
      ),
    ).toEqual([])
  })

  test('creates follow-ups for E2, pain, safety and progression decisions', () => {
    expect(
      derivePostSessionFollowUps(
        entry({
          trafficLight: 'yellow',
          painScore: 1,
          postPainScore: 4,
          postPainLocation: 'Wade rechts',
          e2Decision: 'kein_sprint',
          limits: ['physio'],
          nextStep: 'reduzieren',
        }),
        progress({ mainExercise: 'Split Squat', rpe: '9' }),
      ),
    ).toEqual([
      'E2: kein_sprint fuer naechste Einheit beachten.',
      'Pain/Issue nach Training: 4/10 Wade rechts.',
      'Schmerz ist im Training gestiegen.',
      'Ampel Gelb in naechster Einheit vorladen.',
      'Physio/Medical Ruecksprache offen.',
      'Progression: reduzieren fuer Split Squat.',
    ])
  })
})
