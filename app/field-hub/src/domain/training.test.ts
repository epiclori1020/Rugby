import { describe, expect, test } from 'vitest'
import { emptyCheckInDraft, type PlayerSessionEntry } from './checkIn'
import { appendLiveObservation, applyTrainingQuickAction, formatLiveObservation } from './training'

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

describe('applyTrainingQuickAction', () => {
  test('sets C variant without adding stop limits', () => {
    expect(applyTrainingQuickAction(entry(), 'variant_c')).toEqual({
      trainingVariant: 'C',
    })
  })

  test('sets D variant with stop and clarify limits', () => {
    expect(applyTrainingQuickAction(entry({ limits: ['kein_sprint'] }), 'variant_d')).toEqual({
      trainingVariant: 'D',
      limits: ['kein_sprint', 'kein_cond', 'kein_schweres_heben', 'klaeren'],
    })
  })

  test('deduplicates repeated quick action limits', () => {
    expect(
      applyTrainingQuickAction(
        entry({ limits: ['kein_cond', 'physio', 'klaeren'] }),
        'physio_medical',
      ),
    ).toEqual({
      limits: ['kein_cond', 'physio', 'klaeren'],
    })
  })

  test('maps individual limit quick actions', () => {
    expect(applyTrainingQuickAction(entry(), 'kein_sprint')).toEqual({ limits: ['kein_sprint'] })
    expect(applyTrainingQuickAction(entry(), 'kein_conditioning')).toEqual({ limits: ['kein_cond'] })
    expect(applyTrainingQuickAction(entry(), 'kein_schweres_heben')).toEqual({
      limits: ['kein_schweres_heben'],
    })
  })
})

describe('live observations', () => {
  test('formats a categorized observation with local time prefix', () => {
    expect(formatLiveObservation('Speed', '3 Reps gestrichen', new Date('2026-06-16T19:42:00.000Z'))).toMatch(
      /^\[Speed\] \d{2}:\d{2}: 3 Reps gestrichen$/,
    )
  })

  test('appends live observations without losing existing notes', () => {
    expect(appendLiveObservation('Alt', 'Speed', '3 Reps gestrichen', new Date('2026-06-16T19:42:00.000Z'))).toMatch(
      /^Alt\n\[Speed\] \d{2}:\d{2}: 3 Reps gestrichen$/,
    )
  })
})
