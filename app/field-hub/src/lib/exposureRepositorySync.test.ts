import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyExposureStatuses, type PlayerExposureSummary } from '../domain/exposures'
import type { PlayerExposureSummaryRow } from './exposureRepository'
import { localDb } from './localDb'

const upsertCalls = vi.hoisted(() => [] as unknown[][])
const remoteRows = vi.hoisted(() => [] as PlayerExposureSummaryRow[])
const upsertError = vi.hoisted(() => ({ current: null as { message: string } | null }))
const fromMock = vi.hoisted(() =>
  vi.fn(() => {
    const query = {
      eq: vi.fn(() => query),
      in: vi.fn(() => query),
      is: vi.fn(async () => ({ data: remoteRows.filter((row) => row.deleted_at === null), error: null })),
      limit: vi.fn(() => query),
      order: vi.fn(() => query),
      select: vi.fn(() => query),
      then: (resolve: (value: { data: PlayerExposureSummaryRow[]; error: null }) => unknown) =>
        resolve({ data: [...remoteRows], error: null }),
      upsert: vi.fn((rows: unknown[]) => {
        upsertCalls.push(rows)
        return {
          select: vi.fn(async () => ({ data: [] as { id: string }[], error: upsertError.current })),
        }
      }),
    }
    return query
  }),
)

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

const userId = '00000000-0000-4000-8000-000000000001'

function summary(index: number): PlayerExposureSummary {
  const timestamp = `2026-06-18T18:${String(index).padStart(2, '0')}:00.000Z`

  return {
    id: `summary-${index}`,
    userId,
    playerId: `player-${index}`,
    sessionLogId: 'session-log-1',
    sessionDefinitionId: 'session-def-1',
    sessionDate: '2026-06-18',
    statuses: { ...createEmptyExposureStatuses(), speed: 'completed' },
    sources: {},
    manualOverrides: {},
    coachNote: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    clientUpdatedAt: timestamp,
    syncStatus: 'pending',
    syncError: null,
  }
}

function row(overrides: Partial<PlayerExposureSummaryRow> = {}): PlayerExposureSummaryRow {
  return {
    id: 'remote-summary',
    user_id: userId,
    player_id: 'player-1',
    session_log_id: 'session-log-1',
    session_definition_id: 'session-def-1',
    session_date: '2026-06-18',
    speed_status: 'completed',
    acceleration_status: 'none',
    cod_decel_status: 'none',
    lower_strength_status: 'none',
    upper_strength_status: 'none',
    power_status: 'none',
    conditioning_status: 'none',
    contact_prep_status: 'none',
    neck_trunk_status: 'none',
    mobility_status: 'none',
    reconditioning_status: 'none',
    sources: {},
    manual_overrides: {},
    coach_note: '',
    created_at: '2026-06-18T18:10:00.000Z',
    updated_at: '2026-06-18T18:10:00.000Z',
    deleted_at: null,
    client_updated_at: '2026-06-18T18:10:00.000Z',
    ...overrides,
  }
}

describe('exposureRepository sync bounds', () => {
  beforeEach(async () => {
    upsertCalls.length = 0
    remoteRows.length = 0
    upsertError.current = null
    fromMock.mockClear()
    await localDb.delete()
    await localDb.open()
  })

  it('pushes pending exposure summaries in bounded batches', async () => {
    const { syncPendingExposureSummaries } = await import('./exposureRepository')
    const summaries = Array.from({ length: 55 }, (_, index) => summary(index))
    await localDb.playerExposureSummaries.bulkPut(summaries)
    await localDb.pendingWrites.bulkAdd(
      summaries.map((entry) => ({
        table: 'player_exposure_summaries',
        operation: 'upsert',
        recordId: entry.id,
        userId,
        createdAt: entry.createdAt,
      })),
    )

    await syncPendingExposureSummaries(userId)

    expect(upsertCalls.map((rows) => rows.length)).toEqual([50, 5])
  })

  it('rejects unscoped remote exposure pulls', async () => {
    const { refreshRemoteExposureSummaries } = await import('./exposureRepository')

    await expect(refreshRemoteExposureSummaries(userId, {})).rejects.toThrow('Exposure-Pull braucht einen Session- oder Player-Scope.')
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('deduplicates remote exposure pulls by player and session natural key', async () => {
    const { refreshRemoteExposureSummaries } = await import('./exposureRepository')
    await localDb.playerExposureSummaries.put({
      ...summary(1),
      id: 'local-summary',
      playerId: 'player-1',
      sessionLogId: 'session-log-1',
      clientUpdatedAt: '2026-06-18T18:00:00.000Z',
      syncStatus: 'synced',
    })
    remoteRows.push(row())

    await refreshRemoteExposureSummaries(userId, { sessionLogIds: ['session-log-1'] })

    await expect(localDb.playerExposureSummaries.get('local-summary')).resolves.toBeUndefined()
    await expect(localDb.playerExposureSummaries.get('remote-summary')).resolves.toMatchObject({
      playerId: 'player-1',
      sessionLogId: 'session-log-1',
      syncStatus: 'synced',
    })
    await expect(localDb.playerExposureSummaries.count()).resolves.toBe(1)
  })

  it('pulls remote exposure tombstones so stale summaries disappear on other devices', async () => {
    const { refreshRemoteExposureSummaries } = await import('./exposureRepository')
    remoteRows.push(row({ deleted_at: '2026-06-18T19:00:00.000Z' }))

    await refreshRemoteExposureSummaries(userId, { sessionLogIds: ['session-log-1'] })

    await expect(localDb.playerExposureSummaries.get('remote-summary')).resolves.toMatchObject({
      deletedAt: '2026-06-18T19:00:00.000Z',
      syncStatus: 'synced',
    })
  })

  it('marks pending exposure summaries as error and keeps the pending write when upsert fails', async () => {
    const { syncPendingExposureSummaries } = await import('./exposureRepository')
    const entry = summary(1)
    await localDb.playerExposureSummaries.put(entry)
    await localDb.pendingWrites.add({
      table: 'player_exposure_summaries',
      operation: 'upsert',
      recordId: entry.id,
      userId,
      createdAt: entry.createdAt,
    })
    upsertError.current = { message: 'rls denied' }

    await expect(syncPendingExposureSummaries(userId)).rejects.toThrow('rls denied')

    await expect(localDb.playerExposureSummaries.get(entry.id)).resolves.toMatchObject({
      syncStatus: 'error',
      syncError: 'rls denied',
    })
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })
})
