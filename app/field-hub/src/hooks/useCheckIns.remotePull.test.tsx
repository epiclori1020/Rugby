// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { useCheckIns } from './useCheckIns'

const defaultOverview = {
  isOnline: true,
  status: 'synced' as const,
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

const checkInRepositoryMocks = vi.hoisted(() => ({
  buildEmptyEntry: vi.fn(),
  countLocalSessionLogs: vi.fn(),
  ensureSessionLog: vi.fn(),
  findSessionLog: vi.fn(),
  getCheckInSyncOverview: vi.fn(),
  listCheckInEntries: vi.fn(),
  listExpectedPlayerIds: vi.fn(),
  listLatestObservations: vi.fn(),
  listLatestWarnings: vi.fn(),
  pullRemoteCheckIns: vi.fn(),
  pushPendingCheckIns: vi.fn(),
  resetCheckInEntry: vi.fn(),
  resetCoachCheckInsForSession: vi.fn(),
  saveCheckInEntry: vi.fn(),
  saveKioskCheckInEntry: vi.fn(),
  saveSessionLogPatch: vi.fn(),
  syncCheckIns: vi.fn(),
}))

const publicCheckInRepositoryMocks = vi.hoisted(() => ({
  closePublicCheckInLink: vi.fn(),
  createPublicCheckInLinkBundle: vi.fn(),
  importPublicCheckInSubmissions: vi.fn(),
  listLocalPublicCheckInLinks: vi.fn(),
  listLocalPublicCheckInSubmissions: vi.fn(),
  refreshRemotePublicCheckIns: vi.fn(),
}))

const backgroundSyncMocks = vi.hoisted(() => ({
  scheduleBackgroundSync: vi.fn(),
}))

vi.mock('../lib/checkInRepository', () => checkInRepositoryMocks)

vi.mock('../lib/publicCheckInRepository', () => publicCheckInRepositoryMocks)

vi.mock('../lib/backgroundSync', () => backgroundSyncMocks)

const sessionDefinition: SessionDefinition = {
  id: 'session-def-1',
  date: '2026-06-16',
  kw: 'KW25',
  title: 'Test Session',
  type: 'training',
  summary: 'Test',
  primarySource: 'test',
  pdfRefs: [],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

let root: Root | null = null
let container: HTMLDivElement | null = null
let latestResult: ReturnType<typeof useCheckIns> | null = null

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function renderUseCheckIns(userId = 'user-1') {
  const { useCheckIns: useCheckInsHook } = await import('./useCheckIns')

  function Harness() {
    latestResult = useCheckInsHook(userId, sessionDefinition, [], false)
    return null
  }

  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)

  await act(async () => {
    root?.render(<Harness />)
  })
  await flushAsyncWork()
}

function setOnlineState(isOnline: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: isOnline,
  })
}

function setVisibilityState(visibilityState: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: visibilityState,
  })
}

