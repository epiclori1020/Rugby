// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { Player } from '../domain/players'
import type { ReturnerEntry } from '../domain/returners'
import type { PlayerSyncOverview } from '../domain/sync'
import type { useReturners } from '../hooks/useReturners'
import type { AuthSessionState } from '../lib/auth'
import { ReturnerView } from './ReturnerView'

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
  returnerStatus: 'ja',
  notes: '',
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const entry: ReturnerEntry = {
  id: 'returner-1',
  userId: 'user-1',
  playerId: player.id,
  sessionLogId: 'session-log-1',
  medicalContactNote: '',
  currentStage: '',
  speedCap: '',
  codDecelCap: '',
  conditioningCap: '',
  contactCap: '',
  allowedToday: '',
  plannedCaps: '',
  completed: '',
  symptomsDuring: '',
  nextMorning: '',
  decision: null,
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

const syncOverview: PlayerSyncOverview = {
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

function actions(overrides: Partial<ReturnType<typeof useReturners>> = {}): ReturnType<typeof useReturners> {
  return {
    activeReturnerPlayers: [player],
    entries: [entry],
    errorMessage: null,
    getCapsForPlayer: () => null,
    getEntryForPlayer: () => entry,
    getHistoryForPlayer: () => [entry],
    isLoading: false,
    refreshReturners: async () => undefined,
    returnerCaps: [],
    returnerTaskStates: [
      { playerId: player.id, phase: 'planning', tone: 'warning', isOpen: true, label: 'Plan für heute festlegen' },
    ],
    runSync: async () => syncOverview,
    savePlayerReturner: async () => ({ ok: true as const, entry }),
    syncOverview,
    clearError: () => undefined,
    ...overrides,
  }
}

describe('ReturnerView', () => {
  it('renders a row-first unit task list with one dominant action', () => {
    const markup = renderToStaticMarkup(
      <ReturnerView
        authState={authState}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        returnerActions={actions()}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
        showSessionPicker={false}
      />,
    )

    expect(markup).toContain('Returner-Aufgaben')
    expect(markup).toContain('Plan für heute festlegen')
    expect(markup).toContain('Nächste Returner-Aufgabe')
    expect(markup.match(/of-button-primary/g)).toHaveLength(1)
    expect(markup).toContain('Safety-Hinweise')
    expect(markup).not.toContain('Returner Red Flags')
  })

  it('shows the focused player in the shared sheet/pane detail without clearance wording', () => {
    const markup = renderToStaticMarkup(
      <ReturnerView
        authState={authState}
        focusedPlayer={player}
        focusedTaskState={{ playerId: player.id, phase: 'planning', tone: 'warning', isOpen: true, label: 'Plan für heute festlegen' }}
        onNavigate={() => undefined}
        onReturn={() => undefined}
        onSessionChange={() => undefined}
        returnerActions={actions()}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
        showSessionPicker={false}
      />,
    )

    expect(markup).toContain('returner-detail-pane')
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('returner-sheet-backdrop')
    expect(markup).toContain('Zurück zum Ursprung')
    expect(markup).toContain('Hinweis für Coaching-Entscheidung')
    expect(markup.toLowerCase()).not.toContain('freigabe')
  })

  it('uses a calm completed state and leads to post-session when nothing is open', () => {
    const markup = renderToStaticMarkup(
      <ReturnerView
        authState={authState}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        returnerActions={actions({
          returnerTaskStates: [
            { playerId: player.id, phase: 'done', tone: 'success', isOpen: false, label: 'Für heute dokumentiert' },
          ],
        })}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
        showSessionPicker={false}
      />,
    )

    expect(markup).toContain('Returner aktuell geklärt')
    expect(markup).toContain('Nachbereitung öffnen')
    expect(markup).not.toContain('Dauer-Alarm')
  })

  it('contains reverse focus from the dialog container and restores the opener', async () => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <ReturnerView
          authState={authState}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerActions={actions()}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={[selectedSession]}
          showSessionPicker={false}
        />,
      )
    })

    const opener = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent === 'Öffnen')
    expect(opener).toBeDefined()
    opener?.focus()
    await act(async () => opener?.click())

    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog).not.toBeNull()
    dialog?.focus()
    await act(async () => {
      dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    })
    expect(dialog?.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).not.toBe(dialog)

    const closeButton = container.querySelector<HTMLButtonElement>('[aria-label="Returner-Fokus schliessen"]')
    await act(async () => closeButton?.click())
    expect(document.activeElement).toBe(opener)

    await act(async () => root.unmount())
    container.remove()
  })
})
