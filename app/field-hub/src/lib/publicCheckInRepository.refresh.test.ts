import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicCheckInSubmission } from '../domain/publicCheckIn'
import { localDb } from './localDb'
import { refreshRemotePublicCheckIns } from './publicCheckInRepository'

const supabaseState = vi.hoisted(() => ({
  rowsByTable: {} as Record<string, unknown[]>,
}))

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        in: vi.fn(() => query),
        is: vi.fn(async () => ({ data: supabaseState.rowsByTable[table] ?? [], error: null })),
      }
      return query
    }),
  },
}))

const userId = '00000000-0000-4000-8000-000000000001'

function linkRow() {
  return {
    id: 'link-1',
    user_id: userId,
    session_definition_id: 'test-session',
    session_title: 'Test',
    session_date: '2026-06-16',
    token_hash: 'hash',
    expires_at: '2026-06-17T00:00:00.000Z',
    closed_at: null,
    created_at: '2026-06-16T17:00:00.000Z',
    updated_at: '2026-06-16T17:00:00.000Z',
    deleted_at: null,
    client_updated_at: '2026-06-16T17:00:00.000Z',
  }
}

function submissionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'submission-1',
    user_id: userId,
    link_id: 'link-1',
    link_player_id: 'link-player-1',
    player_id: 'player-1',
    readiness: 2,
    life_flag: '',
    pain_score: null,
    pain_location: '',
    returner_flag: 'nein',
    session_reaction: 'none',
    player_note: '',
    status: 'pending',
    submitted_at: '2026-06-16T17:45:00.000Z',
    imported_at: null,
    conflict_reason: null,
    created_at: '2026-06-16T17:45:00.000Z',
    updated_at: '2026-06-16T17:45:00.000Z',
    deleted_at: null,
    client_updated_at: '2026-06-16T17:45:00.000Z',
    ...overrides,
  }
}

const localProtectedSubmission: PublicCheckInSubmission = {
  id: 'submission-1',
  userId,
  linkId: 'link-1',
  linkPlayerId: 'link-player-1',
  playerId: 'player-1',
  readiness: 5,
  lifeFlag: '',
  painScore: null,
  painLocation: '',
  returnerFlag: 'nein',
  sessionReaction: 'none',
  playerNote: '',
  status: 'imported',
  submittedAt: '2026-06-16T17:45:00.000Z',
  importedAt: '2026-06-16T18:00:00.000Z',
  conflictReason: null,
  createdAt: '2026-06-16T17:45:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'error',
  syncError: 'push fehlgeschlagen',
}

function localSyncedSubmission(overrides: Partial<PublicCheckInSubmission> = {}): PublicCheckInSubmission {
  return { ...localProtectedSubmission, status: 'imported', syncStatus: 'synced', syncError: null, ...overrides }
}

describe('refreshRemotePublicCheckIns protective merge', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
    supabaseState.rowsByTable = {}
  })

  it('keeps a locally non-synced submission and writes genuinely new remote submissions', async () => {
    await localDb.publicCheckInSubmissions.put(localProtectedSubmission)
    supabaseState.rowsByTable = {
      public_checkin_links: [linkRow()],
      public_checkin_link_players: [],
      public_checkin_submissions: [
        submissionRow({ id: 'submission-1', readiness: 2, status: 'pending' }),
        submissionRow({ id: 'submission-2', readiness: 4, status: 'pending' }),
      ],
    }

    await refreshRemotePublicCheckIns(userId, { sessionDefinitionId: 'test-session' })

    const protectedSubmission = await localDb.publicCheckInSubmissions.get('submission-1')
    const newSubmission = await localDb.publicCheckInSubmissions.get('submission-2')

    // Local error/imported state must survive the remote pull (not clobbered to 'pending').
    expect(protectedSubmission?.readiness).toBe(5)
    expect(protectedSubmission?.status).toBe('imported')
    expect(protectedSubmission?.syncStatus).toBe('error')

    // A genuinely new remote submission is still written.
    expect(newSubmission?.readiness).toBe(4)
    expect(newSubmission?.syncStatus).toBe('synced')
  })

  it('respects the client_updated_at watermark for synced local submissions', async () => {
    await localDb.publicCheckInSubmissions.bulkPut([
      localSyncedSubmission({ id: 'sub-newer', readiness: 5, clientUpdatedAt: '2026-06-16T19:00:00.000Z' }),
      localSyncedSubmission({ id: 'sub-older', readiness: 3, clientUpdatedAt: '2026-06-16T17:00:00.000Z' }),
    ])
    supabaseState.rowsByTable = {
      public_checkin_links: [linkRow()],
      public_checkin_link_players: [],
      public_checkin_submissions: [
        submissionRow({ id: 'sub-newer', readiness: 1, client_updated_at: '2026-06-16T18:00:00.000Z' }),
        submissionRow({ id: 'sub-older', readiness: 9, client_updated_at: '2026-06-16T18:00:00.000Z' }),
      ],
    }

    await refreshRemotePublicCheckIns(userId, { sessionDefinitionId: 'test-session' })

    const newer = await localDb.publicCheckInSubmissions.get('sub-newer')
    const older = await localDb.publicCheckInSubmissions.get('sub-older')

    // Local newer than remote -> local kept.
    expect(newer?.readiness).toBe(5)
    // Local older than remote -> remote applied.
    expect(older?.readiness).toBe(9)
  })
})
