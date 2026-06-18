// @vitest-environment jsdom
import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry, PlayerWarning } from '../domain/checkIn'
import type { PlayerObservation } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { PlayerSyncOverview } from '../domain/sync'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { usePlayers } from '../hooks/usePlayers'
import type { AuthSessionState } from '../lib/auth'
import { CheckInView } from './CheckInView'

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

const selectedSession: SessionDefinition = {
  id: 'session-1',
  date: '2026-06-16',
  kw: 'KW25',
  title: 'Dienstag',
  type: 'training',
  summary: '',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const deletedPlayerEntry: PlayerSessionEntry = {
  id: 'entry-deleted-player',
  userId: 'user-1',
  sessionLogId: 'session-log-1',
  playerId: 'deleted-player',
  present: true,
  readiness: 2,
  lifeFlag: '',
  painScore: 5,
  painLocation: '',
  returnerFlag: 'ja',
  sessionReaction: 'none',
  redFlag: 'none',
  movementConcern: false,
  previousWarning: false,
  trafficLight: 'red',
  trafficLightSuggestion: 'red',
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

const deletedPlayerWarning: PlayerWarning = {
  playerId: 'deleted-player',
  trafficLight: 'red',
  returnerFlag: 'ja',
  limits: [],
  observation: 'stale warning',
  e2Decision: null,
  nextStep: null,
  postPainScore: null,
  postPainLocation: '',
  sessionLoad: null,
  sessionDate: '2026-06-13',
}

const activePlayer: Player = {
  id: 'player-active',
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

const activePlayerObservation: PlayerObservation = {
  playerId: activePlayer.id,
  observation: 'Hamstring im Speed-Block beobachten',
  sessionDate: '2026-06-13',
}

const autoGreenEntry: PlayerSessionEntry = {
  ...deletedPlayerEntry,
  id: 'entry-active-player',
  playerId: activePlayer.id,
  painScore: 0,
  returnerFlag: 'nein',
  redFlag: 'none',
  trafficLight: 'green',
  trafficLightSuggestion: 'green',
  trafficLightWasManual: false,
  syncStatus: 'synced',
}

const publicCheckInActions = {
  publicCheckInLinks: [],
  publicCheckInSubmissions: [],
  publicCheckInNotice: null,
  observations: [],
  saveKioskEntry: async () => ({ ok: true as const, entry: autoGreenEntry }),
  resetEntry: async () => ({ ok: true as const, entry: autoGreenEntry }),
  resetSessionCoachEntries: async () => ({ ok: true as const, resetCount: 0 }),
  createPublicLink: async () => null,
  closePublicLink: async () => undefined,
}

function createCheckInActions(
  overrides: Partial<ReturnType<typeof useCheckIns>> = {},
): ReturnType<typeof useCheckIns> {
  return {
    activePlayers: [activePlayer],
    entries: [autoGreenEntry],
    errorMessage: null,
    expectedPlayerIds: [],
    warnings: [],
    syncOverview,
    isLoading: false,
    sessionLogId: 'session-log-1',
    refreshLocalCheckIns: async () => undefined,
    runSync: async () => syncOverview,
    saveEntry: async () => ({ ok: true as const, entry: autoGreenEntry }),
    saveSessionPatch: async () => undefined,
    getEntryForPlayer: () => autoGreenEntry,
    sessionLog: null,
    ...publicCheckInActions,
    clearError: () => undefined,
    ...overrides,
  }
}

function createPlayerActions(overrides: Partial<ReturnType<typeof usePlayers>> = {}): ReturnType<typeof usePlayers> {
  return {
    players: [activePlayer],
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
  }
}

async function renderInteractiveCheckInView({
  checkInActions = createCheckInActions(),
  playerActions = createPlayerActions(),
}: {
  checkInActions?: ReturnType<typeof useCheckIns>
  playerActions?: ReturnType<typeof usePlayers>
} = {}) {
  const container = document.createElement('div')
  const root = createRoot(container)

  await act(async () => {
    root.render(
      <CheckInView
        authState={authState}
        checkInActions={checkInActions}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        onStartKiosk={() => undefined}
        playerActions={playerActions}
        returnerCaps={[]}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
      />,
    )
  })

  return { container, root }
}

function getButton(container: HTMLElement, name: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === name)

  if (!button) {
    throw new Error(`Button ${name} not found`)
  }

  return button as HTMLButtonElement
}

function getInputByPlaceholder(container: HTMLElement, placeholder: string) {
  const input = [...container.querySelectorAll('input')].find((item) => item.placeholder === placeholder)

  if (!input) {
    throw new Error(`Input ${placeholder} not found`)
  }

  return input as HTMLInputElement
}

async function changeInput(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

  await act(async () => {
    valueSetter?.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

async function openPlayerSheet(container: HTMLElement) {
  const playerCard = container.querySelector<HTMLButtonElement>('.checkin-player-card')

  if (!playerCard) {
    throw new Error('Player card not found')
  }

  await act(async () => {
    playerCard.click()
  })
}

describe('CheckInView reset protection', () => {
  let root: Root | null = null
  let confirmSpy: ReturnType<typeof vi.spyOn> | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    vi.useFakeTimers()
  })

  afterEach(async () => {
    confirmSpy?.mockRestore()
    confirmSpy = null
    vi.useRealTimers()
    if (root) {
      await act(async () => {
        root?.unmount()
      })
      root = null
    }
  })

  it('does not reset an entry immediately when reset is clicked', async () => {
    const resetEntry = vi.fn(async () => ({ ok: true as const, entry: autoGreenEntry }))
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({ resetEntry }),
    })
    root = rendered.root

    await openPlayerSheet(rendered.container)
    await act(async () => {
      getButton(rendered.container, 'Zurücksetzen').click()
    })

    expect(resetEntry).not.toHaveBeenCalled()
    expect(rendered.container.textContent).toContain('wird in 5 Sekunden ausgeführt')
  })

  it('runs a pending single reset after five seconds', async () => {
    const resetEntry = vi.fn(async () => ({ ok: true as const, entry: autoGreenEntry }))
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({ resetEntry }),
    })
    root = rendered.root

    await openPlayerSheet(rendered.container)
    await act(async () => {
      getButton(rendered.container, 'Zurücksetzen').click()
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    expect(resetEntry).toHaveBeenCalledTimes(1)
    expect(resetEntry).toHaveBeenCalledWith(autoGreenEntry.id)
  })

  it('cancels a pending single reset when undo is clicked', async () => {
    const resetEntry = vi.fn(async () => ({ ok: true as const, entry: autoGreenEntry }))
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({ resetEntry }),
    })
    root = rendered.root

    await openPlayerSheet(rendered.container)
    await act(async () => {
      getButton(rendered.container, 'Zurücksetzen').click()
    })
    await act(async () => {
      getButton(rendered.container, 'Rückgängig').click()
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    expect(resetEntry).not.toHaveBeenCalled()
  })

  it('does not run bulk reset when confirmation is cancelled', async () => {
    const resetSessionCoachEntries = vi.fn(async () => ({ ok: true as const, resetCount: 1 }))
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({ resetSessionCoachEntries }),
    })
    root = rendered.root

    await act(async () => {
      getButton(rendered.container, 'Coach-Check-ins zurücksetzen').click()
    })

    expect(confirmSpy).toHaveBeenCalledWith(
      'Coach-Eingaben dieser Einheit zurücksetzen? Self-Check-ins und explizite Nicht-da-Einträge bleiben geschützt.',
    )
    expect(resetSessionCoachEntries).not.toHaveBeenCalled()
  })

  it('runs bulk reset when confirmation is accepted', async () => {
    const resetSessionCoachEntries = vi.fn(async () => ({ ok: true as const, resetCount: 1 }))
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({ resetSessionCoachEntries }),
    })
    root = rendered.root

    await act(async () => {
      getButton(rendered.container, 'Coach-Check-ins zurücksetzen').click()
    })

    expect(resetSessionCoachEntries).toHaveBeenCalledTimes(1)
    expect(rendered.container.textContent).toContain('1 Check-in-Einträge zurückgesetzt.')
  })
})

