import { describe, expect, it } from 'vitest'
import { emptyCheckInDraft, type PlayerSessionEntry } from './checkIn'
import type { Player } from './players'
import { deriveReturnerTaskState } from './returnerTasks'
import type { ReturnerEntry } from './returners'

const player: Player = {
  id: 'player-1',
  userId: 'user-1',
  name: 'Max',
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
}

function checkInEntry(overrides: Partial<PlayerSessionEntry> = {}): PlayerSessionEntry {
  return {
    ...emptyCheckInDraft,
    id: 'entry-1',
    userId: 'user-1',
    sessionLogId: 'session-1',
    playerId: player.id,
    present: true,
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

function returnerEntry(overrides: Partial<ReturnerEntry> = {}): ReturnerEntry {
  return {
    id: 'returner-1',
    userId: 'user-1',
    playerId: player.id,
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
    ...overrides,
  }
}

describe('deriveReturnerTaskState', () => {
  it('does not turn an open clarification into a permanent Returner alarm', () => {
    expect(
      deriveReturnerTaskState({
        player: { ...player, returnerStatus: 'offen' },
        checkInEntry: checkInEntry({ returnerFlag: 'offen' }),
      }),
    ).toBeNull()
  })

  it('creates a planning task for an explicit or contextual Returner without a current plan', () => {
    expect(
      deriveReturnerTaskState({
        player: { ...player, returnerStatus: 'ja' },
        checkInEntry: checkInEntry({ returnerFlag: 'ja' }),
      }),
    ).toMatchObject({ phase: 'planning', tone: 'warning', isOpen: true })

    expect(deriveReturnerTaskState({ player, contextual: true })).toMatchObject({
      phase: 'planning',
      isOpen: true,
    })
    expect(deriveReturnerTaskState({ player, hasPreviousCap: true })).toMatchObject({
      phase: 'planning',
      isOpen: true,
    })
  })

  it('keeps a usable plan neutral while training is in progress', () => {
    expect(
      deriveReturnerTaskState({
        player,
        currentEntry: returnerEntry({ currentStage: 'gelb', allowedToday: 'Non-contact Teamtraining' }),
      }),
    ).toMatchObject({ phase: 'in_progress', tone: 'neutral', isOpen: false })
  })

  it('opens a coaching decision task after completion or reaction data exists', () => {
    expect(
      deriveReturnerTaskState({
        player,
        currentEntry: returnerEntry({ completed: 'Caps wie geplant absolviert' }),
      }),
    ).toMatchObject({ phase: 'decision', tone: 'warning', isOpen: true })
  })

  it('raises a follow-up only when a concern is not handled conservatively', () => {
    expect(
      deriveReturnerTaskState({
        player,
        currentEntry: returnerEntry({ symptomsDuring: 'Schmerzprovokation bei Decel', decision: 'bleiben' }),
      }),
    ).toMatchObject({ phase: 'follow_up', tone: 'danger', isOpen: true })

    expect(
      deriveReturnerTaskState({
        player,
        currentEntry: returnerEntry({ symptomsDuring: 'Schmerzprovokation bei Decel', decision: 'reduzieren' }),
      }),
    ).toMatchObject({ phase: 'done', tone: 'success', isOpen: false })
  })

  it('marks a documented stable coaching decision as done without clearance language', () => {
    const result = deriveReturnerTaskState({
      player,
      currentEntry: returnerEntry({ decision: 'steigern' }),
    })

    expect(result).toMatchObject({ phase: 'done', tone: 'success', isOpen: false })
    expect(result?.label.toLowerCase()).not.toContain('freigabe')
  })
})
