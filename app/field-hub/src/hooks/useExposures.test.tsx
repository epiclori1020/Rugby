// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { useExposures } from './useExposures'

const syncOverview = {
  isOnline: true,
  status: 'synced' as const,
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

const checkInRepositoryMocks = vi.hoisted(() => ({
  findSessionLog: vi.fn(),
  pushPendingCheckIns: vi.fn(),
}))

const exposureRepositoryMocks = vi.hoisted(() => ({
  getExposureSyncOverview: vi.fn(),
  listExposureSummariesForSession: vi.fn(),
  saveManualExposureOverride: vi.fn(),
  savePlayerExposureSummaries: vi.fn(),
}))

const backgroundSyncMocks = vi.hoisted(() => ({
  scheduleBackgroundSync: vi.fn(),
}))

vi.mock('../lib/checkInRepository', () => checkInRepositoryMocks)
vi.mock('../lib/exposureRepository', () => exposureRepositoryMocks)
vi.mock('../lib/backgroundSync', () => backgroundSyncMocks)

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
let latestResult: ReturnType<typeof useExposures> | null = null

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('useExposures', () => {
  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    latestResult = null
    checkInRepositoryMocks.findSessionLog.mockResolvedValue({ id: 'session-log-1' })
    checkInRepositoryMocks.pushPendingCheckIns.mockResolvedValue(syncOverview)
    exposureRepositoryMocks.getExposureSyncOverview.mockResolvedValue(syncOverview)
    exposureRepositoryMocks.listExposureSummariesForSession.mockResolvedValue([])
    exposureRepositoryMocks.saveManualExposureOverride.mockResolvedValue(null)
    exposureRepositoryMocks.savePlayerExposureSummaries.mockResolvedValue([])
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
    const { useExposures: useExposuresHook } = await import('./useExposures')

    function Harness() {
      latestResult = useExposuresHook('user-1', sessionDefinition)
      return null
    }

    const container = document.createElement('div')
    root = createRoot(container)
    await act(async () => {
      root?.render(<Harness />)
    })
    await flushAsyncWork()
  }

  it('loads saved exposure summaries for the current session on mount without creating a session log', async () => {
    await renderHook()

    expect(latestResult).toBeTruthy()
    expect(checkInRepositoryMocks.findSessionLog).toHaveBeenCalledWith('user-1', 'session-def-1')
    expect(exposureRepositoryMocks.listExposureSummariesForSession).toHaveBeenCalledWith('user-1', 'session-log-1')
  })
})