describe('CheckInView multi-select check-in fields', () => {
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

  it('toggles one life flag without collapsing existing values', async () => {
    const entry = { ...autoGreenEntry, lifeFlag: 'Stress; Muskelkater' }
    const saveEntry = vi.fn(async (_player: Player, patch: Partial<PlayerSessionEntry>) => ({
      ok: true as const,
      entry: { ...entry, ...patch },
    }))
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({
        entries: [entry],
        getEntryForPlayer: () => entry,
        saveEntry,
      }),
    })
    root = rendered.root

    await openPlayerSheet(rendered.container)
    await act(async () => {
      getButton(rendered.container, 'Stress').click()
      await Promise.resolve()
    })

    expect(saveEntry).toHaveBeenCalledWith(
      activePlayer,
      expect.objectContaining({ lifeFlag: 'Muskelkater', previousWarning: false }),
      undefined,
    )
  })

  it('adds pain locations and derives head-neck red flag without losing existing locations', async () => {
    const entry = { ...autoGreenEntry, painScore: 2, painLocation: 'Wade/Achilles; Knie', redFlag: 'none' as const }
    const saveEntry = vi.fn(async (_player: Player, patch: Partial<PlayerSessionEntry>) => ({
      ok: true as const,
      entry: { ...entry, ...patch },
    }))
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({
        entries: [entry],
        getEntryForPlayer: () => entry,
        saveEntry,
      }),
    })
    root = rendered.root

    await openPlayerSheet(rendered.container)
    await act(async () => {
      getButton(rendered.container, 'Kopf/Nacken').click()
      await Promise.resolve()
    })

    expect(saveEntry).toHaveBeenCalledWith(
      activePlayer,
      expect.objectContaining({
        painLocation: 'Wade/Achilles; Knie; Kopf/Nacken',
        redFlag: 'head_neck_neuro',
        previousWarning: false,
      }),
      undefined,
    )
  })

  it('preserves a stronger coach red flag when pain location changes', async () => {
    const entry = {
      ...autoGreenEntry,
      painScore: 2,
      painLocation: 'Sprunggelenk',
      redFlag: 'acute_instability' as const,
    }
    const saveEntry = vi.fn(async (_player: Player, patch: Partial<PlayerSessionEntry>) => ({
      ok: true as const,
      entry: { ...entry, ...patch },
    }))
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({
        entries: [entry],
        getEntryForPlayer: () => entry,
        saveEntry,
      }),
    })
    root = rendered.root

    await openPlayerSheet(rendered.container)
    await act(async () => {
      getButton(rendered.container, 'Knie').click()
      await Promise.resolve()
    })

    expect(saveEntry).toHaveBeenCalledWith(
      activePlayer,
      expect.objectContaining({
        painLocation: 'Sprunggelenk; Knie',
        redFlag: 'acute_instability',
        previousWarning: false,
      }),
      undefined,
    )
  })

  it('keeps a head-neck red flag until the coach explicitly clears it', async () => {
    const entry = {
      ...autoGreenEntry,
      painScore: 2,
      painLocation: 'Sprunggelenk',
      redFlag: 'head_neck_neuro' as const,
    }
    const saveEntry = vi.fn(async (_player: Player, patch: Partial<PlayerSessionEntry>) => ({
      ok: true as const,
      entry: { ...entry, ...patch },
    }))
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({
        entries: [entry],
        getEntryForPlayer: () => entry,
        saveEntry,
      }),
    })
    root = rendered.root

    await openPlayerSheet(rendered.container)
    expect(rendered.container.textContent).toContain('Red Flag bleibt aktiv')

    await act(async () => {
      getButton(rendered.container, 'Knie').click()
      await Promise.resolve()
    })

    expect(saveEntry).toHaveBeenLastCalledWith(
      activePlayer,
      expect.objectContaining({
        painLocation: 'Sprunggelenk; Knie',
        redFlag: 'head_neck_neuro',
      }),
      undefined,
    )

    await act(async () => {
      getButton(rendered.container, 'Keine Red Flag').click()
      await Promise.resolve()
    })

    expect(saveEntry).toHaveBeenLastCalledWith(
      activePlayer,
      expect.objectContaining({
        redFlag: 'none',
        previousWarning: false,
      }),
      undefined,
    )
  })

  it('treats coach pain freetext as an additive note instead of editing selected chips', async () => {
    const entry = {
      ...autoGreenEntry,
      painScore: 2,
      painLocation: 'Knie; Schulter rechts',
      redFlag: 'none' as const,
    }
    const saveEntry = vi.fn(async (_player: Player, patch: Partial<PlayerSessionEntry>) => ({
      ok: true as const,
      entry: { ...entry, ...patch },
    }))
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({
        entries: [entry],
        getEntryForPlayer: () => entry,
        saveEntry,
      }),
    })
    root = rendered.root

    await openPlayerSheet(rendered.container)
    const customPainInput = getInputByPlaceholder(rendered.container, 'z. B. Wade rechts')
    expect(customPainInput.value).toBe('Schulter rechts')

    await changeInput(customPainInput, 'Schulter rechts; Wade links')
    await act(async () => {
      customPainInput.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      await Promise.resolve()
    })

    expect(saveEntry).toHaveBeenCalledWith(
      activePlayer,
      expect.objectContaining({
        painLocation: 'Knie; Schulter rechts; Wade links',
        redFlag: 'none',
        previousWarning: false,
      }),
      undefined,
    )
  })

  it('preserves coach custom pain notes when toggling a pain-location chip', async () => {
    const entry = {
      ...autoGreenEntry,
      painScore: 2,
      painLocation: 'Schulter rechts',
      redFlag: 'none' as const,
    }
    const saveEntry = vi.fn(async (_player: Player, patch: Partial<PlayerSessionEntry>) => ({
      ok: true as const,
      entry: { ...entry, ...patch },
    }))
    const rendered = await renderInteractiveCheckInView({
      checkInActions: createCheckInActions({
        entries: [entry],
        getEntryForPlayer: () => entry,
        saveEntry,
      }),
    })
    root = rendered.root

    await openPlayerSheet(rendered.container)
    expect(getInputByPlaceholder(rendered.container, 'z. B. Wade rechts').value).toBe('Schulter rechts')

    await act(async () => {
      getButton(rendered.container, 'Knie').click()
      await Promise.resolve()
    })

    expect(saveEntry).toHaveBeenCalledWith(
      activePlayer,
      expect.objectContaining({
        painLocation: 'Knie; Schulter rechts',
        redFlag: 'none',
        previousWarning: false,
      }),
      undefined,
    )
  })
})

