import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Player } from '../domain/players'
import type { PlayerSyncOverview } from '../domain/sync'
import type { useBaselines } from '../hooks/useBaselines'
import type { usePlayers } from '../hooks/usePlayers'
import type { AuthSessionState } from '../lib/auth'
import type { LatestBaselineEntry } from '../lib/baselineRepository'
import { PlayersView } from './PlayersView'

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

const syncOverview: PlayerSyncOverview = {
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

const player: Player = {
  id: 'player-1',
  userId: 'user-1',
  name: 'Sabine',
  position: 'Prop',
  cluster: 'front_row',
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

const latestBaseline: LatestBaselineEntry = {
  id: 'baseline-1',
  userId: 'user-1',
  playerId: player.id,
  sessionLogId: 'session-log-1',
  broadJumpCm: null,
  medBallChestPassM: null,
  medBallWeightKg: null,
  sprint30m: null,
  note: '',
  sessionDate: '2026-06-16',
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

function renderPlayersView() {
  const playerActions = {
    players: [player],
    syncOverview,
    isLoading: false,
    refreshLocalPlayers: async () => undefined,
    runSync: async () => undefined,
    savePlayer: async () => undefined,
    deactivatePlayer: async () => undefined,
    deletePlayer: async () => undefined,
    uploadPlayerPhoto: async () => undefined,
    removePlayerPhoto: async () => undefined,
  } satisfies ReturnType<typeof usePlayers>

  const baselineActions = {
    activePlayers: [player],
    entries: [],
    errorMessage: null,
    syncOverview,
    isLoading: false,
    latestEntriesByPlayerId: { [player.id]: latestBaseline },
    refreshBaselines: async () => undefined,
    runSync: async () => syncOverview,
    savePlayerBaseline: async () => undefined,
    getBaselineForPlayer: () => null,
    getLatestBaselineForPlayer: () => latestBaseline,
    clearError: () => undefined,
  } satisfies ReturnType<typeof useBaselines>

  return renderToStaticMarkup(
    <PlayersView authState={authState} baselineActions={baselineActions} playerActions={playerActions} />,
  )
}

describe('PlayersView default layout', () => {
  it('starts as a roster-first screen without an always-open form panel', () => {
    const markup = renderPlayersView()

    expect(markup).toContain('aria-label="Spielerliste"')
    expect(markup).toContain('Sabine')
    expect(markup).toContain('Neu')
    expect(markup).not.toContain('Spieler auswaehlen oder neu anlegen')
    expect(markup).not.toContain('player-empty-detail')
  })
})
