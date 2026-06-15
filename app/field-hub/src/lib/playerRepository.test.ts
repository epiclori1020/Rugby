import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Player } from '../domain/players'
import {
  clearPlayerPhotoUrlCache,
  deletePlayer,
  downloadPlayerPhotoUrl,
  listLocalPlayers,
  savePlayer,
  syncPlayers,
} from './playerRepository'
import { localDb } from './localDb'

const supabaseState = vi.hoisted(() => ({
  removeError: null as { message: string } | null,
  removePaths: [] as string[],
  downloadCount: 0,
  deletedPlayerIds: [] as string[],
  remoteRows: [] as unknown[],
  upsertRows: [] as unknown[],
}))

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn((row: unknown) => {
        supabaseState.upsertRows.push(row)
        return {
          select: vi.fn(async () => ({ data: Array.isArray(row) ? row.map((item) => ({ id: item.id })) : [{ id: (row as { id: string }).id }], error: null })),
        }
      }),
      delete: vi.fn(() => ({
        eq: vi.fn(async (_column: string, value: string) => {
          supabaseState.deletedPlayerIds.push(value)
          return { data: null, error: null }
        }),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => ({
            order: vi.fn(async () => ({
              data: supabaseState.remoteRows.filter((row) => (row as { deleted_at: string | null }).deleted_at === null),
              error: null,
            })),
          })),
          order: vi.fn(async () => ({ data: supabaseState.remoteRows, error: null })),
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        download: vi.fn(async () => {
          supabaseState.downloadCount += 1
          return { data: new Blob(['photo']), error: null }
        }),
        remove: vi.fn(async (paths: string[]) => {
          if (supabaseState.removeError) {
            return { error: supabaseState.removeError }
          }

          supabaseState.removePaths.push(...paths)
          return { error: null }
        }),
        upload: vi.fn(async () => ({ data: null, error: null })),
      })),
    },
  },
}))

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
    photoConsentStatus: 'allowed',
    photoPath: `${userId}/players/player-1/profile.webp`,
    photoUpdatedAt: '2026-06-16T18:05:00.000Z',
    returnerStatus: 'nein',
    notes: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:05:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T18:05:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