describe('useCheckIns remote freshness pull', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-16T18:00:00.000Z'))
    setOnlineState(true)
    setVisibilityState('visible')
    latestResult = null

    checkInRepositoryMocks.buildEmptyEntry.mockReturnValue({
      id: 'entry-preview',
      userId: 'user-1',
      sessionLogId: 'session-log-1',
      playerId: 'player-1',
    })
    checkInRepositoryMocks.countLocalSessionLogs.mockResolvedValue(1)
    checkInRepositoryMocks.ensureSessionLog.mockResolvedValue({ id: 'session-log-1' })
    checkInRepositoryMocks.findSessionLog.mockResolvedValue(null)
    checkInRepositoryMocks.getCheckInSyncOverview.mockResolvedValue(defaultOverview)
    checkInRepositoryMocks.listCheckInEntries.mockResolvedValue([])
    checkInRepositoryMocks.listExpectedPlayerIds.mockResolvedValue([])
    checkInRepositoryMocks.listLatestObservations.mockResolvedValue([])
    checkInRepositoryMocks.listLatestWarnings.mockResolvedValue([])
    checkInRepositoryMocks.pullRemoteCheckIns.mockResolvedValue(undefined)
    checkInRepositoryMocks.pushPendingCheckIns.mockResolvedValue(defaultOverview)
    checkInRepositoryMocks.resetCheckInEntry.mockResolvedValue(null)
    checkInRepositoryMocks.resetCoachCheckInsForSession.mockResolvedValue([])
    checkInRepositoryMocks.saveCheckInEntry.mockResolvedValue(null)
    checkInRepositoryMocks.saveKioskCheckInEntry.mockResolvedValue(null)
    checkInRepositoryMocks.saveSessionLogPatch.mockResolvedValue({ id: 'session-log-1' })
    checkInRepositoryMocks.syncCheckIns.mockResolvedValue(defaultOverview)

    publicCheckInRepositoryMocks.closePublicCheckInLink.mockResolvedValue(undefined)
    publicCheckInRepositoryMocks.createPublicCheckInLinkBundle.mockResolvedValue(null)
    publicCheckInRepositoryMocks.importPublicCheckInSubmissions.mockResolvedValue({
      imported: 0,
      conflicts: 0,
      superseded: 0,
    })
    publicCheckInRepositoryMocks.listLocalPublicCheckInLinks.mockResolvedValue([])
    publicCheckInRepositoryMocks.listLocalPublicCheckInSubmissions.mockResolvedValue([])
    publicCheckInRepositoryMocks.refreshRemotePublicCheckIns.mockResolvedValue(undefined)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }
    root = null
    container?.remove()
    container = null
    latestResult = null
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('pulls session-scoped check-in data on mount when local history exists', async () => {
    await renderUseCheckIns()

    expect(checkInRepositoryMocks.pullRemoteCheckIns).toHaveBeenCalledTimes(1)
    expect(checkInRepositoryMocks.pullRemoteCheckIns).toHaveBeenCalledWith('user-1', {
      sessionDefinitionId: 'session-def-1',
    })
  })

  it('hydrates all remote check-in data on mount when local cache is empty', async () => {
    checkInRepositoryMocks.countLocalSessionLogs.mockResolvedValue(0)

    await renderUseCheckIns()

    expect(checkInRepositoryMocks.pullRemoteCheckIns).toHaveBeenCalledTimes(1)
    expect(checkInRepositoryMocks.pullRemoteCheckIns).toHaveBeenCalledWith('user-1', {})
  })

  it('pulls again when the app returns to the foreground after the throttle window', async () => {
    await renderUseCheckIns()

    vi.setSystemTime(new Date('2026-06-16T18:00:30.001Z'))
    setVisibilityState('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await flushAsyncWork()

    expect(checkInRepositoryMocks.pullRemoteCheckIns).toHaveBeenCalledTimes(2)
    expect(checkInRepositoryMocks.pullRemoteCheckIns).toHaveBeenLastCalledWith('user-1', {
      sessionDefinitionId: 'session-def-1',
    })
  })

  it('throttles foreground pulls inside the 30 second window', async () => {
    await renderUseCheckIns()

    vi.setSystemTime(new Date('2026-06-16T18:00:10.000Z'))
    setVisibilityState('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await flushAsyncWork()

    expect(checkInRepositoryMocks.pullRemoteCheckIns).toHaveBeenCalledTimes(1)
  })

  it('keeps controls interactive while the remote freshness pull is pending', async () => {
    let resolvePull: (() => void) | null = null
    checkInRepositoryMocks.pullRemoteCheckIns.mockReturnValue(
      new Promise<void>((resolve) => {
        resolvePull = resolve
      }),
    )

    await renderUseCheckIns()

    expect(checkInRepositoryMocks.pullRemoteCheckIns).toHaveBeenCalledTimes(1)
    expect(latestResult?.isLoading).toBe(false)

    await act(async () => {
      resolvePull?.()
    })
    await flushAsyncWork()

    expect(latestResult?.isLoading).toBe(false)
  })

  it('does not run push or full sync work from the remote freshness path', async () => {
    await renderUseCheckIns()

    expect(checkInRepositoryMocks.pullRemoteCheckIns).toHaveBeenCalledTimes(1)
    expect(checkInRepositoryMocks.syncCheckIns).not.toHaveBeenCalled()
    expect(checkInRepositoryMocks.pushPendingCheckIns).not.toHaveBeenCalled()
    expect(publicCheckInRepositoryMocks.refreshRemotePublicCheckIns).not.toHaveBeenCalled()
  })

  it('does not pull remote check-in data while offline', async () => {
    setOnlineState(false)

    await renderUseCheckIns()

    expect(checkInRepositoryMocks.pullRemoteCheckIns).not.toHaveBeenCalled()
  })
})
