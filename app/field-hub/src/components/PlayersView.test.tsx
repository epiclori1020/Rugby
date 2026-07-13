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
import type { ReturnerEntry } from '../domain/returners'
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

const returnerEntry: ReturnerEntry = {
  id: 'returner-1',
  userId: 'user-1',
  playerId: player.id,
  sessionLogId: sessionLog.id,
  medicalContactNote: '',
  currentStage: 'gelb',
  speedCap: '3x20 m smooth',
  codDecelCap: 'low',
  conditioningCap: 'bike only',
  contactCap: 'none',
  allowedToday: 'non-contact',
  plannedCaps: '',
  completed: '',
  symptomsDuring: '',
  nextMorning: '',
  decision: 'bleiben',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T20:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T20:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

function buildPlayerActions(overrides: Partial<ReturnType<typeof usePlayers>> = {}) {
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
    ...overrides,
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

    expect(markup).toContain('<section class="player-list" aria-label="Spielerliste"')
    expect(markup).toContain('Sabine')
    expect(markup).toContain('Spieler anlegen')
    expect(markup).toContain('of-button-primary')
    expect(markup).toContain('of-athlete-row')
    expect(markup).not.toContain('player-list-item')
    expect(markup).toContain('Suche nach Name, Position, Cluster')
    expect(markup).toContain('Returner')
    expect(markup).toContain('Offene Themen')
    expect(markup).toContain('aria-pressed="true"')
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

  it('opens the selected player in the Einheit Returner loop', async () => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    await localDb.delete()
    await localDb.open()
    const onOpenReturner = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <PlayersView
          authState={authState}
          onOpenReturner={onOpenReturner}
          playerActions={buildPlayerActions()}
        />,
      )
    })

    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Sabine'))?.click()
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).reverse().find((button) => button.textContent === 'Returner')?.click()
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'In Einheit öffnen')?.click()
    })

    expect(onOpenReturner).toHaveBeenCalledWith(player.id)
    root.unmount()
  })

  it('restores the selected player on the Returner detail tab', async () => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    await localDb.delete()
    await localDb.open()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <PlayersView
          authState={authState}
          initialDetailTab="returner"
          initialSelectedPlayerId={player.id}
          playerActions={buildPlayerActions()}
        />,
      )
    })

    expect(container.querySelector('.player-detail')).not.toBeNull()
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe('Returner')
    root.unmount()
  })

  it('does not lock the page for a stale selected player id', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <PlayersView
          authState={authState}
          initialSelectedPlayerId="missing-player"
          playerActions={buildPlayerActions({ players: [] })}
        />,
      )
    })

    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    root.unmount()
    container.remove()
  })

  it('returns focus to the matching row when a restored profile closes', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <PlayersView
          authState={authState}
          initialSelectedPlayerId={player.id}
          playerActions={buildPlayerActions()}
        />,
      )
    })
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(document.activeElement).toBe(container.querySelector('.of-athlete-row-content'))
    root.unmount()
    container.remove()
  })

  it('renders athlete rows as accessible profile openers with selected state', async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.sessionLogs.put(sessionLog)
    await localDb.playerSessionEntries.put({ ...playerSessionEntry, limits: ['kein_sprint'] })
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<PlayersView authState={authState} playerActions={buildPlayerActions()} />)
    })
    await act(async () => {
      await Promise.resolve()
    })

    const playerButton = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Sabine'),
    )
    expect(playerButton?.getAttribute('aria-label')).toContain('Profil öffnen: Sabine')
    expect(playerButton?.getAttribute('aria-label')).toContain('Prop')
    expect(playerButton?.getAttribute('aria-label')).toContain('Ampel Gelb')
    expect(playerButton?.getAttribute('aria-label')).toContain('offene Themen')
    expect(playerButton?.getAttribute('aria-current')).toBeNull()

    await act(async () => {
      playerButton?.click()
    })

    expect(playerButton?.getAttribute('aria-current')).toBe('true')

    root.unmount()
  })

  it('starts the profile overview with operational athlete context before admin data', async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.sessionLogs.put(sessionLog)
    await localDb.playerSessionEntries.put({ ...playerSessionEntry, limits: ['kein_sprint'] })
    await localDb.returnerEntries.put(returnerEntry)
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

    const text = container.textContent ?? ''
    expect(text).toContain('Letzte Teilnahme')
    expect(container.querySelector('.player-profile-summary')).toBeTruthy()
    expect(container.querySelectorAll('.player-profile-summary dt')).toHaveLength(4)
    expect(container.querySelectorAll('.player-profile-summary dd')).toHaveLength(4)
    expect(container.querySelector('[aria-label="Aktueller Status"]')).toBeFalsy()
    expect(container.querySelector('[aria-label="Letzte Teilnahme"]')).toBeFalsy()
    expect(text).toContain('Aktuelle Limits')
    expect(text).toContain('Offene Themen')
    expect(text).toContain('Kurzer Verlauf')
    expect(text).toContain('Stammdaten & Consent')
    expect(text.indexOf('Letzte Teilnahme')).toBeLessThan(text.indexOf('Stammdaten & Consent'))
    expect(text).toContain('Kein Sprint')
    expect(text).toContain('Speed')

    root.unmount()
  })

  it('uses a list plus detail pane instead of a modal when the player area has iPad width', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query.includes('max-width: 839px') ? false : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
    }))
    await localDb.delete()
    await localDb.open()
    const container = document.createElement('div')
    const root = createRoot(container)

    try {
      await act(async () => {
        root.render(<PlayersView authState={authState} playerActions={buildPlayerActions()} />)
      })
      await act(async () => {
        Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Sabine'))?.click()
      })

      expect(container.textContent).toContain('Spielerprofil')
      expect(container.querySelector('.player-list')).toBeTruthy()
      expect(container.querySelector('[role="dialog"][aria-modal="true"]')).toBeFalsy()
    } finally {
      root.unmount()
      window.matchMedia = originalMatchMedia
    }
  })

  it('moves focus into the compact profile sheet and restores it to the opening row', async () => {
    await localDb.delete()
    await localDb.open()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(<PlayersView authState={authState} playerActions={buildPlayerActions()} />)
    })

    const playerButton = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Sabine'),
    )
    playerButton?.focus()

    await act(async () => {
      playerButton?.click()
    })

    const dialog = container.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')
    expect(dialog?.contains(document.activeElement)).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')

    const focusableElements = Array.from(
      dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]
    lastFocusable.focus()
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    })
    expect(document.activeElement).toBe(firstFocusable)

    firstFocusable.focus()
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }))
    })
    expect(document.activeElement).toBe(lastFocusable)

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(document.activeElement).toBe(playerButton)
    expect(document.body.style.overflow).toBe('')
    root.unmount()
    container.remove()
  })

  it('shows severity-first row status without turning the roster into a chip wall', async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.sessionLogs.put(sessionLog)
    await localDb.playerSessionEntries.put({
      ...playerSessionEntry,
      trafficLight: 'red',
      trafficLightSuggestion: 'red',
      movementConcern: true,
      limits: ['klaeren'],
    })
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<PlayersView authState={authState} playerActions={buildPlayerActions()} />)
    })
    await act(async () => {
      await Promise.resolve()
    })

    const row = container.querySelector<HTMLElement>('[data-player-id="player-1"]')
    expect(row?.textContent).toContain('Rot')
    expect(row?.textContent).toContain('offene Themen')
    expect(row?.textContent).not.toContain('Einwilligung offen')
    expect(row?.querySelectorAll('.of-status-chip')).toHaveLength(2)
    root.unmount()
  })

  it('keeps yellow open topics ahead of inactive roster status', async () => {
    await localDb.delete()
    await localDb.open()
    await localDb.sessionLogs.put(sessionLog)
    await localDb.playerSessionEntries.put(playerSessionEntry)
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <PlayersView
          authState={authState}
          playerActions={buildPlayerActions({ players: [{ ...player, active: false }] })}
        />,
      )
    })
    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Alle')
        ?.click()
    })

    const row = container.querySelector<HTMLElement>(`[data-player-id="${player.id}"]`)
    expect(row?.textContent).toContain('offene Themen')
    expect(row?.textContent).not.toContain('Inaktiv')
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

    expect(container.textContent).toContain('Letzte Teilnahme')
    expect(container.textContent).not.toContain('Rollierende Belastung')

    const loadTab = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Load')
    await act(async () => {
      loadTab?.click()
    })

    expect(container.textContent).toContain('Rollierende Belastung')
    expect(container.textContent).toContain('Session lokal nicht direkt verknuepft.')

    const issuesTab = Array.from(container.querySelectorAll('button'))
      .reverse()
      .find((button) => button.textContent === 'Issues')
    await act(async () => {
      issuesTab?.click()
    })

    expect(container.textContent).toContain('Beschwerden-Ort Verlauf')
    expect(container.textContent).toContain('Schulter')
    expect(container.textContent).not.toContain('Body Region')

    const testsTab = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Tests')
    await act(async () => {
      testsTab?.click()
    })

    expect(container.textContent).toContain('Messwertverlauf')
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