describe('playerRepository', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    supabaseState.removeError = null
    supabaseState.removePaths = []
    supabaseState.downloadCount = 0
    supabaseState.deletedPlayerIds = []
    supabaseState.remoteRows = []
    supabaseState.upsertRows = []
    clearPlayerPhotoUrlCache()
    vi.spyOn(URL, 'createObjectURL').mockImplementation(
      (blob: Blob | MediaSource) => `blob:${(blob as Blob).size}:${supabaseState.downloadCount}`,
    )
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    Object.defineProperty(globalThis.navigator, 'onLine', {
      configurable: true,
      value: true,
    })
    await localDb.delete()
    await localDb.open()
  })

  it('hard deletes players locally and queues remote player/photo cleanup', async () => {
    const player = makePlayer()
    await localDb.players.put(player)

    const deletedPlayer = await deletePlayer(player)

    expect(deletedPlayer.deletedAt).toBeTruthy()
    expect(deletedPlayer.active).toBe(false)
    expect(deletedPlayer.photoPath).toBe(`${userId}/players/player-1/profile.webp`)
    expect(deletedPlayer.photoUpdatedAt).toBe('2026-06-16T18:05:00.000Z')
    expect(supabaseState.removePaths).toEqual([])
    await expect(listLocalPlayers(userId)).resolves.toEqual([])
    await expect(localDb.players.get(player.id)).resolves.toBeUndefined()
    await expect(localDb.pendingWrites.toArray()).resolves.toMatchObject([
      {
        table: 'players',
        operation: 'delete',
        recordId: player.id,
        metadata: { photoPath: `${userId}/players/player-1/profile.webp` },
      },
    ])
  })

  it('does not let later storage cleanup failures block local player deletion', async () => {
    const player = makePlayer()
    await localDb.players.put(player)
    supabaseState.removeError = { message: 'Storage policy denied delete' }

    const deletedPlayer = await deletePlayer(player)

    expect(deletedPlayer.deletedAt).toBeTruthy()
    await expect(localDb.players.get(player.id)).resolves.toBeUndefined()
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('queues stored player photo cleanup when photo consent is revoked', async () => {
    const player = makePlayer()
    await localDb.players.put(player)

    const savedPlayer = await savePlayer(
      userId,
      {
        name: player.name,
        position: player.position,
        cluster: player.cluster,
        active: player.active,
        consentStatus: player.consentStatus,
        photoConsentStatus: 'denied',
        returnerStatus: player.returnerStatus,
        notes: player.notes,
      },
      player,
    )

    expect(savedPlayer.photoPath).toBeNull()
    expect(savedPlayer.photoUpdatedAt).toBeNull()
    expect(supabaseState.removePaths).toEqual([])
    await expect(localDb.pendingWrites.toArray()).resolves.toMatchObject([
      {
        table: 'players',
        operation: 'upsert',
        recordId: player.id,
        metadata: { removePhotoPath: `${userId}/players/player-1/profile.webp` },
      },
    ])
  })

  it('deletes queued remote players and stored photos during the next player sync', async () => {
    const player = makePlayer()
    await localDb.players.put(player)
    Object.defineProperty(globalThis.navigator, 'onLine', {
      configurable: true,
      value: false,
    })

    const deletedPlayer = await deletePlayer(player)

    expect(deletedPlayer.deletedAt).toBeTruthy()
    expect(deletedPlayer.photoPath).toBe(`${userId}/players/player-1/profile.webp`)
    expect(supabaseState.removePaths).toEqual([])

    Object.defineProperty(globalThis.navigator, 'onLine', {
      configurable: true,
      value: true,
    })

    await syncPlayers(userId)

    expect(supabaseState.removePaths).toEqual([`${userId}/players/player-1/profile.webp`])
    expect(supabaseState.deletedPlayerIds).toEqual([player.id])
    expect(supabaseState.upsertRows).toHaveLength(0)
    expect(deletedPlayer.deletedAt).toBeTruthy()
    await expect(localDb.players.get(player.id)).resolves.toBeUndefined()
    await expect(localDb.pendingWrites.count()).resolves.toBe(0)
  })

  it('does not reconcile a suspicious empty remote player response over multiple synced local players', async () => {
    await localDb.players.bulkPut([
      makePlayer({ id: 'player-1', name: 'Sabine' }),
      makePlayer({ id: 'player-2', name: 'Marco' }),
    ])
    supabaseState.remoteRows = []

    await syncPlayers(userId)

    await expect(listLocalPlayers(userId)).resolves.toMatchObject([
      { id: 'player-2', name: 'Marco' },
      { id: 'player-1', name: 'Sabine' },
    ])
  })

  it('keeps remaining local players when a queued delete is followed by an empty remote player response', async () => {
    const deletedPlayer = makePlayer({ id: 'player-delete', name: 'Delete Me' })
    const remainingPlayer = makePlayer({ id: 'player-remaining', name: 'Keep Me', photoPath: null, photoUpdatedAt: null })
    await localDb.players.bulkPut([deletedPlayer, remainingPlayer])
    await deletePlayer(deletedPlayer)
    supabaseState.remoteRows = []

    await syncPlayers(userId)

    await expect(localDb.players.get(deletedPlayer.id)).resolves.toBeUndefined()
    await expect(localDb.players.get(remainingPlayer.id)).resolves.toMatchObject({ id: remainingPlayer.id })
    await expect(localDb.pendingWrites.count()).resolves.toBe(0)
  })

  it('pulls remote soft-deleted players so second devices hide them locally', async () => {
    const localPlayer = makePlayer({ photoPath: null, photoUpdatedAt: null })
    await localDb.players.put(localPlayer)
    supabaseState.remoteRows = [
      {
        id: localPlayer.id,
        user_id: userId,
        name: localPlayer.name,
        position: localPlayer.position,
        cluster: localPlayer.cluster,
        active: false,
        consent_status: localPlayer.consentStatus,
        photo_consent_status: localPlayer.photoConsentStatus,
        photo_path: null,
        photo_updated_at: null,
        returner_status: localPlayer.returnerStatus,
        notes: localPlayer.notes,
        created_at: localPlayer.createdAt,
        updated_at: '2026-06-16T18:10:00.000Z',
        deleted_at: '2026-06-16T18:10:00.000Z',
        client_updated_at: '2026-06-16T18:10:00.000Z',
      },
    ]

    await syncPlayers(userId)

    await expect(localDb.players.get(localPlayer.id)).resolves.toMatchObject({
      deletedAt: '2026-06-16T18:10:00.000Z',
      active: false,
    })
    await expect(listLocalPlayers(userId)).resolves.toEqual([])
  })

  it('caches downloaded player photo object urls by path and update timestamp', async () => {
    await expect(downloadPlayerPhotoUrl('photo-path', '2026-06-16T18:00:00.000Z')).resolves.toBe('blob:5:1')
    await expect(downloadPlayerPhotoUrl('photo-path', '2026-06-16T18:00:00.000Z')).resolves.toBe('blob:5:1')
    await expect(downloadPlayerPhotoUrl('photo-path', '2026-06-16T18:05:00.000Z')).resolves.toBe('blob:5:2')

    expect(supabaseState.downloadCount).toBe(2)
  })

  it('releases cached player photo object urls only when the cache is cleared', async () => {
    await expect(downloadPlayerPhotoUrl('photo-path', '2026-06-16T18:00:00.000Z')).resolves.toBe('blob:5:1')
    await expect(downloadPlayerPhotoUrl('photo-path', '2026-06-16T18:00:00.000Z')).resolves.toBe('blob:5:1')

    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    clearPlayerPhotoUrlCache()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:5:1')
    await expect(downloadPlayerPhotoUrl('photo-path', '2026-06-16T18:00:00.000Z')).resolves.toBe('blob:5:1')
    expect(supabaseState.downloadCount).toBe(1)
  })
})
