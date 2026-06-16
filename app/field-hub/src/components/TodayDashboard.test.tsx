import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry, PlayerObservation } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { PlayerSyncOverview } from '../domain/sync'
import type { useCheckIns } from '../hooks/useCheckIns'
import { TodayDashboard } from './TodayDashboard'

const syncOverview: PlayerSyncOverview = {
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

const selectedSession: SessionDefinition = {
  id: 'session-1',
  date: '2026-06-16',
  kw: 'KW25',
  title: 'Dienstag',
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
}

const observation: PlayerObservation = {
  playerId: player.id,
  observation: 'Landing im Warm-up beobachten',
  sessionDate: '2026-06-13',
}

const entry: PlayerSessionEntry = {
  id: 'entry-1',
  userId: 'user-1',
  sessionLogId: 'session-log-1',
  playerId: player.id,
  present: false,
  readiness: null,
  lifeFlag: '',
  painScore: null,
  painLocation: '',
  returnerFlag: 'nein',
  redFlag: 'none',
  movementConcern: false,
  previousWarning: false,
  trafficLight: null,
  trafficLightSuggestion: 'green',
  trafficLightWasManual: false,
  trainingVariant: null,
  limits: [],
  observation: '',
  sessionRpe: null,
  durationMinutes: null,
  sessionLoad: null,
  postPainScore: null,
  postPainLocation: '',
  e2Decision: null,
  nextStep: null,
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

describe('TodayDashboard observations', () => {
  it('does not count pure observations as open warnings', () => {
    const checkInActions = {
      activePlayers: [player],
      entries: [entry],
      errorMessage: null,
      expectedPlayerIds: [],
      warnings: [],
      observations: [observation],
      syncOverview,
      isLoading: false,
      sessionLogId: 'session-log-1',
      publicCheckInLinks: [],
      publicCheckInSubmissions: [],
      publicCheckInNotice: null,
      refreshLocalCheckIns: async () => undefined,
      runSync: async () => syncOverview,
      saveEntry: async () => ({ ok: true as const, entry }),
      saveSessionPatch: async () => undefined,
      createPublicLink: async () => null,
      closePublicLink: async () => undefined,
      getEntryForPlayer: () => entry,
      sessionLog: null,
      clearError: () => undefined,
    } satisfies ReturnType<typeof useCheckIns>

    const markup = renderToStaticMarkup(
      <TodayDashboard
        checkInActions={checkInActions}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        players={[player]}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
        storagePersistence={{ status: 'persisted' }}
      />,
    )

    expect(markup).toContain('Keine lokalen Gelb/Rot/Returner-Hinweise')
    expect(markup).toContain('Notizen aus letzter Einheit')
    expect(markup).toContain('Landing im Warm-up beobachten')
  })
})
