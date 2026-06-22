// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import { emptyCheckInDraft } from '../domain/checkIn'
import type { SessionBlockLog } from '../domain/sessionBlocks'
import type { PlayerSyncOverview } from '../domain/sync'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { useSessionBlocks } from '../hooks/useSessionBlocks'
import type { AuthSessionState } from '../lib/auth'
import { TrainingView } from './TrainingView'

const syncOverview: PlayerSyncOverview = {
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

const authState = {
  status: 'signed-in',
  session: {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'user-1',
      email: 'coach@example.test',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-06-16T18:00:00.000Z',
    },
  },
  user: {
    id: 'user-1',
    email: 'coach@example.test',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-06-16T18:00:00.000Z',
  },
  error: null,
} satisfies AuthSessionState

const selectedSession: SessionDefinition = {
  id: 'kw25-do-2026-06-18',
  date: '2026-06-18',
  kw: 'KW25',
  title: 'Donnerstag',
  type: 'training',
  summary: 'Test',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [
    {
      key: 'kw25-do-2026-06-18:warmup',
      order: 20,
      time: '8-18',
      title: 'Warm-up',
      work: 'RAMP.',
      dose: 'RPE 2-3',
      note: 'Laufbild',
      libraryRefs: ['variants-abcd'],
    },
    {
      key: 'kw25-do-2026-06-18:speed',
      order: 30,
      time: '18-28',
      title: 'Speed',
      work: '4x10 m plus optional 2x15 m.',
      dose: '70-80 Prozent',
      note: 'kein Timing',
      libraryRefs: ['exercise-mapping-offseason'],
    },
  ],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const checkInActions = {
  activePlayers: [],
  sessionEntries: [],
  entries: [],
  errorMessage: null,
  expectedPlayerIds: [],
  warnings: [],
  observations: [],
  syncOverview,
  isLoading: false,
  sessionLogId: null,
  publicCheckInLinks: [],
  publicCheckInSubmissions: [],
  publicCheckInNotice: null,
  refreshLocalCheckIns: async () => undefined,
  runSync: async () => syncOverview,
  saveEntry: async () => ({
    ok: true as const,
    entry: {
      ...emptyCheckInDraft,
      id: 'entry-1',
      userId: 'user-1',
      sessionLogId: 'session-log-1',
      playerId: null,
      sessionRpe: null,
      durationMinutes: null,
      sessionLoad: null,
      postPainScore: null,
      postPainLocation: '',
      e2Decision: null,
      nextStep: null,
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
      clientUpdatedAt: '',
      syncStatus: 'synced' as const,
      syncError: null,
    },
  }),
  saveKioskEntry: async () => ({ ok: true as const, entry: null as never }),
  resetEntry: async () => ({ ok: true as const, entry: null as never }),
  resetSessionCheckIns: async () => ({
    ok: true as const,
    resetCount: 0,
    publicSubmissionResetCount: 0,
    retainedPostSessionCount: 0,
    sourceCounts: { coach: 0, player_link: 0, player_kiosk: 0, mixed: 0 },
  }),
  saveSessionPatch: async () => undefined,
  createPublicLink: async () => null,
  closePublicLink: async () => undefined,
  getEntryForPlayer: () => null as never,
  sessionLog: null,
  clearError: () => undefined,
} satisfies ReturnType<typeof useCheckIns>

const exposureActions = {
  summaries: [],
  syncOverview,
  isLoading: false,
  errorMessage: null,
  refreshExposures: async () => undefined,
  generateExposureSummaries: async () => [],
  saveManualOverride: async () => undefined,
  clearError: () => undefined,
}

describe('TrainingView session block status controls', () => {
  let root: Root | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
      root = null
    }
  })

  it('opens live mode without saving and lets the coach navigate steps', async () => {
    const saveBlockLog = vi.fn(async () => undefined)
    const saveSessionPatch = vi.fn(async () => undefined)
    const saveEntry = vi.fn(checkInActions.saveEntry)
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={{ ...checkInActions, saveEntry, saveSessionPatch }}
          exposureActions={exposureActions}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessionBlockActions={{
            blockLogs: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog,
            getLogForBlock: () => null,
            clearError: () => undefined,
          }}
          sessions={[selectedSession]}
        />,
      )
    })

    expect(container.textContent).not.toContain('Aktuelle Phase')

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Training starten')
        ?.click()
    })

    expect(container.textContent).toContain('Aktuelle Phase')
    expect(container.textContent).toContain('Warm-up')
    expect(saveBlockLog).not.toHaveBeenCalled()
    expect(saveSessionPatch).not.toHaveBeenCalled()
    expect(saveEntry).not.toHaveBeenCalled()

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Geplant')
        ?.click()
    })
    const emptyNote = container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Blocknotiz Warm-up"]')
    await act(async () => {
      emptyNote!.value = ''
      emptyNote!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })

    expect(saveBlockLog).not.toHaveBeenCalled()

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Next')
        ?.click()
    })

    expect(container.textContent).toContain('Speed')
    expect(saveBlockLog).not.toHaveBeenCalled()

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Previous')
        ?.click()
    })

    expect(container.textContent).toContain('Warm-up')
  })

  it('opens linked library references from timeline blocks', async () => {
    const saveBlockLog = vi.fn(async () => undefined)
    const onOpenLibraryItem = vi.fn()
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={checkInActions}
          exposureActions={exposureActions}
          onOpenLibraryItem={onOpenLibraryItem}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessionBlockActions={{
            blockLogs: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog,
            getLogForBlock: () => null,
            clearError: () => undefined,
          }}
          sessions={[selectedSession]}
        />,
      )
    })

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Varianten')
        ?.click()
    })

    expect(onOpenLibraryItem).toHaveBeenCalledWith('variants-abcd')
  })

  it('lets the coach save a skipped live step with a required reason and note', async () => {
    const saveBlockLog = vi.fn(async () => undefined)
    const container = document.createElement('div')
    root = createRoot(container)

    const sessionBlockActions = {
      blockLogs: [],
      syncOverview,
      isLoading: false,
      errorMessage: null,
      refreshSessionBlocks: async () => undefined,
      runSync: async () => syncOverview,
      saveBlockLog,
      getLogForBlock: () => null,
      clearError: () => undefined,
    } satisfies ReturnType<typeof useSessionBlocks>

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={checkInActions}
          exposureActions={exposureActions}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessionBlockActions={sessionBlockActions}
          sessions={[selectedSession]}
        />,
      )
    })

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Training starten')
        ?.click()
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Next')
        ?.click()
    })

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Gestrichen')
        ?.click()
    })
    const reasonSelect = container.querySelector<HTMLSelectElement>('select[aria-label="Grund Speed"]')
    expect(reasonSelect).toBeTruthy()

    await act(async () => {
      reasonSelect!.value = 'time'
      reasonSelect!.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const note = container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Blocknotiz Speed"]')
    await act(async () => {
      note!.value = 'Zeitdruck'
      note!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })

    expect(saveBlockLog).toHaveBeenCalledWith('kw25-do-2026-06-18:speed', {
      status: 'skipped',
      reason: 'time',
      coachNote: 'Zeitdruck',
    })
  })

  it('updates visible block status after existing logs load asynchronously', async () => {
    const saveBlockLog = vi.fn(async () => undefined)
    const container = document.createElement('div')
    root = createRoot(container)
    const loadedBlockLog: SessionBlockLog = {
      id: 'block-log-1',
      userId: 'user-1',
      sessionLogId: 'session-log-1',
      sessionDefinitionId: selectedSession.id,
      blockKey: 'kw25-do-2026-06-18:speed',
      blockTitle: 'Speed',
      blockOrder: 30,
      plannedTime: '18-28',
      plannedWork: '4x10 m plus optional 2x15 m.',
      status: 'skipped',
      reason: 'time',
      coachNote: 'Zeitdruck',
      createdAt: '2026-06-18T18:00:00.000Z',
      updatedAt: '2026-06-18T18:05:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-18T18:05:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    }
    const warmupDoneLog: SessionBlockLog = {
      ...loadedBlockLog,
      id: 'block-log-0',
      blockKey: 'kw25-do-2026-06-18:warmup',
      blockTitle: 'Warm-up',
      blockOrder: 20,
      plannedTime: '8-18',
      plannedWork: 'RAMP.',
      status: 'done',
      reason: 'none',
      coachNote: '',
    }

    const renderWithLogs = (blockLogs: SessionBlockLog[]) =>
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={checkInActions}
          exposureActions={exposureActions}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessionBlockActions={{
            blockLogs,
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog,
            getLogForBlock: (blockKey) => blockLogs.find((blockLog) => blockLog.blockKey === blockKey) ?? null,
            clearError: () => undefined,
          }}
          sessions={[selectedSession]}
        />,
      )

    await act(async () => {
      renderWithLogs([])
    })
    await act(async () => {
      renderWithLogs([warmupDoneLog, loadedBlockLog])
    })

    expect(container.textContent).toContain('Aktuelle Phase')
    const skippedButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Gestrichen',
    )
    const reasonSelect = container.querySelector<HTMLSelectElement>('select[aria-label="Grund Speed"]')

    expect(skippedButton?.className).toContain('active')
    expect(reasonSelect?.value).toBe('time')
  })

  it('retries block status sync from the training error strip', async () => {
    const runSync = vi.fn(async () => syncOverview)
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={checkInActions}
          exposureActions={exposureActions}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessionBlockActions={{
            blockLogs: [],
            syncOverview: { ...syncOverview, status: 'error', pendingCount: 1, errorMessage: 'Sync fehlgeschlagen.' },
            isLoading: false,
            errorMessage: 'Sync fehlgeschlagen.',
            refreshSessionBlocks: async () => undefined,
            runSync,
            saveBlockLog: async () => undefined,
            getLogForBlock: () => null,
            clearError: () => undefined,
          }}
          sessions={[selectedSession]}
        />,
      )
    })

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Retry')
        ?.click()
    })

    expect(runSync).toHaveBeenCalledTimes(1)
  })
})
