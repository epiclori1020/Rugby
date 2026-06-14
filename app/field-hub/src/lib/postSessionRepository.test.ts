import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ProgressEntryRow } from './postSessionRepository'
import {
  listProgressEntriesForSession,
  progressEntryFromRow,
  rowFromProgressEntry,
  saveProgressEntry,
} from './postSessionRepository'
import { localDb } from './localDb'

const userId = '00000000-0000-4000-8000-000000000001'

const remoteProgressRow: ProgressEntryRow = {
  id: 'progress-remote',
  user_id: userId,
  player_id: 'player-remote',
  session_log_id: 'session-remote',
  main_exercise: 'Trap Bar Deadlift',
  load: '90 kg',
  reps: '3x5',
  rpe: '7',
  power_or_sprint: '4x10 m smooth',
  conditioning: 'Airbike short',
  note: 'Sauber, steigern',
  created_at: '2026-06-16T18:00:00.000Z',
  updated_at: '2026-06-16T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-16T18:05:00.000Z',
}

describe('postSessionRepository progress entries', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('maps progress entries to and from Supabase rows', () => {
    const entry = progressEntryFromRow(remoteProgressRow)
    const row = rowFromProgressEntry(entry)

    expect(entry.mainExercise).toBe('Trap Bar Deadlift')
    expect(entry.powerOrSprint).toBe('4x10 m smooth')
    expect(row.main_exercise).toBe('Trap Bar Deadlift')
    expect(row.power_or_sprint).toBe('4x10 m smooth')
  })

  it('creates one pending progress write for a player and session', async () => {
    const saved = await saveProgressEntry(userId, 'session-1', 'player-1', {
      mainExercise: 'Back Squat',
      load: '80 kg',
      reps: '3x5',
      rpe: '8',
      powerOrSprint: 'Broad jump OK',
      conditioning: 'Gestrichen',
      note: 'Halten',
    })

    expect(saved.syncStatus).toBe('pending')
    await expect(localDb.progressEntries.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listProgressEntriesForSession(userId, 'session-1')).resolves.toMatchObject([
      { playerId: 'player-1', mainExercise: 'Back Squat', load: '80 kg' },
    ])
  })

  it('updates the existing player progress entry instead of duplicating rows', async () => {
    await saveProgressEntry(userId, 'session-1', 'player-1', { mainExercise: 'Back Squat', rpe: '8' })
    await saveProgressEntry(userId, 'session-1', 'player-1', { mainExercise: 'Trap Bar Deadlift', rpe: '7' })

    await expect(localDb.progressEntries.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listProgressEntriesForSession(userId, 'session-1')).resolves.toMatchObject([
      { playerId: 'player-1', mainExercise: 'Trap Bar Deadlift', rpe: '7' },
    ])
  })
})
