// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Player } from '../domain/players'

const playerRepositoryMocks = vi.hoisted(() => ({
  deactivatePlayer: vi.fn(),
  deletePlayer: vi.fn(),
  getPlayerSyncOverview: vi.fn(async () => ({
    isOnline: true,
    status: 'synced',
    pendingCount: 0,
    lastSuccessfulSyncAt: null,
    errorMessage: null,
  })),
  listLocalPlayers: vi.fn(async () => []),
  removePlayerPhoto: vi.fn(),
  savePlayer: vi.fn(),
  syncPlayers: vi.fn(async () => ({
    isOnline: true,
    status: 'synced',
    pendingCount: 0,
    lastSuccessfulSyncAt: null,
    errorMessage: null,
  })),
  uploadPlayerPhoto: vi.fn(),
}))

vi.mock('../lib/playerRepository', () => playerRepositoryMocks)
vi.mock('../lib/backgroundSync', () => ({ scheduleBackgroundSync: vi.fn() }))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePlayers loading contract', () => {
  it('reports hydration loading on the first signed-in render', async () => {
    const { usePlayers } = await import('./usePlayers')
    const loadingStates: boolean[] = []
    const container = document.createElement('div')
    const root = createRoot(container)

    function Harness() {
      const result = usePlayers('user-1')
      loadingStates.push(result.isLoading)
      return null
    }

    await act(async () => {
      root.render(<Harness />)
    })

    expect(loadingStates[0]).toBe(true)

    await act(async () => {
      root.unmount()
    })
  })

  it('keeps a durable local deletion successful when the sync overview refresh fails', async () => {
    const player: Player = {
      id: 'player-1', userId: 'user-1', name: 'Sabine', position: 'Prop', cluster: 'front_row', active: true,
      consentStatus: 'unklar', photoConsentStatus: 'not_asked', photoPath: null, photoUpdatedAt: null,
      returnerStatus: 'nein', notes: '', createdAt: '2026-06-16T18:00:00.000Z', updatedAt: '2026-06-16T18:00:00.000Z',
      deletedAt: null, clientUpdatedAt: '2026-06-16T18:00:00.000Z', syncStatus: 'synced', syncError: null,
    }
    const deletedPlayer = { ...player, active: false, deletedAt: '2026-07-14T12:00:00.000Z', syncStatus: 'pending' as const }
    playerRepositoryMocks.listLocalPlayers.mockResolvedValue([player] as never)
    playerRepositoryMocks.deletePlayer.mockResolvedValue(deletedPlayer as never)
    const { usePlayers } = await import('./usePlayers')
    let latestResult: ReturnType<typeof usePlayers> | null = null
    const container = document.createElement('div')
    const root = createRoot(container)

    function Harness() {
      latestResult = usePlayers('user-1')
      return null
    }

    await act(async () => {
      root.render(<Harness />)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    playerRepositoryMocks.getPlayerSyncOverview.mockRejectedValueOnce(new Error('Dexie overview failed'))

    await expect(act(async () => {
      await latestResult?.deletePlayer(player)
    })).resolves.toBeUndefined()
    expect((latestResult as ReturnType<typeof usePlayers> | null)?.players).toHaveLength(0)

    await act(async () => root.unmount())
  })
})
