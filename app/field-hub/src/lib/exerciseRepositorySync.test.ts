import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localDb } from './localDb'
import {
  exerciseResultFromRow,
  refreshRemoteExerciseResults,
  syncPendingExerciseResults,
  type ExerciseResultRow,
} from './exerciseRepository'

const upsert = vi.fn()
const select = vi.fn()
const eq = vi.fn()
const inFilter = vi.fn()
const isFilter = vi.fn()
const order = vi.fn()
const limit = vi.fn()
const queryResult = vi.fn()

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => {
      const builder = {
        upsert,
        select,
        eq,
        in: inFilter,
        is: isFilter,
        order,
        limit,
        then(resolve: (value: unknown) => unknown, reject: (reason?: unknown) => unknown) {
          return queryResult().then(resolve, reject)
        },
      }
      return builder
    }),
  },
}))

const userId = '00000000-0000-4000-8000-000000000001'

const remoteExerciseRow: ExerciseResultRow = {
  id: 'exercise-remote',
  user_id: userId,
  player_id: 'player-1',
  session_log_id: 'session-1',
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
  notes: '',
  created_at: '2026-06-18T18:00:00.000Z',
  updated_at: '2026-06-18T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-18T18:05:00.000Z',
}

describe('exerciseRepository sync', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await localDb.delete()
    await localDb.open()

    upsert.mockReturnValue({ select: vi.fn(async () => ({ data: [{ id: remoteExerciseRow.id }], error: null })) })
    select.mockReturnThis()
    eq.mockReturnThis()
    inFilter.mockReturnThis()
    order.mockReturnThis()
    limit.mockReturnThis()
    isFilter.mockResolvedValue({ data: [remoteExerciseRow], error: null })
    queryResult.mockResolvedValue({ data: [remoteExerciseRow], error: null })
  })

  it('pushes pending exercise rows in bounded batches and clears matching pending writes', async () => {
    const result = exerciseResultFromRow(remoteExerciseRow, 'pending')
    await localDb.exerciseResults.put(result)
    await localDb.pendingWrites.add({
      table: 'exercise_results',
      operation: 'upsert',
      recordId: result.id,
      userId,
      createdAt: '2026-06-18T18:05:00.000Z',
    })

    await expect(syncPendingExerciseResults(userId)).resolves.toBe(1)

    expect(upsert).toHaveBeenCalledWith([remoteExerciseRow], {
      onConflict: 'user_id,session_log_id,player_id,exercise_key',
    })
    await expect(localDb.pendingWrites.count()).resolves.toBe(0)
    await expect(localDb.exerciseResults.get(result.id)).resolves.toMatchObject({ syncStatus: 'synced', syncError: null })
  })

  it('pulls remote exercise rows only when scoped by session ids', async () => {
    await refreshRemoteExerciseResults(userId, { sessionLogIds: ['session-1'] })

    expect(inFilter).toHaveBeenCalledWith('session_log_id', ['session-1'])
    await expect(localDb.exerciseResults.get(remoteExerciseRow.id)).resolves.toMatchObject({
      exerciseKey: 'trap_bar_deadlift',
      loadValue: 90,
    })
  })

  it('pulls remote tombstones so cleared exercise results disappear on other devices', async () => {
    await localDb.exerciseResults.put(exerciseResultFromRow(remoteExerciseRow))
    queryResult.mockResolvedValue({
      data: [{ ...remoteExerciseRow, deleted_at: '2026-06-18T19:00:00.000Z' }],
      error: null,
    })

    await refreshRemoteExerciseResults(userId, { sessionLogIds: ['session-1'] })

    await expect(localDb.exerciseResults.get(remoteExerciseRow.id)).resolves.toMatchObject({
      deletedAt: '2026-06-18T19:00:00.000Z',
    })
    const activeResults = await localDb.exerciseResults.where('userId').equals(userId).and((result) => !result.deletedAt).toArray()
    expect(activeResults).toEqual([])
  })

  it('pulls bounded player history with a player scope', async () => {
    await refreshRemoteExerciseResults(userId, { playerId: 'player-1', limit: 4 })

    expect(eq).toHaveBeenCalledWith('player_id', 'player-1')
    expect(order).toHaveBeenCalledWith('client_updated_at', { ascending: false })
    expect(limit).toHaveBeenCalledWith(4)
  })

  it('rejects unscoped remote pulls for exercise results', async () => {
    await expect(refreshRemoteExerciseResults(userId, {})).rejects.toThrow(
      'Exercise-Pull braucht einen Session- oder Player-Scope',
    )
  })

  it('marks pending exercise rows as error and keeps the pending write when upsert fails', async () => {
    const result = exerciseResultFromRow(remoteExerciseRow, 'pending')
    await localDb.exerciseResults.put(result)
    await localDb.pendingWrites.add({
      table: 'exercise_results',
      operation: 'upsert',
      recordId: result.id,
      userId,
      createdAt: result.clientUpdatedAt,
    })
    upsert.mockReturnValue({ select: vi.fn(async () => ({ data: null, error: { message: 'rls denied' } })) })

    await expect(syncPendingExerciseResults(userId)).rejects.toThrow('rls denied')

    await expect(localDb.exerciseResults.get(result.id)).resolves.toMatchObject({
      syncStatus: 'error',
      syncError: 'rls denied',
    })
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })
})
