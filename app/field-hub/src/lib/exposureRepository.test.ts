import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import { emptyCheckInDraft, type PlayerSessionEntry, type SessionLog } from '../domain/checkIn'
import type { SessionBlockLog } from '../domain/sessionBlocks'
import {
  getExposureSyncOverview,
  listExposureSummariesForSession,
  rowFromExposureSummary,
  saveManualExposureOverride,
  savePlayerExposureSummaries,
  summaryFromExposureRow,
  type PlayerExposureSummaryRow,
} from './exposureRepository'
import { localDb } from './localDb'

const userId = '00000000-0000-4000-8000-000000000001'

const sessionDefinition: SessionDefinition = {
  id: 'session-def-1',
  date: '2026-06-18',
  kw: 'KW25',
  title: 'Training',
  type: 'training',
  summary: '',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [
    {
      key: 'session-def-1:speed',
      order: 10,
      time: '10-20',
      title: 'Speed',
      work: '4x10 m',
      exposureTags: ['speed', 'acceleration'],
    },
  ],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const sessionLog: SessionLog = {
  id: 'session-log-1',
  userId,
  sessionDefinitionId: sessionDefinition.id,
  date: sessionDefinition.date,
  status: 'in_progress',
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
}

const entry: PlayerSessionEntry = {
  ...emptyCheckInDraft,
  id: 'entry-1',
  userId,
  sessionLogId: sessionLog.id,
  playerId: 'player-1',
  present: true,
  sessionRpe: null,
  durationMinutes: null,
  sessionLoad: null,
  postPainScore: null,
  postPainLocation: '',
  e2Decision: null,
  nextStep: null,
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const blockLog: SessionBlockLog = {
  id: 'block-log-1',
  userId,
  sessionLogId: sessionLog.id,
  sessionDefinitionId: sessionDefinition.id,
  blockKey: 'session-def-1:speed',
  blockTitle: 'Speed',
  blockOrder: 10,
  plannedTime: '10-20',
  plannedWork: '4x10 m',
  status: 'done',
  reason: 'none',
  coachNote: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const row: PlayerExposureSummaryRow = {
  id: 'summary-1',
  user_id: userId,
  player_id: 'player-1',
  session_log_id: sessionLog.id,
  session_definition_id: sessionDefinition.id,
  session_date: sessionDefinition.date,
  speed_status: 'completed',
  acceleration_status: 'completed',
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
  created_at: '2026-06-18T18:00:00.000Z',
  updated_at: '2026-06-18T18:00:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-18T18:00:00.000Z',
}

describe('exposureRepository', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('maps player exposure summaries to and from Supabase rows', () => {
    const summary = summaryFromExposureRow(row)
    const mappedRow = rowFromExposureSummary(summary)

    expect(summary.statuses.speed).toBe('completed')
    expect(summary.statuses.acceleration).toBe('completed')
    expect(mappedRow.speed_status).toBe('completed')
    expect(mappedRow.player_id).toBe('player-1')
  })

  it('saves regenerated summaries locally and queues one pending write per player/session', async () => {
    const summaries = await savePlayerExposureSummaries(userId, {
      sessionLog,
      sessionDefinition,
      blockLogs: [blockLog],
      entries: [entry],
      returnerCaps: [],
    })

    expect(summaries).toHaveLength(1)
    expect(summaries[0].statuses.speed).toBe('completed')
    await expect(localDb.playerExposureSummaries.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.toArray()).resolves.toMatchObject([
      { table: 'player_exposure_summaries', recordId: summaries[0].id },
    ])

    await savePlayerExposureSummaries(userId, {
      sessionLog,
      sessionDefinition,
      blockLogs: [blockLog],
      entries: [entry],
      returnerCaps: [],
    })

    await expect(localDb.playerExposureSummaries.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('updates manual overrides without dropping the generated summary', async () => {
    const [summary] = await savePlayerExposureSummaries(userId, {
      sessionLog,
      sessionDefinition,
      blockLogs: [blockLog],
      entries: [entry],
      returnerCaps: [],
    })

    const updated = await saveManualExposureOverride(userId, summary.id, 'speed', {
      status: 'reduced',
      note: 'Coach Override',
    })

    expect(updated.statuses.speed).toBe('reduced')
    expect(updated.manualOverrides.speed?.note).toBe('Coach Override')
    await expect(listExposureSummariesForSession(userId, sessionLog.id)).resolves.toMatchObject([
      { statuses: { speed: 'reduced' } },
    ])
  })

  it('counts pending exposure writes in a dedicated sync overview', async () => {
    await localDb.playerExposureSummaries.put(summaryFromExposureRow(row, 'pending'))
    await localDb.pendingWrites.add({
      table: 'player_exposure_summaries',
      operation: 'upsert',
      recordId: row.id,
      userId,
      createdAt: '2026-06-18T18:05:00.000Z',
    })

    await expect(getExposureSyncOverview(userId)).resolves.toMatchObject({
      status: 'pending',
      pendingCount: 1,
    })
  })
})
