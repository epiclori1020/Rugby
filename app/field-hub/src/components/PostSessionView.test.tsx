// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import { emptyCheckInDraft } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { PlayerSyncOverview } from '../domain/sync'
import type { useBaselines } from '../hooks/useBaselines'
import type { useExercises } from '../hooks/useExercises'
import type { useMetrics } from '../hooks/useMetrics'
import type { usePostSession } from '../hooks/usePostSession'
import type { AuthSessionState } from '../lib/auth'
import { PostSessionView } from './PostSessionView'

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
  id: 'session-1',
  date: '2026-06-18',
  kw: 'KW25',
  title: 'Donnerstag',
  type: 'training',
  summary: 'Test',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const player: Player = {
  id: 'player-1',
  userId: 'user-1',
  name: 'Max',
  position: 'Back Row',
  cluster: 'back_row',
  active: true,
  consentStatus: 'vorhanden',
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
}

const sessionLog: SessionLog = {
  id: 'session-log-1',
  userId: 'user-1',
  sessionDefinitionId: selectedSession.id,
  date: selectedSession.date,
  status: 'planned',
  coach: '',
  groupSize: null,
  weatherOrHeatNote: '',
  planChanged: false,
  durationMinutes: 75,
  contactIndex: '',
  speedExposureNote: '',
  coachReview: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T20:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T20:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const entry: PlayerSessionEntry = {
  ...emptyCheckInDraft,
  id: 'entry-1',
  userId: 'user-1',
  sessionLogId: sessionLog.id,
  playerId: player.id,
  present: true,
  readiness: 2,
  painScore: 4,
  returnerFlag: 'nein',
  trafficLight: 'yellow',
  trafficLightSuggestion: 'yellow',
  limits: ['kein_sprint'],
  sessionRpe: null,
  durationMinutes: null,
  sessionLoad: null,
  postPainScore: null,
  postPainLocation: '',
  e2Decision: null,
  nextStep: null,
  checkInSource: 'coach',
  playerSubmittedAt: null,
  coachEditedAt: '2026-06-18T18:05:00.000Z',
  playerNote: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T20:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T20:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const latestBaseline = {
  id: 'baseline-latest',
  userId: 'user-1',
  playerId: player.id,
  sessionLogId: sessionLog.id,
  broadJumpCm: null,
  medBallChestPassM: null,
  medBallWeightKg: null,
  sprint30m: null,
  note: '',
  sessionDate: selectedSession.date,
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T20:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T20:00:00.000Z',
  syncStatus: 'synced' as const,
  syncError: null,
}

function postSessionViewElement({
  entryOverrides = {},
  sessionLogOverrides = {},
}: {
  entryOverrides?: Partial<PlayerSessionEntry>
  sessionLogOverrides?: Partial<SessionLog>
} = {}) {
  const renderedEntry = { ...entry, ...entryOverrides }
  const renderedSessionLog = { ...sessionLog, ...sessionLogOverrides }
  const postSessionActions = {
    activePlayers: [player],
    entries: [renderedEntry],
    errorMessage: null,
    progressEntries: [],
    warnings: [],
    syncOverview,
    isLoading: false,
    sessionLog: renderedSessionLog,
    refreshPostSession: async () => undefined,
    runSync: async () => syncOverview,
    savePlayerPostSession: async () => undefined,
    savePlayerProgress: async () => undefined,
    saveSessionPatch: async () => undefined,
    getEntryForPlayer: () => renderedEntry,
    getProgressForPlayer: () => null,
    clearError: () => undefined,
  } satisfies ReturnType<typeof usePostSession>

  const baselineActions = {
    activePlayers: [player],
    entries: [],
    errorMessage: null,
    syncOverview,
    isLoading: false,
    latestEntriesByPlayerId: {},
    refreshBaselines: async () => undefined,
    runSync: async () => syncOverview,
    savePlayerBaseline: async () => undefined,
    getBaselineForPlayer: () => null,
    getLatestBaselineForPlayer: () => latestBaseline,
    clearError: () => undefined,
  } satisfies ReturnType<typeof useBaselines>

  const metricActions = {
    activePlayers: [player],
    entries: [],
    errorMessage: null,
    syncOverview,
    isLoading: false,
    refreshMetrics: async () => undefined,
    runSync: async () => syncOverview,
    savePlayerMetric: async () => ({ ok: true as const }),
    getMetricForPlayer: () => null,
    clearError: () => undefined,
  } satisfies ReturnType<typeof useMetrics>

  const exerciseActions = {
    activePlayers: [player],
    entries: [],
    errorMessage: null,
    syncOverview,
    isLoading: false,
    refreshExercises: async () => undefined,
    runSync: async () => syncOverview,
    savePlayerExerciseResult: async () => undefined,
    getExerciseResultForPlayer: () => null,
    clearError: () => undefined,
  } satisfies ReturnType<typeof useExercises>

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

  return (
    <PostSessionView
      authState={authState}
      baselineActions={baselineActions}
      exposureActions={exposureActions}
      exposureBlockLogs={[]}
      exerciseActions={exerciseActions}
      lastExportAt={null}
      metricActions={metricActions}
      onNavigate={() => undefined}
      onSessionChange={() => undefined}
      postSessionActions={postSessionActions}
      returnerCaps={[]}
      selectedSession={selectedSession}
      selectedSessionId={selectedSession.id}
      sessions={[selectedSession]}
    />
  )
}

function renderPostSessionView(options: Parameters<typeof postSessionViewElement>[0] = {}) {
  return renderToStaticMarkup(postSessionViewElement(options))
}

describe('PostSessionView post-session queue', () => {
  it('shows a queue-first workflow while keeping secondary post-session tools available', () => {
    const markup = renderPostSessionView()

    expect(markup).toContain('Nachbereitungsqueue')
    expect(markup).toContain('post-session-summary-strip')
    expect(markup).not.toContain('metric-grid checkin-metrics')
    expect(markup).toContain('sRPE nachtragen')
    expect(markup).toContain('Subjektive Belastung 0-10')
    expect(markup).toContain('0 = keine Anstrengung · 10 = maximal')
    expect(markup).toContain('0 = keine Beschwerden · 10 = sehr stark')
    expect(markup).toContain('Dauer Minuten')
    expect(markup).toContain('Pflicht')
    expect(markup).toContain('Optional nachtragen')
    expect(markup).toContain('Alle Spielerdetails')
    expect(markup).toContain('Flexible Metrics')
    expect(markup).toContain('Exercise-Resultate')
    expect(markup).toContain('Session-Default')
    expect(markup).toContain('Auf Anwesende anwenden')
    expect(markup).toContain('Vorheriges Resultat kopieren')
    expect(markup).toContain('10 m Sprint')
    expect(markup).toContain('Mini-Baseline / Re-Check')
    expect(markup).toContain('Max')
    expect(markup).toContain('post-session-sticky-closeout')
    expect(markup).toContain('post-session-task-pane')
    expect(markup).toContain('Einheit abschliessen')
    expect(markup).toContain('sRPE fehlt bei anwesenden Spielern.')
    expect(markup.match(/of-button-primary/g)).toHaveLength(1)
    expect(markup.toLowerCase()).not.toContain('freigabe')
  })

  it('keeps the sticky closeout as the only completion action and shows completed state', () => {
    const readyMarkup = renderPostSessionView({
      entryOverrides: {
        sessionRpe: 6,
        postPainScore: 2,
        e2Decision: 'normal',
        nextStep: 'halten',
      },
    })
    const completedMarkup = renderPostSessionView({
      entryOverrides: {
        sessionRpe: 6,
        postPainScore: 2,
        e2Decision: 'normal',
        nextStep: 'halten',
      },
      sessionLogOverrides: { status: 'completed' },
    })

    expect(readyMarkup).not.toContain('session_status:session')
    expect(readyMarkup.match(/Einheit abschliessen/g)).toHaveLength(1)
    expect(completedMarkup).toContain('Einheit abgeschlossen')
  })

  it('closes the mobile task sheet before focusing the duration field', async () => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const originalMatchMedia = window.matchMedia
    window.matchMedia = () => ({
      matches: true,
      media: '(max-width: 599px)',
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(postSessionViewElement({ sessionLogOverrides: { durationMinutes: null } }))
    })

    const durationRow = Array.from(container.querySelectorAll<HTMLElement>('.of-task-queue-row'))
      .find((row) => row.textContent?.includes('Dauer nachtragen'))
    const opener = Array.from(durationRow?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      .find((button) => button.textContent === 'Öffnen')
    expect(opener).toBeDefined()
    await act(async () => opener?.click())
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()

    const focusDurationButton = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent === 'Dauerfeld fokussieren')
    await act(async () => focusDurationButton?.click())

    expect(container.querySelector('[role="dialog"]')).toBeNull()
    const durationInput = container.querySelector<HTMLInputElement>('#post-session-duration-input')
    expect(document.activeElement).toBe(durationInput)
    await act(async () => {
      if (durationInput) {
        durationInput.value = '75'
        durationInput.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      }
      await Promise.resolve()
    })
    expect(container.querySelector('.post-session-sticky-closeout .action-feedback')?.textContent)
      .toContain('gespeichert')

    await act(async () => root.unmount())
    container.remove()
    window.matchMedia = originalMatchMedia
  })

  it('does not silently advance when an explicitly selected desktop task disappears', async () => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => root.render(postSessionViewElement()))
    const painRow = Array.from(container.querySelectorAll<HTMLElement>('.of-task-queue-row'))
      .find((row) => row.textContent?.includes('Beschwerden nach Training nachtragen'))
    const opener = Array.from(painRow?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      .find((button) => button.textContent === 'Öffnen')
    await act(async () => opener?.click())
    expect(container.querySelector('.post-session-task-pane')?.textContent)
      .toContain('Beschwerden nach Training nachtragen')

    await act(async () => root.render(postSessionViewElement({ entryOverrides: { postPainScore: 2 } })))
    expect(container.querySelector('.post-session-task-pane')).toBeNull()
    expect(document.activeElement).toBe(container.querySelector('#missing-values-heading'))

    await act(async () => root.unmount())
    container.remove()
  })
})
