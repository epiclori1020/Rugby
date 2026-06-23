// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import { emptyCheckInDraft, type PlayerSessionEntry, type SessionLog } from '../domain/checkIn'
import type { ExerciseResult } from '../domain/exercises'
import type { MetricResult } from '../domain/metrics'
import type { Player } from '../domain/players'
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

const sessionLog: SessionLog = {
  id: 'session-log-1',
  userId: 'user-1',
  sessionDefinitionId: selectedSession.id,
  date: selectedSession.date,
  status: 'in_progress',
  coach: '',
  groupSize: null,
  weatherOrHeatNote: '',
  planChanged: false,
  durationMinutes: null,
  contactIndex: '',
  speedExposureNote: '',
  coachReview: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
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
  resetExposureSummaries: async () => ({ resetCount: 0 }),
  saveManualOverride: async () => undefined,
  clearError: () => undefined,
}

const activePlayer = (id: string, name: string, cluster: Player['cluster'] = 'back_row'): Player => ({
  id,
  userId: 'user-1',
  name,
  position: cluster,
  cluster,
  active: true,
  consentStatus: 'vorhanden',
  photoConsentStatus: 'not_asked',
  photoPath: null,
  photoUpdatedAt: null,
  returnerStatus: 'nein',
  notes: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
})

const entryForPlayer = (player: Player): PlayerSessionEntry => ({
  ...emptyCheckInDraft,
  id: `entry-${player.id}`,
  userId: 'user-1',
  sessionLogId: 'session-log-1',
  playerId: player.id,
  present: true,
  returnerFlag: 'nein' as const,
  sessionRpe: null,
  durationMinutes: null,
  sessionLoad: null,
  postPainScore: null,
  postPainLocation: '',
  e2Decision: null,
  nextStep: null,
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:00:00.000Z',
  syncStatus: 'synced' as const,
  syncError: null,
})

