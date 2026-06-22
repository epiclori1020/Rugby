import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localDb } from './localDb'
import type { SessionBlockLogRow } from './sessionBlockRepository'

const remoteRows = vi.hoisted(() => [] as SessionBlockLogRow[])
const inFilter = vi.hoisted(() => vi.fn())
const isFilter = vi.hoisted(() => vi.fn())
const upsertError = vi.hoisted(() => ({ current: null as { message: string } | null }))

const fromMock = vi.hoisted(() =>
  vi.fn(() => {
    const query = {
      eq: vi.fn(() => query),
      in: inFilter,
      is: isFilter,
      select: vi.fn(() => query),
      upsert: vi.fn(() => ({
        select: vi.fn(async () => ({ data: [] as { id: string }[], error: upsertError.current })),
      })),
      then: (resolve: (value: { data: SessionBlockLogRow[]; error: null }) => unknown) =>
        resolve({ data: [...remoteRows], error: null }),
    }
    inFilter.mockReturnValue(query)
    isFilter.mockImplementation(async () => ({
      data: remoteRows.filter((row) => row.deleted_at === null),
      error: null,
    }))
    return query
  }),
)

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

const userId = '00000000-0000-4000-8000-000000000001'

const remoteRow: SessionBlockLogRow = {
  id: 'block-log-remote',
  user_id: userId,
  session_log_id: 'session-log-1',
  session_definition_id: 'session-def-1',
  block_key: 'session-def-1:speed',
  block_title: 'Speed',
  block_order: 10,
  planned_time: '10-20',
  planned_work: '4x10 m',
  status: 'skipped',
  reason: 'time',
  coach_note: '',
  created_at: '2026-06-18T18:00:00.000Z',
  updated_at: '2026-06-18T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-18T18:05:00.000Z',
}

describe('sessionBlockRepository sync', () => {
  beforeEach(async () => {
    remoteRows.length = 0
    upsertError.current = null
    fromMock.mockClear()
    inFilter.mockClear()
    isFilter.mockClear()
    await localDb.delete()
    await localDb.open()
  })

  it('pulls remote session block tombstones so cleared block logs disappear on other devices', async () => {
    const { refreshRemoteSessionBlockLogs } = await import('./sessionBlockRepository')
    remoteRows.push({ ...remoteRow, deleted_at: '2026-06-18T19:00:00.000Z' })

    await refreshRemoteSessionBlockLogs(userId, { sessionLogIds: ['session-log-1'] })

    expect(inFilter).toHaveBeenCalledWith('session_log_id', ['session-log-1'])
    await expect(localDb.sessionBlockLogs.get(remoteRow.id)).resolves.toMatchObject({
      deletedAt: '2026-06-18T19:00:00.000Z',
      syncStatus: 'synced',
    })
  })

  it('marks pending session block logs as error and keeps the pending write when upsert fails', async () => {
    const { syncPendingSessionBlockLogs, sessionBlockLogFromRow } = await import('./sessionBlockRepository')
    const entry = sessionBlockLogFromRow(remoteRow, 'pending')
    await localDb.sessionBlockLogs.put(entry)
    await localDb.pendingWrites.add({
      table: 'session_block_logs',
      operation: 'upsert',
      recordId: entry.id,
      userId,
      createdAt: entry.clientUpdatedAt,
    })
    upsertError.current = { message: 'rls denied' }

    await expect(syncPendingSessionBlockLogs(userId)).rejects.toThrow('rls denied')

    await expect(localDb.sessionBlockLogs.get(entry.id)).resolves.toMatchObject({
      syncStatus: 'error',
      syncError: 'rls denied',
    })
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })
})
