import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { Player } from '../domain/players'
import type { PublicCheckInSubmission } from '../domain/publicCheckIn'
import { ensureSessionLog, resetAllCheckInsForSession, saveCheckInEntry } from './checkInRepository'
import { localDb } from './localDb'
import { importPublicCheckInSubmissions, resetPublicCheckInSubmissionsForSession } from './publicCheckInRepository'

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

async function putPublicLink(id = 'link-1', sessionDefinitionId = sessionDefinition.id) {
  await localDb.publicCheckInLinks.put({
    id,
    userId,
    sessionDefinitionId,
    sessionTitle: sessionDefinitionId === sessionDefinition.id ? sessionDefinition.title : 'Other',
    sessionDate: sessionDefinitionId === sessionDefinition.id ? sessionDefinition.date : '2026-06-18',
    tokenHash: `hash-${id}`,
    expiresAt: '2026-06-17T00:00:00.000Z',
    closedAt: null,
    createdAt: '2026-06-16T17:00:00.000Z',
    updatedAt: '2026-06-16T17:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T17:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
  })
}

describe('publicCheckInRepository import', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.players.put(player)
    await ensureSessionLog(userId, sessionDefinition)
    await putPublicLink()
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

  it('recovers an imported public submission when no local check-in entry exists', async () => {
    await localDb.publicCheckInSubmissions.put(
      submission({
        status: 'imported',
        importedAt: '2026-06-16T18:00:00.000Z',
      }),
    )

    const skipped = await importPublicCheckInSubmissions(userId, sessionDefinition)
    const recovered = await importPublicCheckInSubmissions(userId, sessionDefinition, {
      recoverImportedWithoutLocalEntry: true,
    })
    const entries = await localDb.playerSessionEntries.where('userId').equals(userId).toArray()
    const updatedSubmission = await localDb.publicCheckInSubmissions.get('submission-1')

    expect(skipped).toEqual({ imported: 0, conflicts: 0, superseded: 0 })
    expect(recovered).toMatchObject({ imported: 1, conflicts: 0, superseded: 0 })
    expect(entries[0]).toMatchObject({
      playerId: player.id,
      present: true,
      readiness: 3,
      checkInSource: 'player_link',
      playerSubmittedAt: '2026-06-16T17:45:00.000Z',
    })
    expect(updatedSubmission?.status).toBe('imported')
    expect(updatedSubmission?.importedAt).toBe('2026-06-16T18:00:00.000Z')
  })

  it('does not recover an imported public submission over an existing active check-in entry', async () => {
    const sessionLog = await ensureSessionLog(userId, sessionDefinition)
    await saveCheckInEntry(userId, sessionLog.id, player, { observation: 'Coach hat Eintrag schon lokal' })
    await localDb.publicCheckInSubmissions.put(
      submission({
        status: 'imported',
        importedAt: '2026-06-16T18:00:00.000Z',
      }),
    )

    const result = await importPublicCheckInSubmissions(userId, sessionDefinition, {
      recoverImportedWithoutLocalEntry: true,
    })
    const entry = await localDb.playerSessionEntries.where('userId').equals(userId).first()

    expect(result).toEqual({ imported: 0, conflicts: 0, superseded: 0 })
    expect(entry?.observation).toBe('Coach hat Eintrag schon lokal')
    expect(entry?.readiness).not.toBe(3)
  })

  it('marks an imported orphan as conflict when the player is no longer active', async () => {
    await localDb.players.put({ ...player, active: false })
    await localDb.publicCheckInSubmissions.put(
      submission({
        status: 'imported',
        importedAt: '2026-06-16T18:00:00.000Z',
      }),
    )

    const result = await importPublicCheckInSubmissions(userId, sessionDefinition, {
      recoverImportedWithoutLocalEntry: true,
    })
    const updatedSubmission = await localDb.publicCheckInSubmissions.get('submission-1')
    const entries = await localDb.playerSessionEntries.where('userId').equals(userId).toArray()

    expect(result).toEqual({ imported: 0, conflicts: 1, superseded: 0 })
    expect(updatedSubmission).toMatchObject({
      status: 'conflict',
      conflictReason: 'Spieler ist nicht aktiv oder nicht vorhanden.',
    })
    expect(entries).toHaveLength(0)
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

  it('allows public import again after a reset clears coach edit metadata', async () => {
    const sessionLog = await ensureSessionLog(userId, sessionDefinition)
    await saveCheckInEntry(userId, sessionLog.id, player, { readiness: 5 })
    await localDb.publicCheckInSubmissions.put(
      submission({ id: 'blocked-before-reset', submittedAt: '2026-06-16T18:10:00.000Z' }),
    )

    const blocked = await importPublicCheckInSubmissions(userId, sessionDefinition)
    await resetAllCheckInsForSession(userId, sessionLog.id)
    await localDb.publicCheckInSubmissions.put(
      submission({ id: 'after-reset', readiness: 2, submittedAt: '2026-06-16T18:20:00.000Z' }),
    )
    const imported = await importPublicCheckInSubmissions(userId, sessionDefinition)
    const entries = await localDb.playerSessionEntries.where('userId').equals(userId).toArray()
    const activeEntry = entries.find((entry) => entry.playerId === player.id && !entry.deletedAt)
    const resetEntry = entries.find((entry) => entry.playerId === player.id && entry.deletedAt)

    expect(blocked).toMatchObject({ imported: 0, conflicts: 1 })
    expect(imported).toMatchObject({ imported: 1, conflicts: 0 })
    expect(resetEntry?.deletedAt).toBeTruthy()
    expect(activeEntry).toMatchObject({
      readiness: 2,
      checkInSource: 'player_link',
      coachEditedAt: null,
    })
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

  it('marks all local public submissions for the session as reset', async () => {
    await putPublicLink('other-link', 'other-session')
    await localDb.publicCheckInSubmissions.bulkPut([
      submission({ id: 'pending-submission', status: 'pending' }),
      submission({ id: 'imported-submission', status: 'imported', importedAt: '2026-06-16T18:00:00.000Z' }),
      submission({ id: 'already-reset-submission', status: 'reset' }),
      submission({ id: 'other-session-submission', linkId: 'other-link', status: 'pending' }),
    ])

    const resetCount = await resetPublicCheckInSubmissionsForSession(userId, sessionDefinition.id)

    await expect(localDb.publicCheckInSubmissions.get('pending-submission')).resolves.toMatchObject({
      status: 'reset',
      importedAt: null,
      conflictReason: null,
    })
    await expect(localDb.publicCheckInSubmissions.get('imported-submission')).resolves.toMatchObject({
      status: 'reset',
      importedAt: null,
      conflictReason: null,
    })
    await expect(localDb.publicCheckInSubmissions.get('already-reset-submission')).resolves.toMatchObject({
      status: 'reset',
    })
    await expect(localDb.publicCheckInSubmissions.get('other-session-submission')).resolves.toMatchObject({
      status: 'pending',
    })
    expect(resetCount).toBe(2)
  })

  it('does not import pending submissions from another session into the selected session', async () => {
    await putPublicLink('other-link', 'other-session')
    await localDb.publicCheckInSubmissions.put(
      submission({ id: 'other-session-submission', linkId: 'other-link', readiness: 5, status: 'pending' }),
    )

    const result = await importPublicCheckInSubmissions(userId, sessionDefinition)
    const entries = await localDb.playerSessionEntries.where('userId').equals(userId).toArray()
    const otherSubmission = await localDb.publicCheckInSubmissions.get('other-session-submission')

    expect(result).toEqual({ imported: 0, conflicts: 0, superseded: 0 })
    expect(entries).toHaveLength(0)
    expect(otherSubmission?.status).toBe('pending')
  })
})
