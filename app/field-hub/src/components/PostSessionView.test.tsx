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

function renderPostSessionView() {
  const postSessionActions = {
    activePlayers: [player],
    entries: [entry],
    errorMessage: null,
    progressEntries: [],
    warnings: [],
    syncOverview,
    isLoading: false,
    sessionLog,
    refreshPostSession: async () => undefined,
    runSync: async () => syncOverview,
    savePlayerPostSession: async () => undefined,
    savePlayerProgress: async () => undefined,
    saveSessionPatch: async () => undefined,
    getEntryForPlayer: () => entry,
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
    savePlayerMetric: async () => undefined,
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
    saveManualOverride: async () => undefined,
    clearError: () => undefined,
  }

  return renderToStaticMarkup(
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
    />,
  )
}

describe('PostSessionView closure checklist', () => {
  it('shows missing required post-session data without hiding existing inputs', () => {
    const markup = renderPostSessionView()

    expect(markup).toContain('Closure Checklist')
    expect(markup).toContain('Nachbereitungsstatus: teilweise abgeschlossen')
    expect(markup).toContain('sRPE fehlt bei anwesenden Spielern.')
    expect(markup).toContain('Post-Pain fehlt bei auffaelligen Spielern.')
    expect(markup).toContain('E2 oder Next Step fehlt bei Auffaelligen.')
    expect(markup).toContain('Einheit abschliessen')
    expect(markup).toContain('Flexible Metrics')
    expect(markup).toContain('Structured Exercise Result')
    expect(markup).toContain('Session-Default')
    expect(markup).toContain('Apply to present')
    expect(markup).toContain('Copy previous player')
    expect(markup).toContain('10 m Sprint')
    expect(markup).toContain('Mini-Baseline / Re-Check')
    expect(markup).toContain('Max')
  })
})