describe('TrainingView session block status controls', () => {
  let root: Root | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    window.localStorage.clear()
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
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
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

  it('lets the coach abort, resume, reset to start and restart a running session', async () => {
    const saveBlockLog = vi.fn(async () => undefined)
    const resetSessionBlockLogs = vi.fn(async () => ({ resetCount: 1 }))
    const resetExposureSummaries = vi.fn(async () => ({ resetCount: 1 }))
    const container = document.createElement('div')
    root = createRoot(container)
    const blockLog: SessionBlockLog = {
      id: 'block-log-1',
      userId: 'user-1',
      sessionLogId: 'session-log-1',
      sessionDefinitionId: selectedSession.id,
      blockKey: 'kw25-do-2026-06-18:warmup',
      blockTitle: 'Warm-up',
      blockOrder: 20,
      plannedTime: '8-18',
      plannedWork: 'RAMP.',
      status: 'done',
      reason: 'none',
      coachNote: '',
      createdAt: '2026-06-18T18:00:00.000Z',
      updatedAt: '2026-06-18T18:05:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-18T18:05:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    }

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={{ ...checkInActions, sessionLog }}
          exposureActions={{
            ...exposureActions,
            summaries: [
              { id: 'summary-1', sessionLogId: sessionLog.id, deletedAt: null } as never,
              { id: 'summary-other-session', sessionLogId: 'session-log-other', deletedAt: null } as never,
            ],
            resetExposureSummaries,
          }}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessionBlockActions={{
            blockLogs: [blockLog],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog,
            getLogForBlock: (blockKey) => (blockKey === blockLog.blockKey ? blockLog : null),
            clearError: () => undefined,
            resetSessionBlockLogs,
          }}
          sessions={[selectedSession]}
        />,
      )
    })

    expect(container.textContent).toContain('Training fortsetzen')
    expect(container.textContent).not.toContain('Aktuelle Phase')

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Training fortsetzen')
        ?.click()
    })

    expect(container.textContent).toContain('Aktuelle Phase')

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Next')
        ?.click()
    })
    expect(container.textContent).toContain('Speed')

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Zurueck zum Start')
        ?.click()
    })
    expect(container.textContent).toContain('Warm-up')

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Training abbrechen')
        ?.click()
    })

    expect(container.textContent).not.toContain('Aktuelle Phase')
    expect(container.textContent).toContain('Training fortsetzen')

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Training neu starten')
        ?.click()
    })

    expect(container.textContent).toContain('1 Blockstatus')
    expect(container.textContent).toContain('1 Exposure-Summary')
    expect(container.textContent).toContain('Check-ins bleiben erhalten')

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Neu starten')
        ?.click()
    })

    expect(resetSessionBlockLogs).toHaveBeenCalledTimes(1)
    expect(resetExposureSummaries).toHaveBeenCalledTimes(1)
  })

  it('refreshes exercise capture defaults when the selected player changes', async () => {
    const alpha = activePlayer('player-alpha', 'Alpha Forward')
    const beta = activePlayer('player-beta', 'Beta Back')
    const captureSession: SessionDefinition = {
      ...selectedSession,
      timeline: [
        {
          key: 'kw25-do-2026-06-18:strength',
          order: 10,
          time: '0-10',
          title: 'Strength',
          work: 'Deadlift.',
          exercises: [
            {
              key: 'strength-deadlift',
              name: 'Deadlift',
              prescription: '3x5.',
              coachingCues: ['Keine Grind-Reps'],
              targeting: 'all',
              recording: 'exercise',
              exerciseKey: 'trap_bar_deadlift',
            },
          ],
        },
      ],
    }
    const alphaResult: ExerciseResult = {
      id: 'result-alpha',
      userId: 'user-1',
      playerId: alpha.id,
      sessionLogId: 'session-log-1',
      exerciseKey: 'trap_bar_deadlift',
      variant: 'custom',
      sets: 3,
      reps: '5',
      loadValue: 80,
      loadUnit: 'kg',
      rpe: 7,
      rir: null,
      techniqueQuality: 'not_recorded',
      painResponse: 'unclear',
      notes: '',
      createdAt: '2026-06-18T18:00:00.000Z',
      updatedAt: '2026-06-18T18:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-18T18:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    }
    const betaResult: ExerciseResult = {
      ...alphaResult,
      id: 'result-beta',
      playerId: beta.id,
      sets: 2,
      reps: '4',
      loadValue: 60,
      rpe: 5,
    }
    const savePlayerExerciseResult = vi.fn(async () => undefined)
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={{
            ...checkInActions,
            activePlayers: [alpha, beta],
            entries: [entryForPlayer(alpha), entryForPlayer(beta)],
            getEntryForPlayer: (player) => entryForPlayer(player),
          }}
          exerciseActions={{
            activePlayers: [alpha, beta],
            entries: [alphaResult, betaResult],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshExercises: async () => undefined,
            runSync: async () => syncOverview,
            savePlayerExerciseResult,
            getExerciseResultForPlayer: (player, exerciseKey) =>
              exerciseKey === 'trap_bar_deadlift' && player.id === alpha.id
                ? alphaResult
                : exerciseKey === 'trap_bar_deadlift' && player.id === beta.id
                  ? betaResult
                  : null,
            clearError: () => undefined,
          }}
          exposureActions={exposureActions}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={captureSession}
          selectedSessionId={captureSession.id}
          sessionBlockActions={{
            blockLogs: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog: async () => undefined,
            getLogForBlock: () => null,
            clearError: () => undefined,
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
          }}
          sessions={[captureSession]}
        />,
      )
    })

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Training starten')
        ?.click()
    })

    const playerSelect = container.querySelector<HTMLSelectElement>('.live-capture select')
    const setsInput = container.querySelector<HTMLInputElement>('input[name="sets"]')
    const repsInput = container.querySelector<HTMLInputElement>('input[name="reps"]')
    const loadInput = container.querySelector<HTMLInputElement>('input[name="loadValue"]')
    const rpeInput = container.querySelector<HTMLInputElement>('input[name="rpe"]')

    expect(playerSelect?.value).toBe(alpha.id)
    expect(setsInput?.value).toBe('3')
    expect(repsInput?.value).toBe('5')
    expect(loadInput?.value).toBe('80')
    expect(rpeInput?.value).toBe('7')

    await act(async () => {
      playerSelect!.value = beta.id
      playerSelect!.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(container.querySelector<HTMLInputElement>('input[name="sets"]')?.value).toBe('2')
    expect(container.querySelector<HTMLInputElement>('input[name="reps"]')?.value).toBe('4')
    expect(container.querySelector<HTMLInputElement>('input[name="loadValue"]')?.value).toBe('60')
    expect(container.querySelector<HTMLInputElement>('input[name="rpe"]')?.value).toBe('5')
    expect(container.querySelector('.session-exercise-card')?.textContent).toContain('Alle Spieler')

    await act(async () => {
      container
        .querySelector<HTMLInputElement>('input[name="sets"]')!
        .dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })

    expect(savePlayerExerciseResult).toHaveBeenCalledWith(beta, {
      exerciseKey: 'trap_bar_deadlift',
      sets: '2',
      reps: '4',
      loadValue: '60',
      rpe: '5',
      notes: 'Deadlift',
    })
  })

  it('does not save empty exercise capture on blur', async () => {
    const player = activePlayer('player-empty', 'Empty Capture')
    const captureSession: SessionDefinition = {
      ...selectedSession,
      timeline: [
        {
          key: 'kw25-do-2026-06-18:strength',
          order: 10,
          time: '0-10',
          title: 'Strength',
          work: 'Deadlift.',
          exercises: [
            {
              key: 'strength-deadlift',
              name: 'Deadlift',
              prescription: '3x5.',
              coachingCues: ['Keine Grind-Reps'],
              targeting: 'all',
              recording: 'exercise',
              exerciseKey: 'trap_bar_deadlift',
            },
          ],
        },
      ],
    }
    const savePlayerExerciseResult = vi.fn(async () => undefined)
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={{
            ...checkInActions,
            activePlayers: [player],
            entries: [entryForPlayer(player)],
            getEntryForPlayer: (selectedPlayer) => entryForPlayer(selectedPlayer),
          }}
          exerciseActions={{
            activePlayers: [player],
            entries: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshExercises: async () => undefined,
            runSync: async () => syncOverview,
            savePlayerExerciseResult,
            getExerciseResultForPlayer: () => null,
            clearError: () => undefined,
          }}
          exposureActions={exposureActions}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={captureSession}
          selectedSessionId={captureSession.id}
          sessionBlockActions={{
            blockLogs: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog: async () => undefined,
            getLogForBlock: () => null,
            clearError: () => undefined,
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
          }}
          sessions={[captureSession]}
        />,
      )
    })

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Training starten')
        ?.click()
    })

    await act(async () => {
      container.querySelector<HTMLFormElement>('form.live-capture')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })

    expect(savePlayerExerciseResult).not.toHaveBeenCalled()
    expect(container.querySelector('.training-player-list')?.textContent).toContain('Empty Capture')
  })

  it('disables live capture player selects while saving is blocked', async () => {
    const player = activePlayer('player-disabled', 'Disabled Capture')
    const captureSession: SessionDefinition = {
      ...selectedSession,
      timeline: [
        {
          key: 'kw25-do-2026-06-18:strength',
          order: 10,
          time: '0-10',
          title: 'Strength',
          work: 'Deadlift.',
          exercises: [
            {
              key: 'strength-deadlift',
              name: 'Deadlift',
              prescription: '3x5.',
              coachingCues: ['Keine Grind-Reps'],
              targeting: 'all',
              recording: 'exercise',
              exerciseKey: 'trap_bar_deadlift',
            },
          ],
        },
      ],
    }
    const savePlayerExerciseResult = vi.fn(async () => undefined)
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={{
            ...checkInActions,
            activePlayers: [player],
            entries: [entryForPlayer(player)],
            getEntryForPlayer: (selectedPlayer) => entryForPlayer(selectedPlayer),
          }}
          exerciseActions={{
            activePlayers: [player],
            entries: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshExercises: async () => undefined,
            runSync: async () => syncOverview,
            savePlayerExerciseResult,
            getExerciseResultForPlayer: () => null,
            clearError: () => undefined,
          }}
          exposureActions={exposureActions}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={captureSession}
          selectedSessionId={captureSession.id}
          sessionBlockActions={{
            blockLogs: [],
            syncOverview,
            isLoading: true,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog: async () => undefined,
            getLogForBlock: () => null,
            clearError: () => undefined,
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
          }}
          sessions={[captureSession]}
        />,
      )
    })

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Training starten')
        ?.click()
    })

    expect(container.querySelector<HTMLSelectElement>('.live-capture select')?.disabled).toBe(true)
  })

  it('does not treat open returner clarification or observation-only returner rules as open capture tasks', async () => {
    const openReturner = activePlayer('player-open-returner', 'Open Returner')
    const activeReturner = { ...activePlayer('player-active-returner', 'Active Returner'), returnerStatus: 'ja' as const }
    const observationOnly = activePlayer('player-observation-only', 'Observation Only')
    const returnerSession: SessionDefinition = {
      ...selectedSession,
      timeline: [
        {
          key: 'kw25-do-2026-06-18:returner',
          order: 10,
          time: '0-10',
          title: 'Returner',
          work: 'Returner rule.',
          exercises: [
            {
              key: 'returner-observation',
              name: 'Returner Observation',
              prescription: 'Keine harte Belastung.',
              coachingCues: ['Caps prüfen'],
              targeting: 'returner',
              recording: 'observation',
            },
            {
              key: 'named-observation',
              name: 'Named Observation',
              prescription: 'Nur beobachten.',
              coachingCues: ['Kein Capture-Feld'],
              targeting: 'named',
              playerNames: ['Observation'],
              recording: 'observation',
            },
          ],
        },
      ],
    }
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={{
            ...checkInActions,
            activePlayers: [openReturner, activeReturner, observationOnly],
            entries: [
              { ...entryForPlayer(openReturner), returnerFlag: 'offen' },
              { ...entryForPlayer(activeReturner), returnerFlag: 'nein' },
              entryForPlayer(observationOnly),
            ],
            getEntryForPlayer: (player) =>
              player.id === openReturner.id
                ? { ...entryForPlayer(openReturner), returnerFlag: 'offen' }
                : player.id === observationOnly.id
                  ? entryForPlayer(observationOnly)
                : { ...entryForPlayer(activeReturner), returnerFlag: 'nein' },
          }}
          exposureActions={exposureActions}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={returnerSession}
          selectedSessionId={returnerSession.id}
          sessionBlockActions={{
            blockLogs: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog: async () => undefined,
            getLogForBlock: () => null,
            clearError: () => undefined,
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
          }}
          sessions={[returnerSession]}
        />,
      )
    })

    expect(container.querySelector('.training-player-list')?.textContent).not.toContain('Open Returner')
    expect(container.querySelector('.training-player-list')?.textContent).toContain('Active Returner')
    expect(container.querySelector('.training-player-list')?.textContent).not.toContain('Observation Only')

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Returner')
        ?.click()
    })

    expect(container.querySelector('.training-player-list')?.textContent).not.toContain('Open Returner')
    expect(container.querySelector('.training-player-list')?.textContent).toContain('Active Returner')
  })

  it('ignores targeted exercises with missing target metadata', async () => {
    const player = activePlayer('player-misconfigured', 'Misconfigured Target')
    const misconfiguredSession: SessionDefinition = {
      ...selectedSession,
      timeline: [
        {
          key: 'kw25-do-2026-06-18:misconfigured',
          order: 10,
          time: '0-10',
          title: 'Misconfigured',
          work: 'Invalid targeted metadata.',
          exercises: [
            {
              key: 'missing-names',
              name: 'Missing Names',
              prescription: 'Should not target everyone.',
              coachingCues: ['Fix content later'],
              targeting: 'named',
              recording: 'metric',
              metricKey: 'broad_jump',
            } as never,
            {
              key: 'missing-clusters',
              name: 'Missing Clusters',
              prescription: 'Should not target everyone.',
              coachingCues: ['Fix content later'],
              targeting: 'cluster',
              recording: 'metric',
              metricKey: 'med_ball_chest_pass',
            } as never,
          ],
        },
      ],
    }
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={{
            ...checkInActions,
            activePlayers: [player],
            entries: [entryForPlayer(player)],
            getEntryForPlayer: (selectedPlayer) => entryForPlayer(selectedPlayer),
          }}
          exposureActions={exposureActions}
          metricActions={{
            activePlayers: [player],
            entries: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshMetrics: async () => undefined,
            runSync: async () => syncOverview,
            savePlayerMetric: async () => ({ ok: true as const }),
            getMetricForPlayer: () => null,
            clearError: () => undefined,
          }}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={misconfiguredSession}
          selectedSessionId={misconfiguredSession.id}
          sessionBlockActions={{
            blockLogs: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog: async () => undefined,
            getLogForBlock: () => null,
            clearError: () => undefined,
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
          }}
          sessions={[misconfiguredSession]}
        />,
      )
    })

    expect(container.querySelector('.training-player-list')?.textContent).not.toContain('Misconfigured Target')
  })

  it('falls back to expanded live mode when collapsed storage is unavailable', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    const container = document.createElement('div')
    root = createRoot(container)

    try {
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
              syncOverview,
              isLoading: false,
              errorMessage: null,
              refreshSessionBlocks: async () => undefined,
              runSync: async () => syncOverview,
              saveBlockLog: async () => undefined,
              getLogForBlock: () => null,
              clearError: () => undefined,
              resetSessionBlockLogs: async () => ({ resetCount: 0 }),
            }}
            sessions={[selectedSession]}
          />,
        )
      })

      await act(async () => {
        Array.from(container.querySelectorAll('button'))
          .find((button) => button.textContent === 'Training starten')
          ?.click()
      })

      expect(container.textContent).toContain('Aktuelle Phase')
    } finally {
      getItem.mockRestore()
      setItem.mockRestore()
    }
  })

  it('matches named targets by exact normalized token or alias only', async () => {
    const david = activePlayer('player-david', 'David')
    const davidson = activePlayer('player-davidson', 'Davidson')
    const damore = activePlayer('player-damore', "Marco D'Amore")
    const namedSession: SessionDefinition = {
      ...selectedSession,
      timeline: [
        {
          key: 'kw25-do-2026-06-18:named',
          order: 10,
          time: '0-10',
          title: 'Named',
          work: 'Named metrics.',
          exercises: [
            {
              key: 'david-broad-jump',
              name: 'David Broad Jump',
              prescription: 'Broad Jump.',
              coachingCues: ['Sauber landen'],
              targeting: 'named',
              playerNames: ['David'],
              recording: 'metric',
              metricKey: 'broad_jump',
            },
            {
              key: 'damore-throw',
              name: "D'Amore Throw",
              prescription: 'Throw correction.',
              coachingCues: ['Nur Datenkorrektur'],
              targeting: 'named',
              playerNames: ["D'Amore", 'DAmore'],
              recording: 'metric',
              metricKey: 'med_ball_chest_pass',
            },
          ],
        },
      ],
    }
    const container = document.createElement('div')
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={{
            ...checkInActions,
            activePlayers: [david, davidson, damore],
            entries: [entryForPlayer(david), entryForPlayer(davidson), entryForPlayer(damore)],
            getEntryForPlayer: (player) => entryForPlayer(player),
          }}
          exposureActions={exposureActions}
          metricActions={{
            activePlayers: [david, davidson, damore],
            entries: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshMetrics: async () => undefined,
            runSync: async () => syncOverview,
            savePlayerMetric: async () => ({ ok: true as const }),
            getMetricForPlayer: () => null,
            clearError: () => undefined,
          }}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={namedSession}
          selectedSessionId={namedSession.id}
          sessionBlockActions={{
            blockLogs: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog: async () => undefined,
            getLogForBlock: () => null,
            clearError: () => undefined,
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
          }}
          sessions={[namedSession]}
        />,
      )
    })

    const playerList = container.querySelector('.training-player-list')?.textContent
    expect(playerList).toContain('David')
    expect(playerList).not.toContain('Davidson')
    expect(playerList).toContain("Marco D'Amore")
  })

  it('removes a named metric task from open player tasks once the metric exists', async () => {
    const artur = activePlayer('player-artur', 'Artur Paseka')
    const matei = activePlayer('player-matei', 'Matei Bulga')
    const metricSession: SessionDefinition = {
      ...selectedSession,
      timeline: [
        {
          key: 'kw25-do-2026-06-18:make-up',
          order: 10,
          time: '0-10',
          title: 'Nachholer',
          work: 'Artur Med-Ball.',
          exercises: [
            {
              key: 'artur-med-ball',
              name: 'Artur Med-Ball',
              prescription: 'Med-Ball-Wurf nachholen.',
              coachingCues: ['Ballgewicht notieren'],
              targeting: 'named',
              playerNames: ['Artur'],
              recording: 'metric',
              metricKey: 'med_ball_chest_pass',
            },
          ],
        },
      ],
    }
    const metricResult: MetricResult = {
      id: 'metric-artur',
      userId: 'user-1',
      playerId: artur.id,
      sessionLogId: 'session-log-1',
      metricKey: 'med_ball_chest_pass',
      value: 9.5,
      attempt: 1,
      isValid: true,
      bodySide: 'none',
      contextNote: '',
      createdAt: '2026-06-18T18:00:00.000Z',
      updatedAt: '2026-06-18T18:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-18T18:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    }
    const container = document.createElement('div')
    root = createRoot(container)

    const renderWithMetric = (result: MetricResult | null) =>
      root?.render(
        <TrainingView
          authState={authState}
          checkInActions={{
            ...checkInActions,
            activePlayers: [artur, matei],
            entries: [entryForPlayer(artur), entryForPlayer(matei)],
            getEntryForPlayer: (player) => entryForPlayer(player),
          }}
          exposureActions={exposureActions}
          metricActions={{
            activePlayers: [artur, matei],
            entries: result ? [result] : [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshMetrics: async () => undefined,
            runSync: async () => syncOverview,
            savePlayerMetric: async () => ({ ok: true as const }),
            getMetricForPlayer: (player, metricKey) =>
              result && player.id === artur.id && metricKey === 'med_ball_chest_pass' ? result : null,
            clearError: () => undefined,
          }}
          onOpenLibraryItem={() => undefined}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerCaps={[]}
          selectedSession={metricSession}
          selectedSessionId={metricSession.id}
          sessionBlockActions={{
            blockLogs: [],
            syncOverview,
            isLoading: false,
            errorMessage: null,
            refreshSessionBlocks: async () => undefined,
            runSync: async () => syncOverview,
            saveBlockLog: async () => undefined,
            getLogForBlock: () => null,
            clearError: () => undefined,
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
          }}
          sessions={[metricSession]}
        />,
      )

    await act(async () => {
      renderWithMetric(null)
    })

    expect(container.querySelector('.training-player-list')?.textContent).toContain('Artur Paseka')
    expect(container.querySelector('.training-player-list')?.textContent).not.toContain('Matei Bulga')

    await act(async () => {
      renderWithMetric(metricResult)
    })

    expect(container.querySelector('.training-player-list')?.textContent).not.toContain('Artur Paseka')
    expect(container.textContent).toContain('Keine Spieler fuer diesen Filter.')
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
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
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
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
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

  it('offers resume after existing logs load asynchronously and then shows the saved block status', async () => {
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
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
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

    expect(container.textContent).not.toContain('Aktuelle Phase')
    expect(container.textContent).toContain('Training fortsetzen')

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Training fortsetzen')
        ?.click()
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
            resetSessionBlockLogs: async () => ({ resetCount: 0 }),
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
