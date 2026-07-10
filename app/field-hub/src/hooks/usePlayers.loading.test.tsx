// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
})
