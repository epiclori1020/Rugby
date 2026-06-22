import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  exerciseResultFromRow,
  getExerciseSyncOverview,
  listExerciseResultsForSession,
  listRecentExerciseResultsForPlayer,
  rowFromExerciseResult,
  saveExerciseResult,
  type ExerciseResultRow,
} from './exerciseRepository'
import { localDb } from './localDb'

const userId = '00000000-0000-4000-8000-000000000001'

const remoteExerciseRow: ExerciseResultRow = {
  id: 'exercise-remote',
  user_id: userId,
  player_id: 'player-1',
  session_log_id: 'session-remote',
  exercise_key: 'trap_bar_deadlift',
  variant: 'A',
  sets: 3,
  reps: '5',
  load_value: 90,
  load_unit: 'kg',
  rpe: 7,
  rir: null,
  technique_quality: 'good',
  pain_response: 'none',
  notes: 'sauber',
  created_at: '2026-06-18T18:00:00.000Z',
  updated_at: '2026-06-18T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-18T18:05:00.000Z',
}

describe('exerciseRepository', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('maps exercise results to and from Supabase rows', () => {
    const result = exerciseResultFromRow(remoteExerciseRow)
    const row = rowFromExerciseResult(result)

    expect(result.exerciseKey).toBe('trap_bar_deadlift')
    expect(result.loadValue).toBe(90)
    expect(result.techniqueQuality).toBe('good')
    expect(row.exercise_key).toBe('trap_bar_deadlift')
    expect(row.technique_quality).toBe('good')
  })

  it('creates one pending exercise write per player, session and exercise key', async () => {
    const saved = await saveExerciseResult(userId, 'session-1', 'player-1', {
      exerciseKey: 'trap_bar_deadlift',
      variant: 'A',
      sets: '3',
      reps: '5',
      loadValue: '90',
      loadUnit: 'kg',
      rpe: '7',
    })

    if (!saved) {
      throw new Error('Exercise result was not saved.')
    }
    expect(saved.syncStatus).toBe('pending')
    await expect(localDb.exerciseResults.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listExerciseResultsForSession(userId, 'session-1')).resolves.toMatchObject([
      { playerId: 'player-1', exerciseKey: 'trap_bar_deadlift', sets: 3, reps: '5', loadValue: 90 },
    ])
  })

  it('updates an existing exercise result instead of duplicating natural keys', async () => {
    await saveExerciseResult(userId, 'session-1', 'player-1', {
      exerciseKey: 'trap_bar_deadlift',
      sets: 3,
      reps: '5',
      loadValue: 90,
    })
    await saveExerciseResult(userId, 'session-1', 'player-1', {
      exerciseKey: 'trap_bar_deadlift',
      sets: 4,
      reps: '4',
      loadValue: 95,
    })

    await expect(localDb.exerciseResults.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listExerciseResultsForSession(userId, 'session-1')).resolves.toMatchObject([
      { exerciseKey: 'trap_bar_deadlift', sets: 4, reps: '4', loadValue: 95 },
    ])
  })

  it('replaces the source exercise when a player row changes exercise key', async () => {
    const source = await saveExerciseResult(userId, 'session-1', 'player-1', {
      exerciseKey: 'trap_bar_deadlift',
      sets: 3,
      reps: '5',
      loadValue: 90,
    })
    if (!source) {
      throw new Error('Exercise result was not saved.')
    }

    await saveExerciseResult(userId, 'session-1', 'player-1', {
      sourceResultId: source.id,
      exerciseKey: 'goblet_squat',
      sets: 3,
      reps: '8',
      loadValue: 32,
    })

    const allResults = await localDb.exerciseResults.toArray()
    expect(allResults).toHaveLength(2)
    expect(allResults.find((result) => result.id === source.id)?.deletedAt).not.toBeNull()
    await expect(listExerciseResultsForSession(userId, 'session-1')).resolves.toMatchObject([
      { exerciseKey: 'goblet_squat', sets: 3, reps: '8', loadValue: 32 },
    ])
    await expect(localDb.pendingWrites.count()).resolves.toBe(2)
  })

  it('soft-deletes existing exercise results when saved content is cleared', async () => {
    const saved = await saveExerciseResult(userId, 'session-1', 'player-1', {
      exerciseKey: 'trap_bar_deadlift',
      sets: 3,
      reps: '5',
      loadValue: 90,
    })
    if (!saved) {
      throw new Error('Exercise result was not saved.')
    }

    const deleted = await saveExerciseResult(userId, 'session-1', 'player-1', {
      exerciseKey: 'trap_bar_deadlift',
      sets: null,
      reps: '',
      loadValue: null,
      rpe: null,
      rir: null,
      notes: '',
    })

    expect(deleted).toMatchObject({ id: saved.id, syncStatus: 'pending' })
    expect(deleted?.deletedAt).not.toBeNull()
    await expect(listExerciseResultsForSession(userId, 'session-1')).resolves.toEqual([])
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('keeps recent player exercise history bounded and newest first', async () => {
    await localDb.exerciseResults.bulkPut([
      exerciseResultFromRow({
        ...remoteExerciseRow,
        id: 'old',
        session_log_id: 'old-session',
        client_updated_at: '2026-06-16T18:05:00.000Z',
      }),
      exerciseResultFromRow({
        ...remoteExerciseRow,
        id: 'new',
        session_log_id: 'new-session',
        client_updated_at: '2026-06-18T18:05:00.000Z',
      }),
      exerciseResultFromRow({ ...remoteExerciseRow, id: 'deleted', deleted_at: '2026-06-19T18:05:00.000Z' }),
    ])

    const history = await listRecentExerciseResultsForPlayer(userId, 'player-1', 2)

    expect(history.map((result) => result.id)).toEqual(['new', 'old'])
  })

  it('counts pending exercise writes in a dedicated exercise sync overview', async () => {
    await localDb.exerciseResults.put(exerciseResultFromRow(remoteExerciseRow, 'pending'))
    await localDb.pendingWrites.add({
      table: 'exercise_results',
      operation: 'upsert',
      recordId: remoteExerciseRow.id,
      userId,
      createdAt: '2026-06-18T18:05:00.000Z',
    })

    await expect(getExerciseSyncOverview(userId)).resolves.toMatchObject({
      status: 'pending',
      pendingCount: 1,
    })
  })
})
