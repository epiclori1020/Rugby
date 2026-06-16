import { describe, expect, it } from 'vitest'
import type { PlayerSessionEntry } from './checkIn'
import { emptyCheckInDraft } from './checkIn'
import {
  getLatestImportableSubmission,
  publicSubmissionPatch,
  shouldImportPublicSubmission,
  type PublicCheckInSubmission,
} from './publicCheckIn'

const entry: PlayerSessionEntry = {
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
  checkInSource: 'player_link',
  playerSubmittedAt: '2026-06-16T17:30:00.000Z',
  coachEditedAt: null,
  playerNote: '',
  createdAt: '2026-06-16T17:30:00.000Z',
  updatedAt: '2026-06-16T17:30:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T17:30:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const submission: PublicCheckInSubmission = {
  id: 'submission-1',
  userId: 'user-1',
  linkId: 'link-1',
  linkPlayerId: 'link-player-1',
  playerId: 'player-1',
  readiness: 4,
  lifeFlag: 'muede',
  painScore: 2,
  painLocation: 'Wade rechts',
  returnerFlag: 'nein',
  playerNote: 'komme direkt von Arbeit',
  status: 'pending',
  submittedAt: '2026-06-16T17:40:00.000Z',
  importedAt: null,
  conflictReason: null,
  createdAt: '2026-06-16T17:40:00.000Z',
  updatedAt: '2026-06-16T17:40:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T17:40:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

describe('publicCheckIn domain', () => {
  it('imports player self-report fields without touching coach-only fields', () => {
    const patch = publicSubmissionPatch(submission)

    expect(patch).toEqual({
      present: true,
      readiness: 4,
      lifeFlag: 'muede',
      painScore: 2,
      painLocation: 'Wade rechts',
      returnerFlag: 'nein',
      playerNote: 'komme direkt von Arbeit',
    })
    expect(patch).not.toHaveProperty('trafficLight')
    expect(patch).not.toHaveProperty('limits')
    expect(patch).not.toHaveProperty('redFlag')
    expect(patch).not.toHaveProperty('observation')
  })

  it('blocks silent import after a coach edit', () => {
    expect(shouldImportPublicSubmission({ ...entry, coachEditedAt: '2026-06-16T18:01:00.000Z' }, submission)).toEqual({
      ok: false,
      reason: 'Coach hat diesen Spieler bereits bearbeitet.',
    })
  })

  it('uses the latest pending submission before coach edits', () => {
    const older = { ...submission, id: 'older', submittedAt: '2026-06-16T17:10:00.000Z' }
    const latest = { ...submission, id: 'latest', submittedAt: '2026-06-16T17:45:00.000Z' }
    const imported = { ...submission, id: 'imported', status: 'imported' as const, submittedAt: '2026-06-16T17:50:00.000Z' }

    expect(getLatestImportableSubmission([older, latest, imported])?.id).toBe('latest')
  })
})
