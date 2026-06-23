import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import {
  getSessionBlockSyncOverview,
  listSessionBlockLogsForSession,
  resetSessionBlockLogsForSession,
  rowFromSessionBlockLog,
  saveSessionBlockLog,
  sessionBlockLogFromRow,
  type SessionBlockLogRow,
} from './sessionBlockRepository'
import { localDb } from './localDb'

const userId = '00000000-0000-4000-8000-000000000001'

const sessionDefinition: SessionDefinition = {
  id: 'kw25-do-2026-06-18',
  date: '2026-06-18',
  kw: 'KW25',
  title: 'Donnerstag',
  type: 'training',
  summary: '',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [
    {
      key: 'kw25-do-2026-06-18:speed',
      order: 30,
      time: '18-28',
      title: 'Speed',
      work: '4x10 m plus optional 2x15 m.',
    },
  ],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const remoteRow: SessionBlockLogRow = {
  id: 'block-log-remote',
  user_id: userId,
  session_log_id: 'session-log-1',
  session_definition_id: sessionDefinition.id,
  block_key: 'kw25-do-2026-06-18:speed',
  block_title: 'Speed',
  block_order: 30,
  planned_time: '18-28',
  planned_work: '4x10 m plus optional 2x15 m.',
  status: 'skipped',
  reason: 'time',
  coach_note: 'Zeitdruck',
  created_at: '2026-06-18T18:00:00.000Z',
  updated_at: '2026-06-18T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-18T18:05:00.000Z',
}

describe('sessionBlockRepository', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('maps session block logs to and from Supabase rows', () => {
    const entry = sessionBlockLogFromRow(remoteRow)
    const row = rowFromSessionBlockLog(entry)

    expect(entry.blockKey).toBe('kw25-do-2026-06-18:speed')
    expect(entry.status).toBe('skipped')
    expect(entry.reason).toBe('time')
    expect(row.block_key).toBe('kw25-do-2026-06-18:speed')
    expect(row.coach_note).toBe('Zeitdruck')
  })

  it('creates one pending block log for a session and block', async () => {
    const saved = await saveSessionBlockLog(userId, 'session-log-1', sessionDefinition, 'kw25-do-2026-06-18:speed', {
      status: 'skipped',
      reason: 'time',
      coachNote: ' Zeitdruck ',
    })

    expect(saved).toMatchObject({
      sessionLogId: 'session-log-1',
      blockKey: 'kw25-do-2026-06-18:speed',
      blockTitle: 'Speed',
      blockOrder: 30,
      plannedTime: '18-28',
      plannedWork: '4x10 m plus optional 2x15 m.',
      status: 'skipped',
      reason: 'time',
      coachNote: 'Zeitdruck',
      syncStatus: 'pending',
    })
    await expect(localDb.sessionBlockLogs.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('updates the existing block log without duplicate pending writes', async () => {
    await saveSessionBlockLog(userId, 'session-log-1', sessionDefinition, 'kw25-do-2026-06-18:speed', {
      status: 'skipped',
      reason: 'time',
    })
    await saveSessionBlockLog(userId, 'session-log-1', sessionDefinition, 'kw25-do-2026-06-18:speed', {
      status: 'changed',
      reason: 'weather',
    })

    await expect(localDb.sessionBlockLogs.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listSessionBlockLogsForSession(userId, 'session-log-1')).resolves.toMatchObject([
      { blockKey: 'kw25-do-2026-06-18:speed', status: 'changed', reason: 'weather' },
    ])
  })

  it('soft-deletes all active block logs for a session and queues sync writes', async () => {
    const saved = await saveSessionBlockLog(userId, 'session-log-1', sessionDefinition, 'kw25-do-2026-06-18:speed', {
      status: 'done',
      reason: 'none',
    })

    await expect(resetSessionBlockLogsForSession(userId, 'session-log-1')).resolves.toEqual({ resetCount: 1 })
    await expect(listSessionBlockLogsForSession(userId, 'session-log-1')).resolves.toEqual([])

    const deleted = await localDb.sessionBlockLogs.get(saved.id)
    expect(deleted?.deletedAt).toBeTruthy()
    expect(deleted?.syncStatus).toBe('pending')
    await expect(localDb.pendingWrites.toArray()).resolves.toMatchObject([
      { table: 'session_block_logs', recordId: saved.id, operation: 'upsert' },
    ])
  })

  it('reuses a soft-deleted block log when saving the same session and block again', async () => {
    const saved = await saveSessionBlockLog(userId, 'session-log-1', sessionDefinition, 'kw25-do-2026-06-18:speed', {
      status: 'done',
      reason: 'none',
    })

    await resetSessionBlockLogsForSession(userId, 'session-log-1')

    const restarted = await saveSessionBlockLog(userId, 'session-log-1', sessionDefinition, 'kw25-do-2026-06-18:speed', {
      status: 'skipped',
      reason: 'time',
      coachNote: ' Neustart ',
    })

    expect(restarted.id).toBe(saved.id)
    expect(restarted.deletedAt).toBeNull()
    expect(restarted.status).toBe('skipped')
    expect(restarted.reason).toBe('time')
    expect(restarted.coachNote).toBe('Neustart')
    await expect(
      localDb.sessionBlockLogs
        .where('[userId+sessionLogId+blockKey]')
        .equals([userId, 'session-log-1', 'kw25-do-2026-06-18:speed'])
        .toArray(),
    ).resolves.toHaveLength(1)
    await expect(localDb.pendingWrites.toArray()).resolves.toMatchObject([
      { table: 'session_block_logs', recordId: saved.id, operation: 'upsert' },
    ])
  })

  it('counts pending block writes in a dedicated sync overview', async () => {
    await localDb.sessionBlockLogs.put(sessionBlockLogFromRow(remoteRow, 'pending'))
    await localDb.pendingWrites.add({
      table: 'session_block_logs',
      operation: 'upsert',
      recordId: remoteRow.id,
      userId,
      createdAt: '2026-06-18T18:05:00.000Z',
    })

    await expect(getSessionBlockSyncOverview(userId)).resolves.toMatchObject({
      status: 'pending',
      pendingCount: 1,
    })
  })
})
