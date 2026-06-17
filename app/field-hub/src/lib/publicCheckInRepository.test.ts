import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { Player } from '../domain/players'
import type { PublicCheckInSubmission } from '../domain/publicCheckIn'
import { ensureSessionLog, saveCheckInEntry } from './checkInRepository'
import { localDb } from './localDb'
import { importPublicCheckInSubmissions } from './publicCheckInRepository'

const userId = '00000000-0000-4000-8000-000000000001'

const sessionDefinition: SessionDefinition = {
  id: 'test-session',
  date: '2026-06-16',
  kw: 'KW25',
  title: 'Test Session',
  type: 'training',
  summary: 'Test',
  primarySource: 'test.md',
  pdfRefs: [],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const player: Player = {
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
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

function submission(overrides: Partial<PublicCheckInSubmission> = {}): PublicCheckInSubmission {
  return {
    id: 'submission-1',
    userId,
    linkId: 'link-1',
    linkPlayerId: 'link-player-1',
    playerId: player.id,
    readiness: 3,
    lifeFlag: 'wenig Schlaf',
    painScore: 1,
    painLocation: 'Wade rechts',
    returnerFlag: 'nein',
    sessionReaction: 'none',
    playerNote: 'komme spaeter',
    status: 'pending',
    submittedAt: '2026-06-16T17:45:00.000Z',
    importedAt: null,
    conflictReason: null,
    createdAt: '2026-06-16T17:45:00.000Z',
    updatedAt: '2026-06-16T17:45:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T17:45:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

describe('publicCheckInRepository import', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.players.put(player)
    await ensureSessionLog(userId, sessionDefinition)
  })

  it('imports a pending public submission into the player check-in', async () => {
    await localDb.publicCheckInSubmissions.put(submission())

    const result = await importPublicCheckInSubmissions(userId, sessionDefinition)
    const entries = await localDb.playerSessionEntries.where('userId').equals(userId).toArray()
    const updatedSubmission = await localDb.publicCheckInSubmissions.get('submission-1')

    expect(result.imported).toBe(1)
    expect(result.conflicts).toBe(0)
    expect(entries[0]).toMatchObject({
      playerId: player.id,
      present: true,
      readiness: 3,
      lifeFlag: 'wenig Schlaf',
      painScore: 1,
      painLocation: 'Wade rechts',
      returnerFlag: 'nein',
      checkInSource: 'player_link',
      playerNote: 'komme spaeter',
      playerSubmittedAt: '2026-06-16T17:45:00.000Z',
      coachEditedAt: null,
    })
    expect(updatedSubmission?.status).toBe('imported')
  })

  it('marks later public submissions as conflicts after a coach edit', async () => {
    const sessionLog = await ensureSessionLog(userId, sessionDefinition)
    await saveCheckInEntry(userId, sessionLog.id, player, { readiness: 5 })
    await localDb.publicCheckInSubmissions.put(submission({ id: 'late-submission', submittedAt: '2026-06-16T18:10:00.000Z' }))

    const result = await importPublicCheckInSubmissions(userId, sessionDefinition)
    const entry = await localDb.playerSessionEntries.where('userId').equals(userId).first()
    const updatedSubmission = await localDb.publicCheckInSubmissions.get('late-submission')

    expect(result.imported).toBe(0)
    expect(result.conflicts).toBe(1)
    expect(entry?.readiness).toBe(5)
    expect(entry?.checkInSource).toBe('coach')
    expect(entry?.coachEditedAt).toBeTruthy()
    expect(updatedSubmission?.status).toBe('conflict')
  })

  it('imports a public submission after a coach-only observation', async () => {
    const sessionLog = await ensureSessionLog(userId, sessionDefinition)
    await saveCheckInEntry(userId, sessionLog.id, player, { observation: 'Speed-Block beobachten' })
    await localDb.publicCheckInSubmissions.put(submission({ id: 'after-observation', submittedAt: '2026-06-16T18:10:00.000Z' }))

    const result = await importPublicCheckInSubmissions(userId, sessionDefinition)
    const entry = await localDb.playerSessionEntries.where('userId').equals(userId).first()
    const updatedSubmission = await localDb.publicCheckInSubmissions.get('after-observation')

    expect(result.imported).toBe(1)
    expect(result.conflicts).toBe(0)
    expect(entry?.readiness).toBe(3)
    expect(entry?.observation).toBe('Speed-Block beobachten')
    expect(entry?.coachEditedAt).toBeNull()
    expect(entry?.checkInSource).toBe('player_link')
    expect(updatedSubmission?.status).toBe('imported')
  })

  it('supersedes older pending submissions for the same player', async () => {
    await localDb.publicCheckInSubmissions.bulkPut([
      submission({ id: 'older-submission', readiness: 2, submittedAt: '2026-06-16T17:10:00.000Z' }),
      submission({ id: 'latest-submission', readiness: 4, submittedAt: '2026-06-16T17:50:00.000Z' }),
    ])

    const result = await importPublicCheckInSubmissions(userId, sessionDefinition)
    const entry = await localDb.playerSessionEntries.where('userId').equals(userId).first()
    const olderSubmission = await localDb.publicCheckInSubmissions.get('older-submission')

    expect(result.imported).toBe(1)
    expect(result.superseded).toBe(1)
    expect(entry?.readiness).toBe(4)
    expect(olderSubmission?.status).toBe('superseded')
  })
})
