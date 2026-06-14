import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionLog } from '../domain/checkIn'
import type { Player } from '../domain/players'
import {
  getReturnerSyncOverview,
  listLatestReturnerCaps,
  listReturnerEntriesForPlayer,
  returnerEntryFromRow,
  rowFromReturnerEntry,
  saveReturnerEntry,
  type ReturnerEntryRow,
} from './returnerRepository'
import { localDb } from './localDb'

const userId = '00000000-0000-4000-8000-000000000001'

const player: Player = {
  id: 'player-1',
  userId,
  name: 'Returner Eins',
  position: 'Back Row',
  cluster: 'back_row',
  active: true,
  consentStatus: 'vorhanden',
  photoConsentStatus: 'not_asked',
  photoPath: null,
  photoUpdatedAt: null,
  returnerStatus: 'ja',
  notes: '',
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

function sessionLog(overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    id: 'session-1',
    userId,
    sessionDefinitionId: 'session-def-1',
    date: '2026-06-16',
    status: 'planned',
    coach: '',
    groupSize: null,
    weatherOrHeatNote: '',
    planChanged: false,
    durationMinutes: null,
    contactIndex: '',
    speedExposureNote: '',
    coachReview: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

const remoteReturnerRow: ReturnerEntryRow = {
  id: 'returner-remote',
  user_id: userId,
  player_id: player.id,
  session_log_id: 'session-remote',
  medical_contact_note: 'Physio: non-contact',
  current_stage: 'gelb',
  speed_cap: '4x10 m smooth',
  cod_decel_cap: 'geplante Decels',
  conditioning_cap: 'Airbike kurz',
  contact_cap: 'kein Kontakt',
  allowed_today: 'Warm-up plus Speed-Caps',
  planned_caps: 'Speed submax, kein Contact Prep',
  completed: 'erledigt',
  symptoms_during: '',
  next_morning: 'stabil',
  decision: 'bleiben',
  created_at: '2026-06-16T18:00:00.000Z',
  updated_at: '2026-06-16T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-16T18:05:00.000Z',
}

describe('returnerRepository', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('maps returner entries to and from Supabase rows', () => {
    const entry = returnerEntryFromRow(remoteReturnerRow)
    const row = rowFromReturnerEntry(entry)

    expect(entry.medicalContactNote).toBe('Physio: non-contact')
    expect(entry.codDecelCap).toBe('geplante Decels')
    expect(entry.nextMorning).toBe('stabil')
    expect(row.medical_contact_note).toBe('Physio: non-contact')
    expect(row.cod_decel_cap).toBe('geplante Decels')
  })

  it('creates one pending returner write for a player and session', async () => {
    const saved = await saveReturnerEntry(userId, 'session-1', player.id, {
      currentStage: 'gelb',
      speedCap: '4x10 m smooth',
      contactCap: 'kein Kontakt',
      allowedToday: 'Team-Warm-up',
      completed: 'erledigt',
    })

    expect(saved.syncStatus).toBe('pending')
    await expect(localDb.returnerEntries.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listReturnerEntriesForPlayer(userId, player.id)).resolves.toMatchObject([
      { playerId: player.id, speedCap: '4x10 m smooth' },
    ])
  })

  it('updates the existing player returner entry instead of duplicating rows', async () => {
    await saveReturnerEntry(userId, 'session-1', player.id, { speedCap: '3x10 m' })
    await saveReturnerEntry(userId, 'session-1', player.id, { speedCap: '4x10 m', contactCap: 'Bags only' })

    await expect(localDb.returnerEntries.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    await expect(listReturnerEntriesForPlayer(userId, player.id)).resolves.toMatchObject([
      { speedCap: '4x10 m', contactCap: 'Bags only' },
    ])
  })

  it('returns latest caps from the current or latest previous session and ignores future entries', async () => {
    await localDb.sessionLogs.bulkPut([
      sessionLog({ id: 'past-session', date: '2026-06-13' }),
      sessionLog({ id: 'current-session', date: '2026-06-16' }),
      sessionLog({ id: 'future-session', date: '2026-06-20' }),
    ])
    await localDb.returnerEntries.bulkPut([
      returnerEntryFromRow({
        ...remoteReturnerRow,
        id: 'past-returner',
        session_log_id: 'past-session',
        speed_cap: 'past speed',
        contact_cap: 'past contact',
      }),
      returnerEntryFromRow({
        ...remoteReturnerRow,
        id: 'current-returner',
        session_log_id: 'current-session',
        speed_cap: 'current speed',
        contact_cap: 'current contact',
      }),
      returnerEntryFromRow({
        ...remoteReturnerRow,
        id: 'future-returner',
        session_log_id: 'future-session',
        speed_cap: 'future speed',
        contact_cap: 'future contact',
      }),
    ])

    await expect(listLatestReturnerCaps(userId, 'current-session', '2026-06-16')).resolves.toMatchObject([
      { playerId: player.id, speedCap: 'current speed', contactCap: 'current contact', sessionDate: '2026-06-16' },
    ])
  })

  it('counts pending returner writes in the returner sync overview', async () => {
    await localDb.returnerEntries.put(returnerEntryFromRow(remoteReturnerRow, 'pending'))
    await localDb.pendingWrites.add({
      table: 'returner_entries',
      operation: 'upsert',
      recordId: remoteReturnerRow.id,
      userId,
      createdAt: '2026-06-16T18:05:00.000Z',
    })

    await expect(getReturnerSyncOverview(userId)).resolves.toMatchObject({
      status: 'pending',
      pendingCount: 1,
    })
  })
})
