// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
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
    isInitialLoading: false,
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
    expect(markup).toContain('of-athlete-row')
    expect(markup).not.toContain('of-task-queue-row')
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
    expect(markup).toContain('returner-stage-control')
    expect(markup).toContain('Stufe 1')
    expect(markup).toContain('returner-cap-row')
    expect(markup.match(/returner-cap-row/g)).toHaveLength(4)
    expect(markup).toContain('Plan &amp; Ist')
    expect(markup).toContain('Reaktion &amp; nächster Morgen')
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

  it('keeps an in-progress neutral Returner visibly under observation', () => {
    const markup = renderToStaticMarkup(
      <ReturnerView
        authState={authState}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        returnerActions={actions({
          returnerTaskStates: [
            { playerId: player.id, phase: 'in_progress', tone: 'neutral', isOpen: false, label: 'Im Training beobachten' },
          ],
        })}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
        showSessionPicker={false}
      />,
    )

    expect(markup).toContain('Beobachten')
    expect(markup).toContain('of-readiness-dot-open')
    expect(markup).not.toContain('Geklärt')
  })

  it('uses a shared recoverable error state for the task list', () => {
    const errorMarkup = renderToStaticMarkup(
      <ReturnerView authState={authState} onNavigate={() => undefined} onSessionChange={() => undefined}
        returnerActions={actions({ errorMessage: 'InternalError: returner_entries policy failed', returnerTaskStates: [] })}
        selectedSession={selectedSession} selectedSessionId={selectedSession.id} sessions={[selectedSession]} showSessionPicker={false} />,
    )

    expect(errorMarkup).toContain('of-error-state of-state-inline')
    expect(errorMarkup).toContain('Returner-Aufgaben nicht geladen')
    expect(errorMarkup).toContain('Erneut versuchen')
    expect(errorMarkup).not.toContain('returner_entries')
    expect(errorMarkup).not.toContain('InternalError')
  })

  it('does not show a false cleared state while the initial Returner load is pending', async () => {
    vi.useFakeTimers()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => root.render(
      <ReturnerView authState={authState} onNavigate={() => undefined} onSessionChange={() => undefined}
        returnerActions={actions({ isInitialLoading: true, returnerTaskStates: [] })}
        selectedSession={selectedSession} selectedSessionId={selectedSession.id} sessions={[selectedSession]} showSessionPicker={false} />,
    ))

    expect(container.textContent).not.toContain('Returner aktuell geklärt')
    expect(container.querySelector('.of-empty-state')).toBeNull()
    expect(container.querySelector('.of-skeleton')).toBeNull()

    await act(async () => vi.advanceTimersByTime(300))
    expect(container.querySelector('.of-skeleton')).not.toBeNull()
    expect(container.textContent).not.toContain('Returner aktuell geklärt')

    await act(async () => root.unmount())
    vi.useRealTimers()
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

  it('restores a cap input after an optimistic save fails', async () => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const recordedEntry = { ...entry, speedCap: '4 × 10 m smooth' }
    const savePlayerReturner = vi.fn(async () => ({ ok: false as const, error: 'Speichern fehlgeschlagen' }))
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <ReturnerView
          authState={authState}
          focusedPlayer={player}
          focusedTaskState={{ playerId: player.id, phase: 'planning', tone: 'warning', isOpen: true, label: 'Plan für heute festlegen' }}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerActions={actions({
            entries: [recordedEntry],
            getEntryForPlayer: () => recordedEntry,
            getHistoryForPlayer: () => [recordedEntry],
            savePlayerReturner,
          })}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={[selectedSession]}
          showSessionPicker={false}
        />,
      )
    })

    const capInput = container.querySelector<HTMLInputElement>('input[placeholder="z. B. 4 × 10 m smooth"]')
    expect(capInput?.value).toBe('4 × 10 m smooth')
    await act(async () => {
      if (capInput) {
        capInput.value = '8 × 10 m hart'
        capInput.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      }
      await Promise.resolve()
    })

    expect(savePlayerReturner).toHaveBeenCalledOnce()
    expect(container.querySelector<HTMLInputElement>('input[placeholder="z. B. 4 × 10 m smooth"]')?.value)
      .toBe('4 × 10 m smooth')

    await act(async () => root.unmount())
    container.remove()
  })

  it('does not expose technical save errors in Returner feedback', async () => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const savePlayerReturner = vi.fn(async () => {
      throw new Error('PostgrestError: returner_entries policy denied')
    })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => root.render(
      <ReturnerView
        authState={authState}
        focusedPlayer={player}
        focusedTaskState={{ playerId: player.id, phase: 'planning', tone: 'warning', isOpen: true, label: 'Plan für heute festlegen' }}
        onNavigate={() => undefined}
        onSessionChange={() => undefined}
        returnerActions={actions({ savePlayerReturner })}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={[selectedSession]}
        showSessionPicker={false}
      />,
    ))

    const capInput = container.querySelector<HTMLInputElement>('input[placeholder="z. B. 4 × 10 m smooth"]')
    await act(async () => {
      if (capInput) {
        capInput.value = '4 × 10 m smooth'
        capInput.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      }
      await Promise.resolve()
    })

    expect(container.textContent).toContain('nicht gespeichert – erneut versuchen')
    expect(container.textContent).not.toContain('PostgrestError')
    expect(container.textContent).not.toContain('returner_entries')

    await act(async () => root.unmount())
    container.remove()
  })

  it('serializes local Returner saves across cap and stage controls', async () => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    let resolveSave: ((result: { ok: true; entry: ReturnerEntry }) => void) | undefined
    const pendingSave = new Promise<{ ok: true; entry: ReturnerEntry }>((resolve) => {
      resolveSave = resolve
    })
    const savePlayerReturner = vi.fn(() => pendingSave)
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <ReturnerView
          authState={authState}
          focusedPlayer={player}
          focusedTaskState={{ playerId: player.id, phase: 'planning', tone: 'warning', isOpen: true, label: 'Plan für heute festlegen' }}
          onNavigate={() => undefined}
          onSessionChange={() => undefined}
          returnerActions={actions({ savePlayerReturner })}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={[selectedSession]}
          showSessionPicker={false}
        />,
      )
    })

    const capInput = container.querySelector<HTMLInputElement>('input[placeholder="z. B. 4 × 10 m smooth"]')
    await act(async () => {
      if (capInput) {
        capInput.value = '4 × 10 m smooth'
        capInput.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      }
    })

    const stageButton = Array.from(container.querySelectorAll<HTMLButtonElement>('.returner-stage-control button'))
      .find((button) => button.textContent?.includes('Stufe 1'))
    await act(async () => stageButton?.click())
    expect(savePlayerReturner).toHaveBeenCalledOnce()
    expect(stageButton?.disabled).toBe(true)

    await act(async () => {
      resolveSave?.({ ok: true, entry: { ...entry, speedCap: '4 × 10 m smooth' } })
      await pendingSave
    })
    await act(async () => root.unmount())
    container.remove()
  })
})
