import { describe, expect, it } from 'vitest'
import type { CheckInLimit, PlayerSessionEntry } from '../domain/checkIn'
import { deriveAdvisoryConsequences } from '../domain/checkInWarningGuidance'
import type { ReturnerEntry } from '../domain/returners'
import { applyOptimisticCheckInPatch, applyOptimisticReturnerPatch, mergeRecordIntoList } from './optimisticUpdates'

const checkInEntry: PlayerSessionEntry = {
  id: 'entry-1',
  userId: 'user-1',
  sessionLogId: 'session-1',
  playerId: 'player-1',
  present: false,
  readiness: null,
  lifeFlag: '',
  painScore: null,
  painLocation: '',
  returnerFlag: 'nein',
  sessionReaction: 'none',
  redFlag: 'none',
  movementConcern: false,
  previousWarning: false,
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
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const returnerEntry: ReturnerEntry = {
  id: 'returner-1',
  userId: 'user-1',
  playerId: 'player-1',
  sessionLogId: 'session-1',
  medicalContactNote: '',
  currentStage: '',
  speedCap: '',
  codDecelCap: '',
  conditioningCap: '',
  contactCap: '',
  allowedToday: '',
  plannedCaps: '',
  completed: '',
  symptomsDuring: '',
  nextMorning: '',
  decision: null,
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

describe('optimisticUpdates', () => {
  it('marks check-in button selections immediately and recalculates the traffic suggestion', () => {
    const nextEntry = applyOptimisticCheckInPatch(checkInEntry, { readiness: 2, previousWarning: false })

    expect(nextEntry.readiness).toBe(2)
    expect(nextEntry.present).toBe(true)
    expect(nextEntry.trafficLight).toBe('yellow')
    expect(nextEntry.trafficLightSuggestion).toBe('yellow')
    expect(nextEntry.syncStatus).toBe('pending')
  })

  it('keeps explicit absence visible when coach fields are edited optimistically', () => {
    const absentEntry = {
      ...checkInEntry,
      present: false,
      coachEditedAt: '2026-06-16T18:05:00.000Z',
    }

    const nextEntry = applyOptimisticCheckInPatch(absentEntry, { readiness: 4, painScore: 0 })

    expect(nextEntry.present).toBe(false)
    expect(nextEntry.readiness).toBe(4)
    expect(nextEntry.painScore).toBe(0)
  })

  it('keeps manual traffic-light actions visible immediately', () => {
    const nextEntry = applyOptimisticCheckInPatch(checkInEntry, {}, 'red')

    expect(nextEntry.trafficLight).toBe('red')
    expect(nextEntry.trafficLightWasManual).toBe(true)
    expect(nextEntry.trafficLightSuggestion).toBe('green')
  })

  it('lets guidance treat old optimistic limits as review items after a manual green correction', () => {
    const previousRedEntry = {
      ...checkInEntry,
      trafficLight: 'red' as const,
      trafficLightSuggestion: 'red' as const,
      limits: ['kein_sprint', 'kein_cond', 'kein_schweres_heben', 'klaeren'] satisfies CheckInLimit[],
    }
    const nextEntry = applyOptimisticCheckInPatch(previousRedEntry, {}, 'green')
    const consequences = deriveAdvisoryConsequences(nextEntry)

    expect(nextEntry.trafficLight).toBe('green')
    expect(nextEntry.trafficLightWasManual).toBe(true)
    expect(consequences.recommendedLimits).toEqual([])
    expect(consequences.staleStoredLimits).toEqual(['kein_sprint', 'kein_cond', 'kein_schweres_heben', 'klaeren'])
  })

  it('applies returner decisions immediately', () => {
    const nextEntry = applyOptimisticReturnerPatch(returnerEntry, { decision: 'reduzieren' })

    expect(nextEntry.decision).toBe('reduzieren')
    expect(nextEntry.syncStatus).toBe('pending')
  })

  it('replaces existing local records without requiring a full list refresh', () => {
    const replaced = mergeRecordIntoList([checkInEntry], { ...checkInEntry, readiness: 4 })

    expect(replaced).toHaveLength(1)
    expect(replaced[0].readiness).toBe(4)
  })
})