describe('CheckInView active player metrics', () => {
  it('renders a compact player finder instead of full open forms by default', () => {
    const secondPlayer: Player = { ...activePlayer, id: 'player-second', name: 'Anton' }
    const checkInActions = {
      activePlayers: [activePlayer, secondPlayer],
      entries: [autoGreenEntry],
      errorMessage: null,
      expectedPlayerIds: [],
      warnings: [],
      syncOverview,
      isLoading: false,
      sessionLogId: 'session-log-1',
      refreshLocalCheckIns: async () => undefined,
      runSync: async () => syncOverview,
      saveEntry: async () => ({ ok: true as const, entry: autoGreenEntry }),
      saveSessionPatch: async () => undefined,
      getEntryForPlayer: (player: Player) => ({ ...autoGreenEntry, id: `entry-${player.id}`, playerId: player.id }),
      sessionLog: null,
      ...publicCheckInActions,
      clearError: () => undefined,
    } satisfies ReturnType<typeof useCheckIns>
    const playerActions = {
      players: [activePlayer, secondPlayer],
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

    const markup = renderToStaticMarkup(
      <CheckInView
        authState={authState}
        checkInActions={checkInActions}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        onStartKiosk={() => undefined}
        playerActions={playerActions}
        returnerCaps={[]}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
      />,
    )

    expect(markup).toContain('Name suchen')
    expect(markup).toContain('Max')
    expect(markup).toContain('Anton')
    expect(markup).not.toContain('aria-label="Readiness Max"')
    expect(markup).not.toContain('aria-label="Schmerz Max"')
  })

  it('does not count stale entries for deleted players', () => {
    const checkInActions = {
      activePlayers: [],
      entries: [deletedPlayerEntry],
      errorMessage: null,
      expectedPlayerIds: [],
      warnings: [],
      syncOverview,
      isLoading: false,
      sessionLogId: 'session-log-1',
      refreshLocalCheckIns: async () => undefined,
      runSync: async () => syncOverview,
      saveEntry: async () => ({ ok: true as const, entry: deletedPlayerEntry }),
      saveSessionPatch: async () => undefined,
      getEntryForPlayer: (player: Player) => ({ ...deletedPlayerEntry, playerId: player.id }),
      sessionLog: null,
      ...publicCheckInActions,
      clearError: () => undefined,
    } satisfies ReturnType<typeof useCheckIns>
    const playerActions = {
      players: [],
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

    const markup = renderToStaticMarkup(
      <CheckInView
        authState={authState}
        checkInActions={checkInActions}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        onStartKiosk={() => undefined}
        playerActions={playerActions}
        returnerCaps={[]}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
      />,
    )

    expect(markup).toContain('<span>Da / offen</span><strong>0 / 0</strong>')
    expect(markup).toContain('<span>Gelb / Rot</span><strong>0 / 0</strong>')
    expect(markup).toContain('<span>Returner / Klärung</span><strong>0 / 0</strong>')
  })

  it('does not show stale warnings for deleted players', () => {
    const checkInActions = {
      activePlayers: [],
      entries: [],
      errorMessage: null,
      expectedPlayerIds: [],
      warnings: [deletedPlayerWarning],
      syncOverview,
      isLoading: false,
      sessionLogId: 'session-log-1',
      refreshLocalCheckIns: async () => undefined,
      runSync: async () => syncOverview,
      saveEntry: async () => ({ ok: true as const, entry: deletedPlayerEntry }),
      saveSessionPatch: async () => undefined,
      getEntryForPlayer: (player: Player) => ({ ...deletedPlayerEntry, playerId: player.id }),
      sessionLog: null,
      ...publicCheckInActions,
      clearError: () => undefined,
    } satisfies ReturnType<typeof useCheckIns>
    const playerActions = {
      players: [],
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

    const markup = renderToStaticMarkup(
      <CheckInView
        authState={authState}
        checkInActions={checkInActions}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        onStartKiosk={() => undefined}
        playerActions={playerActions}
        returnerCaps={[]}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
      />,
    )

    expect(markup).not.toContain('Offene Warnungen aus letzter Einheit')
    expect(markup).not.toContain('stale warning')
  })

  it('keeps automatic Ampel and Safety defaults visually neutral until the coach acts', () => {
    const checkInActions = {
      activePlayers: [activePlayer],
      entries: [autoGreenEntry],
      errorMessage: null,
      expectedPlayerIds: [],
      warnings: [],
      syncOverview,
      isLoading: false,
      sessionLogId: 'session-log-1',
      refreshLocalCheckIns: async () => undefined,
      runSync: async () => syncOverview,
      saveEntry: async () => ({ ok: true as const, entry: deletedPlayerEntry }),
      saveSessionPatch: async () => undefined,
      getEntryForPlayer: () => autoGreenEntry,
      sessionLog: null,
      ...publicCheckInActions,
      clearError: () => undefined,
    } satisfies ReturnType<typeof useCheckIns>
    const playerActions = {
      players: [activePlayer],
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

    const markup = renderToStaticMarkup(
      <CheckInView
        authState={authState}
        checkInActions={checkInActions}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        onStartKiosk={() => undefined}
        playerActions={playerActions}
        returnerCaps={[]}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
      />,
    )

    expect(markup).toContain('Name suchen')
    expect(markup).not.toContain('traffic-chip green active')
    expect(markup).not.toContain('class="segmented active danger" type="button">Keine Red Flag')
    expect(markup).not.toContain('segmented active danger')
  })

  it('shows player observations separately from safety warnings', () => {
    const checkInActions = {
      activePlayers: [activePlayer],
      entries: [autoGreenEntry],
      errorMessage: null,
      expectedPlayerIds: [],
      warnings: [],
      syncOverview,
      isLoading: false,
      sessionLogId: 'session-log-1',
      refreshLocalCheckIns: async () => undefined,
      runSync: async () => syncOverview,
      saveEntry: async () => ({ ok: true as const, entry: deletedPlayerEntry }),
      saveSessionPatch: async () => undefined,
      getEntryForPlayer: () => autoGreenEntry,
      sessionLog: null,
      ...publicCheckInActions,
      observations: [activePlayerObservation],
      clearError: () => undefined,
    } satisfies ReturnType<typeof useCheckIns>
    const playerActions = {
      players: [activePlayer],
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

    const markup = renderToStaticMarkup(
      <CheckInView
        authState={authState}
        checkInActions={checkInActions}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        onStartKiosk={() => undefined}
        playerActions={playerActions}
        returnerCaps={[]}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
      />,
    )

    expect(markup).toContain('Notizen aus letzter Einheit')
    expect(markup).toContain('Hamstring im Speed-Block beobachten')
    expect(markup).not.toContain('Offene Warnungen/Beobachtungen')
  })
})
