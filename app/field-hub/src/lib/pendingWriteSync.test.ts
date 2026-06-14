import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Player } from '../domain/players'
import { localDb } from './localDb'
import { markSyncedIfUnchanged } from './pendingWriteSync'

const userId = '00000000-0000-4000-8000-000000000001'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    userId,
    name: 'Sabine',
    position: 'Prop',
    cluster: 'front_row',
    active: true,
    consentStatus: 'vorhanden',
    photoConsentStatus: 'not_asked',
    photoPath: null,
    photoUpdatedAt: null,
    returnerStatus: 'nein',
    notes: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T18:00:00.000Z',
    syncStatus: 'pending',
    syncError: null,
    ...overrides,
  }
}

describe('pending write sync helpers', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('marks the local record synced when it still matches the uploaded snapshot', async () => {
    const player = makePlayer()
    await localDb.players.put(player)
    const pendingWriteId = await localDb.pendingWrites.add({
      table: 'players',
      operation: 'upsert',
      recordId: player.id,
      userId,
      createdAt: '2026-06-16T18:00:01.000Z',
    })

    await markSyncedIfUnchanged(localDb.players, player, pendingWriteId)

    await expect(localDb.players.get(player.id)).resolves.toMatchObject({
      clientUpdatedAt: player.clientUpdatedAt,
      syncStatus: 'synced',
      syncError: null,
    })
    await expect(localDb.pendingWrites.get(pendingWriteId)).resolves.toBeUndefined()
  })

  it('does not mark a newer local edit as synced after an older snapshot upload finishes', async () => {
    const uploadedSnapshot = makePlayer()
    const newerLocalEdit = makePlayer({
      name: 'Sabine Updated',
      updatedAt: '2026-06-16T18:00:03.000Z',
      clientUpdatedAt: '2026-06-16T18:00:03.000Z',
      syncStatus: 'pending',
    })
    await localDb.players.put(uploadedSnapshot)
    const oldPendingWriteId = await localDb.pendingWrites.add({
      table: 'players',
      operation: 'upsert',
      recordId: uploadedSnapshot.id,
      userId,
      createdAt: '2026-06-16T18:00:01.000Z',
    })
    await localDb.players.put(newerLocalEdit)
    const newPendingWriteId = await localDb.pendingWrites.add({
      table: 'players',
      operation: 'upsert',
      recordId: newerLocalEdit.id,
      userId,
      createdAt: '2026-06-16T18:00:04.000Z',
    })

    await markSyncedIfUnchanged(localDb.players, uploadedSnapshot, oldPendingWriteId)

    await expect(localDb.players.get(uploadedSnapshot.id)).resolves.toMatchObject({
      name: newerLocalEdit.name,
      clientUpdatedAt: newerLocalEdit.clientUpdatedAt,
      syncStatus: 'pending',
    })
    await expect(localDb.pendingWrites.get(oldPendingWriteId)).resolves.toBeUndefined()
    await expect(localDb.pendingWrites.get(newPendingWriteId)).resolves.toMatchObject({
      recordId: newerLocalEdit.id,
      table: 'players',
    })
  })
})
