// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry } from '../domain/checkIn'
import type { Player } from '../domain/players'
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
  resetAllCheckInsForSession: vi.fn(),
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
  resetPublicCheckInSubmissionsForSession: vi.fn(),
}))

const backgroundSyncMocks = vi.hoisted(() => ({
  scheduleBackgroundSync: vi.fn(),
}))

const supabaseClientMocks = vi.hoisted(() => ({
  postgresChangesHandler: null as null | (() => void),
  channel: {
    on: vi.fn((_type: string, _filter: unknown, callback: () => void) => {
      supabaseClientMocks.postgresChangesHandler = callback
      return supabaseClientMocks.channel
    }),
    subscribe: vi.fn(() => supabaseClientMocks.channel),
  },
  supabase: {
    channel: vi.fn(() => supabaseClientMocks.channel),
    removeChannel: vi.fn(async () => undefined),
  },
}))

vi.mock('../lib/checkInRepository', () => checkInRepositoryMocks)

vi.mock('../lib/publicCheckInRepository', () => publicCheckInRepositoryMocks)

vi.mock('../lib/backgroundSync', () => backgroundSyncMocks)

vi.mock('../lib/supabaseClient', () => ({
  supabase: supabaseClientMocks.supabase,
}))

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

async function renderUseCheckIns(userId = 'user-1', players: Player[] = []) {
  const { useCheckIns: useCheckInsHook } = await import('./useCheckIns')

  function Harness() {
    latestResult = useCheckInsHook(userId, sessionDefinition, players)
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

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    userId: 'user-1',
    name: 'Test Spieler',
    position: 'Back Row',
    cluster: 'back_row',
    active: true,
    consentStatus: 'unklar',
    photoConsentStatus: 'not_asked',
    photoPath: null,
    photoUpdatedAt: null,
    returnerStatus: 'nein',
    notes: '',
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function entry(overrides: Partial<PlayerSessionEntry> = {}): PlayerSessionEntry {
  return {
    id: 'entry-1',
    userId: 'user-1',
    sessionLogId: 'session-log-1',
    playerId: 'player-1',
    present: true,
    readiness: 4,
    lifeFlag: '',
    painScore: 0,
    painLocation: '',
    returnerFlag: 'nein',
    sessionReaction: 'none',
    redFlag: 'none',
    movementConcern: false,
    previousWarning: false,
    trafficLight: 'green',
    trafficLightSuggestion: 'green',
    trafficLightWasManual: false,
    trainingVariant: null,
    limits: [],
    observation: '',
    playerNote: '',
    sessionRpe: null,
    durationMinutes: null,
    sessionLoad: null,
    postPainScore: null,
    postPainLocation: '',
    e2Decision: null,
    nextStep: null,
    checkInSource: 'coach',
    playerSubmittedAt: null,
    coachEditedAt: null,
    createdAt: '2026-06-16T18:00:00.000Z',
    updatedAt: '2026-06-16T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-16T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
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
    checkInRepositoryMocks.resetAllCheckInsForSession.mockResolvedValue({
      entries: [],
      resetCount: 0,
      deletedCount: 0,
      retainedPostSessionCount: 0,
      sourceCounts: { coach: 0, player_link: 0, player_kiosk: 0, mixed: 0 },
    })
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
    publicCheckInRepositoryMocks.resetPublicCheckInSubmissionsForSession.mockResolvedValue(0)
    supabaseClientMocks.postgresChangesHandler = null
    supabaseClientMocks.channel.on.mockClear()
    supabaseClientMocks.channel.subscribe.mockClear()
    supabaseClientMocks.supabase.channel.mockClear()
    supabaseClientMocks.supabase.removeChannel.mockClear()
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

  it('keeps active entries filtered while exposing all loaded session entries', async () => {
    const activePlayer = player({ id: 'player-active', active: true })
    const inactivePlayer = player({ id: 'player-inactive', active: false })
    checkInRepositoryMocks.findSessionLog.mockResolvedValue({ id: 'session-log-1' })
    checkInRepositoryMocks.listCheckInEntries.mockResolvedValue([
      entry({ id: 'entry-active', playerId: activePlayer.id }),
      entry({ id: 'entry-inactive', playerId: inactivePlayer.id, checkInSource: 'player_kiosk' }),
    ])

    await renderUseCheckIns('user-1', [activePlayer, inactivePlayer])

    expect(latestResult?.entries.map((item) => item.id)).toEqual(['entry-active'])
    expect(latestResult?.sessionEntries.map((item) => item.id)).toEqual(['entry-active', 'entry-inactive'])
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

  it('subscribes only to public submission inserts and refreshes public check-ins on insert', async () => {
    await renderUseCheckIns()

    expect(supabaseClientMocks.supabase.channel).toHaveBeenCalledWith('public-checkins:user-1')
    expect(supabaseClientMocks.channel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'public_checkin_submissions',
        filter: 'user_id=eq.user-1',
      },
      expect.any(Function),
    )

    await act(async () => {
      supabaseClientMocks.postgresChangesHandler?.()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(publicCheckInRepositoryMocks.refreshRemotePublicCheckIns).toHaveBeenCalledWith('user-1', {
      sessionDefinitionId: 'session-def-1',
    })
    expect(publicCheckInRepositoryMocks.importPublicCheckInSubmissions).toHaveBeenCalledWith(
      'user-1',
      sessionDefinition,
      { recoverImportedWithoutLocalEntry: false },
    )
  })

  it('pushes entries created by automatic public check-in imports', async () => {
    await renderUseCheckIns()
    publicCheckInRepositoryMocks.importPublicCheckInSubmissions.mockResolvedValueOnce({
      imported: 1,
      conflicts: 0,
      superseded: 0,
    })
    checkInRepositoryMocks.pushPendingCheckIns.mockClear()

    vi.advanceTimersByTime(30_000)
    await flushAsyncWork()

    expect(publicCheckInRepositoryMocks.importPublicCheckInSubmissions).toHaveBeenCalledWith(
      'user-1',
      sessionDefinition,
      { recoverImportedWithoutLocalEntry: false },
    )
    expect(checkInRepositoryMocks.pushPendingCheckIns).toHaveBeenCalledWith('user-1')
    expect(checkInRepositoryMocks.getCheckInSyncOverview).toHaveBeenCalledWith('user-1')
  })

  it('keeps public refresh state recoverable when public import fails', async () => {
    await renderUseCheckIns()
    publicCheckInRepositoryMocks.importPublicCheckInSubmissions.mockRejectedValueOnce(new Error('Import failed'))
    checkInRepositoryMocks.getCheckInSyncOverview.mockClear()

    vi.advanceTimersByTime(30_000)
    await flushAsyncWork()

    expect(latestResult?.errorMessage).toBe('Link-Check-ins nicht aktualisiert: Import failed')
    expect(checkInRepositoryMocks.getCheckInSyncOverview).toHaveBeenCalledWith('user-1')
    expect(publicCheckInRepositoryMocks.listLocalPublicCheckInLinks).toHaveBeenCalledWith('user-1', 'session-def-1')
  })

  it('enables imported-submission recovery only after hydrating remote check-in entries', async () => {
    await renderUseCheckIns()
    publicCheckInRepositoryMocks.listLocalPublicCheckInLinks.mockResolvedValueOnce([{ id: 'link-recovery' }])
    publicCheckInRepositoryMocks.listLocalPublicCheckInSubmissions.mockResolvedValueOnce([
      { status: 'imported', deletedAt: null },
    ])
    checkInRepositoryMocks.pullRemoteCheckIns.mockClear()

    vi.advanceTimersByTime(30_000)
    await flushAsyncWork()

    expect(checkInRepositoryMocks.pullRemoteCheckIns).toHaveBeenCalledWith('user-1', {
      sessionDefinitionId: 'session-def-1',
    })
    expect(publicCheckInRepositoryMocks.importPublicCheckInSubmissions).toHaveBeenCalledWith(
      'user-1',
      sessionDefinition,
      { recoverImportedWithoutLocalEntry: true },
    )
  })

  it('does not hydrate remote check-in entries when imported submissions already have local entries', async () => {
    await renderUseCheckIns()
    publicCheckInRepositoryMocks.listLocalPublicCheckInLinks.mockResolvedValueOnce([{ id: 'link-recovery' }])
    publicCheckInRepositoryMocks.listLocalPublicCheckInSubmissions.mockResolvedValueOnce([
      { status: 'imported', deletedAt: null, playerId: 'player-1' },
    ])
    checkInRepositoryMocks.findSessionLog.mockResolvedValueOnce({ id: 'session-log-1' })
    checkInRepositoryMocks.listCheckInEntries.mockResolvedValueOnce([entry({ playerId: 'player-1' })])
    checkInRepositoryMocks.pullRemoteCheckIns.mockClear()

    vi.advanceTimersByTime(30_000)
    await flushAsyncWork()

    expect(checkInRepositoryMocks.pullRemoteCheckIns).not.toHaveBeenCalled()
    expect(publicCheckInRepositoryMocks.importPublicCheckInSubmissions).toHaveBeenCalledWith(
      'user-1',
      sessionDefinition,
      { recoverImportedWithoutLocalEntry: false },
    )
  })

  it('does not refresh public check-ins from realtime inserts while the app is hidden', async () => {
    await renderUseCheckIns()
    publicCheckInRepositoryMocks.refreshRemotePublicCheckIns.mockClear()
    publicCheckInRepositoryMocks.importPublicCheckInSubmissions.mockClear()
    setVisibilityState('hidden')

    await act(async () => {
      supabaseClientMocks.postgresChangesHandler?.()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(publicCheckInRepositoryMocks.refreshRemotePublicCheckIns).not.toHaveBeenCalled()
    expect(publicCheckInRepositoryMocks.importPublicCheckInSubmissions).not.toHaveBeenCalled()
  })

  it('polls public check-ins even when the check-in tab did not enable polling', async () => {
    await renderUseCheckIns()

    vi.advanceTimersByTime(30_000)
    await flushAsyncWork()

    expect(publicCheckInRepositoryMocks.refreshRemotePublicCheckIns).toHaveBeenCalledWith('user-1', {
      sessionDefinitionId: 'session-def-1',
    })
  })

  it('refreshes public submissions when the app returns to the foreground', async () => {
    await renderUseCheckIns()

    vi.setSystemTime(new Date('2026-06-16T18:00:30.001Z'))
    setVisibilityState('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await flushAsyncWork()

    expect(publicCheckInRepositoryMocks.refreshRemotePublicCheckIns).toHaveBeenCalledWith('user-1', {
      sessionDefinitionId: 'session-def-1',
    })
  })

  it('does not pull remote check-in data while offline', async () => {
    setOnlineState(false)

    await renderUseCheckIns()

    expect(checkInRepositoryMocks.pullRemoteCheckIns).not.toHaveBeenCalled()
  })
})
