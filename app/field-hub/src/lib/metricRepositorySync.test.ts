import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localDb } from './localDb'
import { metricResultFromRow, refreshRemoteMetricResults, syncPendingMetricResults, type MetricResultRow } from './metricRepository'

const upsert = vi.fn()
const select = vi.fn()
const eq = vi.fn()
const inFilter = vi.fn()
const isFilter = vi.fn()
const order = vi.fn()
const limit = vi.fn()
let remoteMetricRows: MetricResultRow[] = []

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => {
      const query = {
        upsert,
        select,
        eq,
        in: inFilter,
        is: isFilter,
        order,
        limit,
        then: (resolve: (value: { data: MetricResultRow[]; error: null }) => unknown) =>
          resolve({ data: remoteMetricRows, error: null }),
      }
      return query
    }),
  },
}))

const userId = '00000000-0000-4000-8000-000000000001'

const remoteMetricRow: MetricResultRow = {
  id: 'metric-remote',
  user_id: userId,
  player_id: 'player-1',
  session_log_id: 'session-1',
  metric_key: 'sprint_10m',
  value: 1.84,
  attempt: 1,
  is_valid: true,
  body_side: 'none',
  context_note: '',
  created_at: '2026-06-18T18:00:00.000Z',
  updated_at: '2026-06-18T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-18T18:05:00.000Z',
}

describe('metricRepository sync', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await localDb.delete()
    await localDb.open()
    remoteMetricRows = [remoteMetricRow]

    upsert.mockReturnValue({ select: vi.fn(async () => ({ data: [{ id: remoteMetricRow.id }], error: null })) })
    select.mockReturnThis()
    eq.mockReturnThis()
    inFilter.mockReturnThis()
    order.mockReturnThis()
    limit.mockReturnThis()
    isFilter.mockImplementation(async () => ({
      data: remoteMetricRows.filter((row) => row.deleted_at === null),
      error: null,
    }))
  })

  it('pushes pending metric rows in bounded batches and clears matching pending writes', async () => {
    const result = metricResultFromRow(remoteMetricRow, 'pending')
    await localDb.metricResults.put(result)
    await localDb.pendingWrites.add({
      table: 'metric_results',
      operation: 'upsert',
      recordId: result.id,
      userId,
      createdAt: '2026-06-18T18:05:00.000Z',
    })

    await expect(syncPendingMetricResults(userId)).resolves.toBe(1)

    expect(upsert).toHaveBeenCalledWith([remoteMetricRow], {
      onConflict: 'user_id,session_log_id,player_id,metric_key,attempt,body_side',
    })
    await expect(localDb.pendingWrites.count()).resolves.toBe(0)
    await expect(localDb.metricResults.get(result.id)).resolves.toMatchObject({ syncStatus: 'synced', syncError: null })
  })

  it('pulls remote metric rows only when scoped by session ids', async () => {
    await refreshRemoteMetricResults(userId, { sessionLogIds: ['session-1'] })

    expect(inFilter).toHaveBeenCalledWith('session_log_id', ['session-1'])
    await expect(localDb.metricResults.get(remoteMetricRow.id)).resolves.toMatchObject({
      metricKey: 'sprint_10m',
      value: 1.84,
    })
  })

  it('pulls bounded player history with a player scope', async () => {
    await refreshRemoteMetricResults(userId, { playerId: 'player-1', limit: 4 })

    expect(eq).toHaveBeenCalledWith('player_id', 'player-1')
    expect(order).toHaveBeenCalledWith('client_updated_at', { ascending: false })
    expect(limit).toHaveBeenCalledWith(4)
  })

  it('rejects unscoped remote pulls for metric results', async () => {
    await expect(refreshRemoteMetricResults(userId, {})).rejects.toThrow('Metric-Pull braucht einen Session- oder Player-Scope')
  })

  it('pulls remote metric tombstones so cleared values disappear on other devices', async () => {
    remoteMetricRows = [{ ...remoteMetricRow, deleted_at: '2026-06-18T19:00:00.000Z' }]

    await refreshRemoteMetricResults(userId, { sessionLogIds: ['session-1'] })

    await expect(localDb.metricResults.get(remoteMetricRow.id)).resolves.toMatchObject({
      deletedAt: '2026-06-18T19:00:00.000Z',
      syncStatus: 'synced',
    })
  })

  it('marks pending metric rows as error and keeps the pending write when upsert fails', async () => {
    const result = metricResultFromRow(remoteMetricRow, 'pending')
    await localDb.metricResults.put(result)
    await localDb.pendingWrites.add({
      table: 'metric_results',
      operation: 'upsert',
      recordId: result.id,
      userId,
      createdAt: result.clientUpdatedAt,
    })
    upsert.mockReturnValue({ select: vi.fn(async () => ({ data: null, error: { message: 'rls denied' } })) })

    await expect(syncPendingMetricResults(userId)).rejects.toThrow('rls denied')

    await expect(localDb.metricResults.get(result.id)).resolves.toMatchObject({
      syncStatus: 'error',
      syncError: 'rls denied',
    })
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })
})
