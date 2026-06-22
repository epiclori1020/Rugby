// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { useSessionBlocks } from './useSessionBlocks'

const syncOverview = {
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

const sessionBlockRepositoryMocks = vi.hoisted(() => ({
  getSessionBlockSyncOverview: vi.fn(),
  listSessionBlockLogsForSession: vi.fn(),
  saveSessionBlockLog: vi.fn(),
}))

const backgroundSyncMocks = vi.hoisted(() => ({
  scheduleBackgroundSync: vi.fn(),
}))

vi.mock('../lib/checkInRepository', () => checkInRepositoryMocks)
vi.mock('../lib/sessionBlockRepository', () => sessionBlockRepositoryMocks)
vi.mock('../lib/backgroundSync', () => backgroundSyncMocks)

const sessionDefinition: SessionDefinition = {
  id: 'session-1',
  date: '2026-06-18',
  kw: 'KW25',
  title: 'Test Session',
  type: 'training',
  summary: '',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [
    {
      key: 'session-1:speed',
      order: 10,
      time: '18-28',
      title: 'Speed',
      work: '4x10 m.',
    },
  ],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

let root: Root | null = null
let latestResult: ReturnType<typeof useSessionBlocks> | null = null

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('useSessionBlocks phantom session boundary', () => {
  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    latestResult = null
    checkInRepositoryMocks.ensureSessionLog.mockResolvedValue({ id: 'session-log-1' })
    checkInRepositoryMocks.findSessionLog.mockResolvedValue(null)
    checkInRepositoryMocks.pushPendingCheckIns.mockResolvedValue(syncOverview)
    checkInRepositoryMocks.syncCheckIns.mockResolvedValue(syncOverview)
    sessionBlockRepositoryMocks.getSessionBlockSyncOverview.mockResolvedValue(syncOverview)
    sessionBlockRepositoryMocks.listSessionBlockLogsForSession.mockResolvedValue([])
    sessionBlockRepositoryMocks.saveSessionBlockLog.mockResolvedValue(null)
    backgroundSyncMocks.scheduleBackgroundSync.mockClear()
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }
    root = null
    latestResult = null
    vi.resetAllMocks()
  })

  async function renderHook() {
    const { useSessionBlocks: useSessionBlocksHook } = await import('./useSessionBlocks')

    function Harness() {
      latestResult = useSessionBlocksHook('user-1', sessionDefinition)
      return null
    }

    const container = document.createElement('div')
    root = createRoot(container)
    await act(async () => {
      root?.render(<Harness />)
    })
    await flushAsyncWork()
  }

  it('refreshes block status without creating a session log', async () => {
    await renderHook()

    expect(latestResult).toBeTruthy()
    expect(checkInRepositoryMocks.findSessionLog).toHaveBeenCalledWith('user-1', 'session-1')
    expect(checkInRepositoryMocks.ensureSessionLog).not.toHaveBeenCalled()
    expect(sessionBlockRepositoryMocks.listSessionBlockLogsForSession).not.toHaveBeenCalled()
  })
})
