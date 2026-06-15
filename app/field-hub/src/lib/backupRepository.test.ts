import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyCheckInDraft } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ProgressEntry } from '../domain/postSession'
import {
  createFieldHubBackup,
  importFieldHubBackup,
  previewFieldHubBackupImport,
  setLastExportAt,
  getLastExportAt,
} from './backupRepository'
import { localDb } from './localDb'

const userId = '00000000-0000-4000-8000-000000000001'
const otherUserId = '00000000-0000-4000-8000-000000000002'

const player: Player = {
  id: 'player-1',
  userId,
  name: 'Test Spieler',
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

const progressEntry: ProgressEntry = {
  id: 'progress-1',
  userId,
  playerId: 'player-1',
  sessionLogId: 'session-log-1',
  mainExercise: 'Trap Bar Deadlift',
  load: '90 kg',
  reps: '5',
  rpe: '8',
  powerOrSprint: '',
  conditioning: '',
  note: '',
  createdAt: '2026-06-18T19:00:00.000Z',
  updatedAt: '2026-06-18T19:05:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T19:05:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

describe('backupRepository', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('creates a complete local backup for the signed-in user', async () => {
    await localDb.players.put(player)
    await localDb.sessionLogs.put({
      id: 'session-log-1',
      userId,
      sessionDefinitionId: 'session-def-1',
      date: '2026-06-18',
      status: 'completed',
      coach: '',
      groupSize: null,
      weatherOrHeatNote: '',
      planChanged: false,
      durationMinutes: 75,
      contactIndex: '',
      speedExposureNote: '',
      coachReview: '',
      createdAt: '2026-06-18T18:00:00.000Z',
      updatedAt: '2026-06-18T20:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-18T20:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    })
    await localDb.playerSessionEntries.put({
      ...emptyCheckInDraft,
      id: 'entry-1',
      userId,
      sessionLogId: 'session-log-1',
      playerId: 'player-1',
      sessionRpe: 7,
      durationMinutes: 75,
      sessionLoad: 525,
      postPainScore: null,
      postPainLocation: '',
      e2Decision: null,
      nextStep: null,
      createdAt: '2026-06-18T18:05:00.000Z',
      updatedAt: '2026-06-18T18:05:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-18T18:05:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    })
    await localDb.progressEntries.put(progressEntry)

    const backup = await createFieldHubBackup(userId)

    expect(backup.type).toBe('rugby-field-hub-full-backup')
    expect(backup.version).toBe(1)
    expect(backup.data.players).toHaveLength(1)
    expect(backup.data.sessionLogs).toHaveLength(1)
    expect(backup.data.playerSessionEntries).toHaveLength(1)
    expect(backup.data.progressEntries).toHaveLength(1)
    expect(backup.data.baselineEntries).toEqual([])
    expect(backup.data.returnerEntries).toEqual([])
  })

  it('previews import records without mutating local data', async () => {
    await localDb.players.put(player)
    const backup = await createFieldHubBackup(userId)
    backup.data.players = [
      { ...player, name: 'Neuer Spieler', id: 'player-2', clientUpdatedAt: '2026-06-17T18:00:00.000Z' },
      { ...player, name: 'Remote neuer', clientUpdatedAt: '2026-06-17T18:00:00.000Z' },
    ]

    const preview = await previewFieldHubBackupImport(userId, backup)

    expect(preview.valid).toBe(true)
    expect(preview.totals.newRecords).toBe(1)
    expect(preview.totals.overwriteCandidates).toBe(1)
    expect(await localDb.players.count()).toBe(1)
  })

  it('rejects backups from another user', async () => {
    const backup = await createFieldHubBackup(userId)
    backup.data.players = [{ ...player, userId: otherUserId }]

    const preview = await previewFieldHubBackupImport(userId, backup)

    expect(preview.valid).toBe(false)
    expect(preview.errors).toContain('Backup enthaelt Daten eines anderen Coach-Users.')
  })

  it('rejects malformed records before import', async () => {
    const backup = await createFieldHubBackup(userId)
    backup.data.players = [{ id: 'broken-player', userId, clientUpdatedAt: '2026-06-17T18:00:00.000Z' } as Player]

    const preview = await previewFieldHubBackupImport(userId, backup)

    expect(preview.valid).toBe(false)
    expect(preview.errors).toContain('Backup enthaelt ungueltige Daten in players.')
  })

  it('imports confirmed records as pending writes without deleting local data', async () => {
    await localDb.players.put(player)
    const backup = await createFieldHubBackup(userId)
    backup.data.players = [
      { ...player, name: 'Neuer Spieler', id: 'player-2', clientUpdatedAt: '2026-06-17T18:00:00.000Z' },
      { ...player, name: 'Remote neuer', clientUpdatedAt: '2026-06-17T18:00:00.000Z' },
    ]

    const result = await importFieldHubBackup(userId, backup, { confirmOverwrite: true })

    expect(result.importedRecords).toBe(2)
    await expect(localDb.players.count()).resolves.toBe(2)
    await expect(localDb.pendingWrites.count()).resolves.toBe(2)
    await expect(localDb.players.get('player-1')).resolves.toMatchObject({
      name: 'Remote neuer',
      syncStatus: 'pending',
      syncError: null,
    })
  })

  it('accepts anonymized historical records with nullable player ids', async () => {
    const backup = await createFieldHubBackup(userId)
    backup.data.progressEntries = [{ ...progressEntry, playerId: null }]

    const preview = await previewFieldHubBackupImport(userId, backup)

    expect(preview.valid).toBe(true)
    expect(preview.errors).toEqual([])
  })

  it('stores last export metadata locally per user', async () => {
    await setLastExportAt(userId, '2026-06-18T20:00:00.000Z')

    await expect(getLastExportAt(userId)).resolves.toBe('2026-06-18T20:00:00.000Z')
    await expect(getLastExportAt(otherUserId)).resolves.toBeNull()
  })
})
