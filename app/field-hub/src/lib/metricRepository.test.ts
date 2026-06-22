import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  getMetricSyncOverview,
  listMetricResultsForSession,
  listRecentMetricResultsForPlayer,
  metricResultFromRow,
  rowFromMetricResult,
  saveMetricResult,
  type MetricResultRow,
} from './metricRepository'
import { localDb } from './localDb'

const userId = '00000000-0000-4000-8000-000000000001'

const remoteMetricRow: MetricResultRow = {
  id: 'metric-remote',
  user_id: userId,
  player_id: 'player-1',
  session_log_id: 'session-remote',
  metric_key: 'broad_jump',
  value: 246,
  attempt: 1,
  is_valid: true,
  body_side: 'none',
  context_note: 'best of 2',
  created_at: '2026-06-18T18:00:00.000Z',
  updated_at: '2026-06-18T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-18T18:05:00.000Z',
}

describe('metricRepository', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('maps metric results to and from Supabase rows', () => {
    const result = metricResultFromRow(remoteMetricRow)
    const row = rowFromMetricResult(result)

    expect(result.metricKey).toBe('broad_jump')
    expect(result.value).toBe(246)
    expect(result.contextNote).toBe('best of 2')
    expect(row.metric_key).toBe('broad_jump')
    expect(row.context_note).toBe('best of 2')
  })

  it('creates one pending metric write per player, session, key, attempt and side', async () => {
    const saved = await saveMetricResult(userId, 'session-1', 'player-1', {
      metricKey: 'med_ball_chest_pass',
      value: '6,25',
      contextNote: '5 kg',
    })

    if (!saved) {
      throw new Error('Metric result was not saved.')
    }
    expect(saved.syncStatus).toBe('pending')
    await expect(localDb.metricResults.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listMetricResultsForSession(userId, 'session-1')).resolves.toMatchObject([
      { playerId: 'player-1', metricKey: 'med_ball_chest_pass', value: 6.25, contextNote: '5 kg' },
    ])
  })

  it('creates metric ids when crypto.randomUUID is unavailable', async () => {
    const originalCrypto = globalThis.crypto
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {},
    })

    try {
      const saved = await saveMetricResult(userId, 'session-1', 'player-1', {
        metricKey: 'broad_jump',
        value: 240,
      })

      expect(saved?.id).toMatch(/^\d+-[a-f0-9]+$/)
      await expect(localDb.metricResults.count()).resolves.toBe(1)
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: originalCrypto,
      })
    }
  })

  it('updates an existing metric result instead of duplicating natural keys', async () => {
    await saveMetricResult(userId, 'session-1', 'player-1', { metricKey: 'broad_jump', value: 240 })
    await saveMetricResult(userId, 'session-1', 'player-1', { metricKey: 'broad_jump', value: 248, attempt: 1 })

    await expect(localDb.metricResults.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listMetricResultsForSession(userId, 'session-1')).resolves.toMatchObject([
      { metricKey: 'broad_jump', value: 248 },
    ])
  })

  it('soft-deletes existing metric results when a saved value is cleared', async () => {
    const saved = await saveMetricResult(userId, 'session-1', 'player-1', { metricKey: 'broad_jump', value: 240 })
    if (!saved) {
      throw new Error('Metric result was not saved.')
    }

    const deleted = await saveMetricResult(userId, 'session-1', 'player-1', { metricKey: 'broad_jump', value: null })

    expect(deleted).toMatchObject({ id: saved.id, syncStatus: 'pending' })
    expect(deleted?.deletedAt).not.toBeNull()
    await expect(listMetricResultsForSession(userId, 'session-1')).resolves.toEqual([])
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('keeps recent player metric history bounded and newest first', async () => {
    await localDb.metricResults.bulkPut([
      metricResultFromRow({ ...remoteMetricRow, id: 'old', session_log_id: 'old-session', client_updated_at: '2026-06-16T18:05:00.000Z' }),
      metricResultFromRow({ ...remoteMetricRow, id: 'new', session_log_id: 'new-session', client_updated_at: '2026-06-18T18:05:00.000Z' }),
      metricResultFromRow({ ...remoteMetricRow, id: 'deleted', deleted_at: '2026-06-19T18:05:00.000Z' }),
    ])

    const history = await listRecentMetricResultsForPlayer(userId, 'player-1', 2)

    expect(history.map((result) => result.id)).toEqual(['new', 'old'])
  })

  it('counts pending metric writes in a dedicated metric sync overview', async () => {
    await localDb.metricResults.put(metricResultFromRow(remoteMetricRow, 'pending'))
    await localDb.pendingWrites.add({
      table: 'metric_results',
      operation: 'upsert',
      recordId: remoteMetricRow.id,
      userId,
      createdAt: '2026-06-18T18:05:00.000Z',
    })

    await expect(getMetricSyncOverview(userId)).resolves.toMatchObject({
      status: 'pending',
      pendingCount: 1,
    })
  })
})
