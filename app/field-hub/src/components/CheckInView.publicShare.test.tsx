// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { PublicCheckInLink } from '../domain/publicCheckIn'
import type { PlayerSyncOverview } from '../domain/sync'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { usePlayers } from '../hooks/usePlayers'
import type { AuthSessionState } from '../lib/auth'
import { CheckInView } from './CheckInView'

const qrCodeMock = vi.hoisted(() => ({
  toDataURL: vi.fn(async () => 'data:image/png;base64,qr'),
}))

vi.mock('qrcode', () => qrCodeMock)

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
  sessionReaction: 'none',
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

const activeLink: PublicCheckInLink = {
  id: 'link-1',
  userId: 'user-1',
  sessionDefinitionId: selectedSession.id,
  sessionTitle: selectedSession.title,
  sessionDate: selectedSession.date,
  tokenHash: 'a'.repeat(64),
  expiresAt: '2026-06-16T23:00:00.000Z',
  closedAt: null,
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

function createdPublicLink(url = 'https://field.test/#/checkin/token') {
  return {
    link: activeLink,
    linkPlayers: [],
    rawToken: 'token',
    url,
  }
}

function buildCheckInActions(
  overrides: Partial<ReturnType<typeof useCheckIns>> = {},
): ReturnType<typeof useCheckIns> {
  return {
    activePlayers: [player],
    entries: [entry],
    errorMessage: null,
    expectedPlayerIds: [],
    warnings: [],
    observations: [],
    syncOverview,
    isLoading: false,
    sessionLogId: 'session-log-1',
    publicCheckInLinks: [],
    publicCheckInSubmissions: [],
    publicCheckInNotice: null,
    refreshLocalCheckIns: async () => undefined,
    runSync: async () => syncOverview,
    saveEntry: async () => ({ ok: true as const, entry }),
    saveKioskEntry: async () => ({ ok: true as const, entry }),
    resetEntry: async () => ({ ok: true as const, entry }),
    resetSessionCoachEntries: async () => ({ ok: true as const, resetCount: 0 }),
    saveSessionPatch: async () => undefined,
    createPublicLink: async () => null,
    closePublicLink: async () => undefined,
    getEntryForPlayer: () => entry,
    sessionLog: null,
    clearError: () => undefined,
    ...overrides,
  } satisfies ReturnType<typeof useCheckIns>
}

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

async function renderCheckInView({
  checkInActions = buildCheckInActions(),
  onSessionChange = () => undefined,
}: {
  checkInActions?: ReturnType<typeof useCheckIns>
  onSessionChange?: (sessionId: string) => void
} = {}) {
  const container = document.createElement('div')
  const root = createRoot(container)

  await act(async () => {
    root.render(
      <CheckInView
        authState={authState}
        checkInActions={checkInActions}
        onNavigate={() => undefined}
        onSessionChange={onSessionChange}
        onStartKiosk={() => undefined}
        playerActions={playerActions}
        returnerCaps={[]}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession, { ...selectedSession, id: 'session-2', title: 'Donnerstag' }]}
      />,
    )
  })

  return { container, root }
}

