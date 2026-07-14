// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { useReturners } from './useReturners'

const syncedOverview = {
  isOnline: true,
  status: 'synced' as const,
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

const checkInRepositoryMocks = vi.hoisted(() => ({
  ensureSessionLog: vi.fn(),
  findSessionLog: vi.fn(),
  pushPendingCheckIns: vi.fn(),
  syncCheckIns: vi.fn(),
}))

const returnerRepositoryMocks = vi.hoisted(() => ({
  buildEmptyReturnerEntry: vi.fn(),
  getReturnerSyncOverview: vi.fn(),
  listLatestReturnerCaps: vi.fn(),
  listReturnerEntriesForPlayers: vi.fn(),
  listReturnerEntriesForSession: vi.fn(),
  saveReturnerEntry: vi.fn(),
}))

vi.mock('../lib/checkInRepository', () => checkInRepositoryMocks)
vi.mock('../lib/returnerRepository', () => returnerRepositoryMocks)
vi.mock('../lib/backgroundSync', () => ({ scheduleBackgroundSync: vi.fn() }))

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
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

let root: Root | null = null
let latestResult: ReturnType<typeof useReturners> | null = null
const noPlayers: Player[] = []
const noCheckIns: PlayerSessionEntry[] = []

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('useReturners', () => {
  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    latestResult = null
    checkInRepositoryMocks.findSessionLog.mockResolvedValue(null)
    checkInRepositoryMocks.pushPendingCheckIns.mockResolvedValue(syncedOverview)
    checkInRepositoryMocks.syncCheckIns.mockResolvedValue({
      ...syncedOverview,
      status: 'error',
      errorMessage: 'Check-in-Sync fehlgeschlagen.',
    })
    returnerRepositoryMocks.getReturnerSyncOverview.mockResolvedValue(syncedOverview)
    returnerRepositoryMocks.listLatestReturnerCaps.mockResolvedValue([])
    returnerRepositoryMocks.listReturnerEntriesForPlayers.mockResolvedValue({})
    returnerRepositoryMocks.listReturnerEntriesForSession.mockResolvedValue([])
  })

  afterEach(async () => {
    if (root) await act(async () => root?.unmount())
    root = null
    latestResult = null
    vi.resetAllMocks()
  })

  it('keeps a check-in sync error visible after refreshing returner data', async () => {
    const { useReturners: useReturnersHook } = await import('./useReturners')

    function Harness() {
      latestResult = useReturnersHook('user-1', sessionDefinition, noPlayers, noCheckIns)
      return null
    }

    root = createRoot(document.createElement('div'))
    await act(async () => root?.render(<Harness />))
    await flushAsyncWork()

    await act(async () => {
      await latestResult?.runSync()
    })

    expect(latestResult?.errorMessage).toBe('Check-in-Sync fehlgeschlagen.')
  })
})
