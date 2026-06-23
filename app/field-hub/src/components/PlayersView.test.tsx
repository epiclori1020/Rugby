// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { ExerciseResult } from '../domain/exercises'
import type { Player } from '../domain/players'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import { emptyCheckInDraft } from '../domain/checkIn'
import type { BaselineEntry } from '../domain/baseline'
import type { MetricResult } from '../domain/metrics'
import type { PlayerSyncOverview } from '../domain/sync'
import type { useMetrics } from '../hooks/useMetrics'
import type { usePlayers } from '../hooks/usePlayers'
import type { AuthSessionState } from '../lib/auth'
import { localDb } from '../lib/localDb'
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

const sessionLog: SessionLog = {
  id: 'session-log-1',
  userId: 'user-1',
  sessionDefinitionId: 'session-def-1',
  date: '2026-06-18',
  status: 'completed',
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

const exerciseResult: ExerciseResult = {
  id: 'exercise-1',
  userId: 'user-1',
  playerId: player.id,
  sessionLogId: sessionLog.id,
  exerciseKey: 'trap_bar_deadlift',
  variant: 'A',
  sets: 3,
  reps: '5',
  loadValue: 90,
  loadUnit: 'kg',
  rpe: 7,
  rir: null,
  techniqueQuality: 'good',
  painResponse: 'none',
  notes: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T20:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T20:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const playerSessionEntry: PlayerSessionEntry = {
  ...emptyCheckInDraft,
  id: 'entry-1',
  userId: 'user-1',
  sessionLogId: sessionLog.id,
  playerId: player.id,
  present: true,
  readiness: 2,
  painScore: 4,
  painLocation: 'Knie',
  trafficLight: 'yellow',
  trafficLightSuggestion: 'yellow',
  sessionRpe: 7,
  durationMinutes: 75,
  sessionLoad: 525,
  postPainScore: 3,
  postPainLocation: 'Schulter',
  e2Decision: 'C',
  nextStep: 'halten',
  checkInSource: 'coach',
  playerSubmittedAt: null,
  coachEditedAt: null,
  playerNote: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T20:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T20:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const metricResult: MetricResult = {
  id: 'metric-1',
  userId: 'user-1',
  playerId: player.id,
  sessionLogId: sessionLog.id,
  metricKey: 'broad_jump',
  value: 246,
  attempt: 1,
  isValid: true,
  bodySide: 'none',
  contextNote: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T20:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T20:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const baselineEntry: BaselineEntry = {
  id: 'baseline-1',
  userId: 'user-1',
  playerId: player.id,
  sessionLogId: sessionLog.id,
  broadJumpCm: 230,
  medBallChestPassM: 6.1,
  medBallWeightKg: 3,
  sprint30m: null,
  note: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T20:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T20:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

function buildPlayerActions() {
  return {
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
}

function buildMetricActions(overrides: Partial<ReturnType<typeof useMetrics>> = {}): ReturnType<typeof useMetrics> {
  return {
    activePlayers: [player],
    clearError: () => undefined,
    entries: [],
    errorMessage: null,
    getMetricForPlayer: () => null,
    isLoading: false,
    refreshMetrics: async () => undefined,
    runSync: async () => syncOverview,
    savePlayerMetric: async () => ({ ok: true as const }),
    syncOverview,
    ...overrides,
  }
}

function renderPlayersView() {
  return renderToStaticMarkup(
    <PlayersView authState={authState} playerActions={buildPlayerActions()} />,
  )
}

describe('PlayersView default layout', () => {
  it('starts as a roster-first screen without an always-open form panel', () => {
    const markup = renderPlayersView()

    expect(markup).toContain('aria-label="Spielerliste"')
    expect(markup).toContain('Sabine')
    expect(markup).toContain('Neu')
    expect(markup).toContain('Suche nach Name, Position, Cluster')
    expect(markup).toContain('Returner')
    expect(markup).not.toContain('Spieler auswaehlen oder neu anlegen')
    expect(markup).not.toContain('player-empty-detail')
    expect(markup).not.toContain('Spielerprofil Tabs')
  })

  it('opens player detail only after clicking a roster item', async () => {
    await localDb.delete()
    await localDb.open()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<PlayersView authState={authState} playerActions={buildPlayerActions()} />)
    })

    expect(container.textContent).not.toContain('Übersicht')

    const playerButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Sabine'),
    )
    expect(playerButton).toBeTruthy()

    await act(async () => {
      playerButton?.click()
    })

    expect(container.textContent).toContain('Spielerprofil')
    expect(container.textContent).toContain('Übersicht')
    expect(container.textContent).not.toContain('Bearbeiten')
    expect(container.querySelector('[role="dialog"][aria-modal="true"]')).toBeTruthy()
    expect(container.querySelector('button[aria-label="Spieler bearbeiten"]')).toBeTruthy()

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(container.textContent).not.toContain('Spielerprofil')

    await act(async () => {
      playerButton?.click()
    })
    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Spielerprofil-Hintergrund schließen"]')?.click()
    })

    expect(container.textContent).not.toContain('Spielerprofil')

    await act(async () => {
      playerButton?.click()
    })
    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Spielerprofil schließen"]')?.click()
    })

    expect(container.textContent).not.toContain('Spielerprofil')

    root.unmount()
  })

  it('opens player editing from the profile settings icon', async () => {
    await localDb.delete()
    await localDb.open()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<PlayersView authState={authState} playerActions={buildPlayerActions()} />)
    })

    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Sabine'))?.click()
    })
    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Spieler bearbeiten"]')?.click()
    })

    expect(container.textContent).toContain('Spieler-Stammdaten')
    expect(container.textContent).toContain('Deaktivieren')
    expect(container.textContent).toContain('Loeschen')

    root.unmount()
  })

  it('shows structured exercise progression in the player training tab', async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.sessionLogs.put(sessionLog)
    await localDb.exerciseResults.put(exerciseResult)
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<PlayersView authState={authState} playerActions={buildPlayerActions()} />)
    })

    await act(async () => {
      await Promise.resolve()
    })

    const playerButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Sabine'),
    )
    await act(async () => {
      playerButton?.click()
    })

    const trainingTab = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent === 'Training',
    )
    await act(async () => {
      trainingTab?.click()
    })

    expect(container.textContent).toContain('Exercise-Progression')
    expect(container.textContent).toContain('Trap Bar Deadlift')
    expect(container.textContent).toContain('90 kg')

    root.unmount()
  })

  it('keeps overview compact and renders player analysis only inside detail tabs', async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.sessionLogs.put(sessionLog)
    await localDb.playerSessionEntries.put(playerSessionEntry)
    await localDb.metricResults.put(metricResult)
    await localDb.exerciseResults.put(exerciseResult)
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<PlayersView authState={authState} playerActions={buildPlayerActions()} />)
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).not.toContain('Player Analysis')

    const playerButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Sabine'),
    )
    await act(async () => {
      playerButton?.click()
    })

    expect(container.textContent).toContain('Letzte Einheit')
    expect(container.textContent).not.toContain('Rolling Load')

    const loadTab = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Load')
    await act(async () => {
      loadTab?.click()
    })

    expect(container.textContent).toContain('Rolling Load')
    expect(container.textContent).toContain('Session lokal nicht direkt verknuepft.')

    const issuesTab = Array.from(container.querySelectorAll('button'))
      .reverse()
      .find((button) => button.textContent === 'Issues')
    await act(async () => {
      issuesTab?.click()
    })

    expect(container.textContent).toContain('Pain Location Text History')
    expect(container.textContent).toContain('Schulter')
    expect(container.textContent).not.toContain('Body Region')

    const testsTab = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Tests')
    await act(async () => {
      testsTab?.click()
    })

    expect(container.textContent).toContain('Metric History')
    expect(container.textContent).toContain('Broad Jump')

    root.unmount()
  })

  it('prefers saved metric results over legacy baseline fallback in profile test cards', async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.sessionLogs.put(sessionLog)
    await localDb.baselineEntries.put(baselineEntry)
    await localDb.metricResults.put(metricResult)
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<PlayersView authState={authState} playerActions={buildPlayerActions()} />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Sabine'))?.click()
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Tests')?.click()
    })

    const broadJumpCard = Array.from(container.querySelectorAll('.profile-test-card')).find((card) =>
      card.textContent?.includes('Broad Jump'),
    )

    expect(broadJumpCard?.textContent).toContain('246 cm')
    expect(broadJumpCard?.textContent).not.toContain('230 cm')

    root.unmount()
  })

  it('saves profile test values directly through metric actions', async () => {
    await localDb.delete()
    await localDb.open()
    const savePlayerMetric = vi.fn(async () => ({ ok: true as const }))
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <PlayersView
          authState={authState}
          metricActions={buildMetricActions({ savePlayerMetric })}
          playerActions={buildPlayerActions()}
          metricSessionLabel="Donnerstag · 2026-06-18"
        />,
      )
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Sabine'))?.click()
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Tests')?.click()
    })

    const broadJumpInput = Array.from(container.querySelectorAll<HTMLInputElement>('input')).find(
      (input) => input.getAttribute('aria-label') === 'Broad Jump Wert',
    )
    expect(broadJumpInput).toBeTruthy()

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      valueSetter?.call(broadJumpInput, '250')
      broadJumpInput?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Broad Jump speichern')?.click()
      await Promise.resolve()
    })

    expect(savePlayerMetric).toHaveBeenCalledWith(
      player,
      expect.objectContaining({ attempt: 1, bodySide: 'none', metricKey: 'broad_jump', value: '250' }),
    )
    expect(container.textContent).toContain('Wird in Einheit Donnerstag · 2026-06-18 als Versuch 1 erfasst.')

    root.unmount()
  })

  it('keeps profile test drafts and shows metric errors when direct save fails', async () => {
    await localDb.delete()
    await localDb.open()
    const savePlayerMetric = vi.fn(async () => ({
      ok: false as const,
      errorMessage: 'Metric-Wert konnte nicht gespeichert werden.',
    }))
    const clearError = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <PlayersView
          authState={authState}
          metricActions={buildMetricActions({ clearError, savePlayerMetric })}
          playerActions={buildPlayerActions()}
        />,
      )
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Sabine'))?.click()
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Tests')?.click()
    })

    const broadJumpInput = Array.from(container.querySelectorAll<HTMLInputElement>('input')).find(
      (input) => input.getAttribute('aria-label') === 'Broad Jump Wert',
    )
    expect(broadJumpInput).toBeTruthy()

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      valueSetter?.call(broadJumpInput, '250')
      broadJumpInput?.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Broad Jump speichern')?.click()
      await Promise.resolve()
    })

    expect(clearError).toHaveBeenCalledTimes(2)
    expect(savePlayerMetric).toHaveBeenCalledWith(
      player,
      expect.objectContaining({ attempt: 1, bodySide: 'none', metricKey: 'broad_jump', value: '250' }),
    )
    expect(broadJumpInput?.value).toBe('250')
    expect(container.textContent).toContain('Metric-Wert konnte nicht gespeichert werden.')
    expect(container.textContent).not.toContain('Broad Jump gespeichert.')

    clearError.mockClear()

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      valueSetter?.call(broadJumpInput, '251')
      broadJumpInput?.dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(clearError).toHaveBeenCalledTimes(1)
    expect(broadJumpInput?.value).toBe('251')

    root.unmount()
  })

  it('calls source session navigation for correctable source rows', async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.sessionLogs.put(sessionLog)
    await localDb.playerSessionEntries.put(playerSessionEntry)
    const openedSources: string[] = []
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <PlayersView
          authState={authState}
          onOpenSourceSession={(source) => openedSources.push(`${source.sessionDefinitionId}:${source.correctionTarget}`)}
          playerActions={buildPlayerActions()}
        />,
      )
    })
    await act(async () => {
      await Promise.resolve()
    })

    const playerButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Sabine'),
    )
    await act(async () => {
      playerButton?.click()
    })
    const loadTab = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Load')
    await act(async () => {
      loadTab?.click()
    })
    const sourceButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Session öffnen/korrigieren'),
    )
    await act(async () => {
      sourceButton?.click()
    })

    expect(openedSources).toEqual(['session-def-1:nachbereitung'])

    root.unmount()
  })

  it('offers source correction from pain/readiness chart rows', async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.sessionLogs.put(sessionLog)
    await localDb.playerSessionEntries.put(playerSessionEntry)
    const openedSources: string[] = []
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <PlayersView
          authState={authState}
          canOpenSourceSession={() => true}
          onOpenSourceSession={(source) => openedSources.push(`${source.table}:${source.correctionTarget}`)}
          playerActions={buildPlayerActions()}
        />,
      )
    })
    await act(async () => {
      await Promise.resolve()
    })

    const playerButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Sabine'),
    )
    await act(async () => {
      playerButton?.click()
    })
    const issuesTab = Array.from(container.querySelectorAll('button'))
      .reverse()
      .find((button) => button.textContent === 'Issues')
    await act(async () => {
      issuesTab?.click()
    })
    const sourceButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Session öffnen/korrigieren'),
    )
    await act(async () => {
      sourceButton?.click()
    })

    expect(openedSources).toEqual(['player_session_entries:check-in'])

    root.unmount()
  })
})