async function flushAsyncUi() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('CheckInView public check-in sharing', () => {
  let root: Root | null = null

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    qrCodeMock.toDataURL.mockReset()
    qrCodeMock.toDataURL.mockResolvedValue('data:image/png;base64,qr')
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
      root = null
    }
  })

  it('creates a link without auto-calling native share', async () => {
    const createPublicLink = vi.fn(async () => createdPublicLink())
    const rendered = await renderCheckInView({ checkInActions: buildCheckInActions({ createPublicLink }) })
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-create-link"]')?.click()
    })
    await flushAsyncUi()

    expect(createPublicLink).toHaveBeenCalledTimes(1)
    expect(navigator.share).not.toHaveBeenCalled()
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-panel"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-qr"]')).not.toBeNull()
  })

  it('calls native share only from the share panel button', async () => {
    const rendered = await renderCheckInView({
      checkInActions: buildCheckInActions({ createPublicLink: async () => createdPublicLink() }),
    })
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-create-link"]')?.click()
    })
    await flushAsyncUi()
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-share-native"]')?.click()
    })

    expect(navigator.share).toHaveBeenCalledWith({
      title: 'Rugby Donau S&C Check-in',
      text: 'Bitte vor dem Training einchecken: Dienstag (2026-06-16).',
      url: 'https://field.test/#/checkin/token',
    })
  })

  it('hides native share when the browser does not support it', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    })
    const rendered = await renderCheckInView({
      checkInActions: buildCheckInActions({ createPublicLink: async () => createdPublicLink() }),
    })
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-create-link"]')?.click()
    })
    await flushAsyncUi()

    expect(rendered.container.querySelector('[data-testid="public-checkin-share-native"]')).toBeNull()
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-whatsapp"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-mail"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-copy"]')).not.toBeNull()
  })

  it('hides native share when the browser rejects the payload', async () => {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn(() => false),
    })
    const rendered = await renderCheckInView({
      checkInActions: buildCheckInActions({ createPublicLink: async () => createdPublicLink() }),
    })
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-create-link"]')?.click()
    })
    await flushAsyncUi()

    expect(rendered.container.querySelector('[data-testid="public-checkin-share-native"]')).toBeNull()
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-whatsapp"]')).not.toBeNull()
  })

  it('treats native share abort as a neutral fallback state', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue({ name: 'AbortError' }),
    })
    const rendered = await renderCheckInView({
      checkInActions: buildCheckInActions({ createPublicLink: async () => createdPublicLink() }),
    })
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-create-link"]')?.click()
    })
    await flushAsyncUi()
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-share-native"]')?.click()
    })
    await flushAsyncUi()

    expect(rendered.container.textContent).toContain('Teilen abgebrochen.')
    expect(rendered.container.textContent).not.toContain('Check-in nicht vollstaendig synchronisiert')
  })

  it('updates feedback when copying succeeds or fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const rendered = await renderCheckInView({
      checkInActions: buildCheckInActions({ createPublicLink: async () => createdPublicLink() }),
    })
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-create-link"]')?.click()
    })
    await flushAsyncUi()
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-share-copy"]')?.click()
    })

    expect(writeText).toHaveBeenCalledWith('https://field.test/#/checkin/token')
    expect(rendered.container.textContent).toContain('Link kopiert.')

    writeText.mockRejectedValueOnce(new Error('denied'))
    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-share-copy"]')?.click()
    })
    await flushAsyncUi()

    expect(rendered.container.textContent).toContain('Kopieren nicht möglich.')
  })

  it('shows a non-blocking fallback message when QR generation fails', async () => {
    qrCodeMock.toDataURL.mockRejectedValueOnce(new Error('canvas unavailable'))
    const onSessionChange = vi.fn()
    const rendered = await renderCheckInView({
      checkInActions: buildCheckInActions({ createPublicLink: async () => createdPublicLink() }),
      onSessionChange,
    })
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-create-link"]')?.click()
    })
    await flushAsyncUi()

    expect(rendered.container.textContent).toContain('QR-Code konnte nicht erstellt werden.')
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-whatsapp"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-mail"]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-copy"]')).not.toBeNull()

    const select = rendered.container.querySelector<HTMLSelectElement>('select')
    await act(async () => {
      if (select) {
        select.value = 'session-2'
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    expect(onSessionChange).toHaveBeenCalledWith('session-2')
    expect(rendered.container.textContent).not.toContain('QR-Code konnte nicht erstellt werden.')
  })

  it('does not offer re-copy for an already active link after reload', async () => {
    const rendered = await renderCheckInView({
      checkInActions: buildCheckInActions({ publicCheckInLinks: [activeLink] }),
    })
    root = rendered.root

    expect(rendered.container.textContent).toContain('Link aktiv bis')
    expect(rendered.container.textContent).toContain('nachträglich nicht erneut angezeigt')
    expect(rendered.container.textContent).not.toContain('Aktiver Link')
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-panel"]')).toBeNull()
  })

  it('clears the share panel when closing the public link or changing session', async () => {
    const closePublicLink = vi.fn(async () => undefined)
    const onSessionChange = vi.fn()
    const rendered = await renderCheckInView({
      checkInActions: buildCheckInActions({
        createPublicLink: async () => createdPublicLink(),
        closePublicLink,
        publicCheckInLinks: [activeLink],
      }),
      onSessionChange,
    })
    root = rendered.root

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-create-link"]')?.click()
    })
    await flushAsyncUi()
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-panel"]')).not.toBeNull()

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-close-link"]')?.click()
    })
    expect(closePublicLink).toHaveBeenCalledWith(activeLink.id)
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-panel"]')).toBeNull()

    await act(async () => {
      rendered.container.querySelector<HTMLButtonElement>('[data-testid="public-checkin-create-link"]')?.click()
    })
    await flushAsyncUi()
    const select = rendered.container.querySelector<HTMLSelectElement>('select')
    await act(async () => {
      if (select) {
        select.value = 'session-2'
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    expect(onSessionChange).toHaveBeenCalledWith('session-2')
    expect(rendered.container.querySelector('[data-testid="public-checkin-share-panel"]')).toBeNull()
  })
})
