import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionLog } from '../domain/checkIn'
import {
  baselineEntryFromRow,
  getBaselineSyncOverview,
  listBaselineEntriesForSession,
  listLatestBaselineEntriesByPlayer,
  rowFromBaselineEntry,
  saveBaselineEntry,
  type BaselineEntryRow,
} from './baselineRepository'
import { localDb } from './localDb'

const userId = '00000000-0000-4000-8000-000000000001'

function sessionLog(overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    id: 'session-1',
    userId,
    sessionDefinitionId: 'session-def-1',
    date: '2026-06-18',
    status: 'planned',
    coach: '',
    groupSize: null,
    weatherOrHeatNote: '',
    planChanged: false,
    durationMinutes: null,
    contactIndex: '',
    speedExposureNote: '',
    coachReview: '',
    createdAt: '2026-06-18T18:00:00.000Z',
    updatedAt: '2026-06-18T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-18T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

const remoteBaselineRow: BaselineEntryRow = {
  id: 'baseline-remote',
  user_id: userId,
  player_id: 'player-1',
  session_log_id: 'session-remote',
  broad_jump_cm: 245,
  med_ball_chest_pass_m: 6.25,
  med_ball_weight_kg: 5,
  sprint_30m: null,
  note: 'ruhige Mini-Baseline',
  created_at: '2026-06-18T18:00:00.000Z',
  updated_at: '2026-06-18T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-18T18:05:00.000Z',
}

describe('baselineRepository', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('maps baseline entries to and from Supabase rows', () => {
    const entry = baselineEntryFromRow(remoteBaselineRow)
    const row = rowFromBaselineEntry(entry)

    expect(entry.broadJumpCm).toBe(245)
    expect(entry.medBallChestPassM).toBe(6.25)
    expect(entry.medBallWeightKg).toBe(5)
    expect(row.broad_jump_cm).toBe(245)
    expect(row.med_ball_chest_pass_m).toBe(6.25)
    expect(row.med_ball_weight_kg).toBe(5)
  })

  it('creates one pending baseline write for a player and session', async () => {
    const saved = await saveBaselineEntry(userId, 'session-1', 'player-1', {
      broadJumpCm: 245,
      medBallChestPassM: 6.25,
      medBallWeightKg: 5,
    })

    expect(saved.syncStatus).toBe('pending')
    await expect(localDb.baselineEntries.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listBaselineEntriesForSession(userId, 'session-1')).resolves.toMatchObject([
      { playerId: 'player-1', broadJumpCm: 245, medBallChestPassM: 6.25, medBallWeightKg: 5 },
    ])
  })

  it('updates the existing player baseline entry instead of duplicating rows', async () => {
    await saveBaselineEntry(userId, 'session-1', 'player-1', { broadJumpCm: 240 })
    await saveBaselineEntry(userId, 'session-1', 'player-1', { broadJumpCm: 248, note: 'besserer Versuch' })

    await expect(localDb.baselineEntries.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listBaselineEntriesForSession(userId, 'session-1')).resolves.toMatchObject([
      { playerId: 'player-1', broadJumpCm: 248, note: 'besserer Versuch' },
    ])
  })

  it('returns latest baseline by player using session date before client timestamp', async () => {
    await localDb.sessionLogs.bulkPut([
      sessionLog({ id: 'old-session', date: '2026-06-18' }),
      sessionLog({ id: 'new-session', date: '2026-07-02' }),
    ])
    await localDb.baselineEntries.bulkPut([
      baselineEntryFromRow({
        ...remoteBaselineRow,
        id: 'old-baseline',
        session_log_id: 'old-session',
        broad_jump_cm: 245,
        client_updated_at: '2026-07-03T18:00:00.000Z',
      }),
      baselineEntryFromRow({
        ...remoteBaselineRow,
        id: 'new-baseline',
        session_log_id: 'new-session',
        broad_jump_cm: 252,
        client_updated_at: '2026-07-02T18:00:00.000Z',
      }),
    ])

    const latestByPlayer = await listLatestBaselineEntriesByPlayer(userId)

    expect(latestByPlayer.get('player-1')).toMatchObject({
      id: 'new-baseline',
      broadJumpCm: 252,
      sessionDate: '2026-07-02',
    })
  })

  it('counts pending baseline writes in a dedicated baseline sync overview', async () => {
    await localDb.baselineEntries.put(baselineEntryFromRow(remoteBaselineRow, 'pending'))
    await localDb.pendingWrites.add({
      table: 'baseline_entries',
      operation: 'upsert',
      recordId: remoteBaselineRow.id,
      userId,
      createdAt: '2026-06-18T18:05:00.000Z',
    })

    await expect(getBaselineSyncOverview(userId)).resolves.toMatchObject({
      status: 'pending',
      pendingCount: 1,
    })
  })
})
