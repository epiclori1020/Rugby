// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import type { PdfRef, SessionDefinition } from '../content/types'
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
  pdfRefs: [
    {
      label: 'Dienstag Trainingsplan',
      href: '/library/1_DIENSTAG_trainingsplan.pdf',
      sourcePath: 'plans/offseason_coach_sheets/KW25_tuesday_training_plan_clear_2026-06-16.md',
    },
  ],
  goals: ['Reaktion prüfen', 'Grundmuster sauber trainieren'],
  timeline: [
    { time: '0-8', title: 'Check-in', work: 'Ampel und Schmerzen prüfen.', dose: 'kurz', note: 'Ampel' },
    { time: '8-18', title: 'Warm-up', work: 'RAMP und Laufbild.', dose: 'RPE 2-3', note: 'Laufbild' },
    { time: '18-28', title: 'Speed', work: 'Starts kontrolliert.', dose: '70-80 Prozent', note: 'kein Timing' },
    { time: '28-40', title: 'Baseline optional', work: 'BJ und MB.', dose: 'nur wenn ruhig', note: 'kein Ranking' },
    { time: '40-64', title: 'Kraft Pods', work: 'Squat, Hinge, Push/Pull.', dose: 'RPE 5-6', note: 'Technik' },
    { time: '64-74', title: 'Microdose', work: 'Adductor, Calf, Band.', dose: 'schmerzfrei', note: 'Problem ja/nein' },
    { time: '74-84', title: 'Easy Tempo', work: 'Locker laufen oder Bike.', dose: '60-70 Prozent', note: 'optional' },
    { time: '84-90', title: 'Abschluss', work: 'sRPE und Pain.', note: 'sRPE' },
  ],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const featuredSession: SessionDefinition = {
  ...selectedSession,
  id: 'featured-session',
  date: '2026-06-18',
  title: 'Donnerstag',
}

const todayDate = new Date('2026-06-16T12:00:00')

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

function buildCheckInActions(
  overrides: Partial<ReturnType<typeof useCheckIns>> = {},
): ReturnType<typeof useCheckIns> {
  return {
    activePlayers: [player],
    sessionEntries: [entry],
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
    saveKioskEntry: async () => ({ ok: true as const, entry }),
    resetEntry: async () => ({ ok: true as const, entry }),
    resetSessionCheckIns: async () => ({
      ok: true as const,
      resetCount: 0,
      publicSubmissionResetCount: 0,
      retainedPostSessionCount: 0,
      sourceCounts: { coach: 0, player_link: 0, player_kiosk: 0, mixed: 0 },
    }),
    saveSessionPatch: async () => undefined,
    createPublicLink: async () => null,
    closePublicLink: async () => undefined,
    getEntryForPlayer: () => entry,
    sessionLog: null,
    clearError: () => undefined,
    ...overrides,
  } satisfies ReturnType<typeof useCheckIns>
}

function renderDashboardMarkup({
  checkInActions = buildCheckInActions(),
  onOpenPdf = () => undefined,
  onResetToTodaySession = () => undefined,
  onActionFeedback = () => undefined,
  selected = selectedSession,
  featured = selectedSession,
  storageStatus = 'persisted',
  isSignedIn = true,
  players = [player],
  today = todayDate,
  upcoming = [selectedSession, featuredSession],
}: {
  checkInActions?: ReturnType<typeof useCheckIns>
  onOpenPdf?: (pdf: PdfRef) => void
  onResetToTodaySession?: () => void
  onActionFeedback?: (message: string) => void
  selected?: SessionDefinition
  featured?: SessionDefinition
  storageStatus?: 'checking' | 'persisted' | 'denied' | 'unsupported' | 'error'
  isSignedIn?: boolean
  players?: Player[]
  today?: Date
  upcoming?: SessionDefinition[]
} = {}) {
  return renderToStaticMarkup(
    <TodayDashboard
      checkInActions={checkInActions}
      featuredSession={featured}
      isSignedIn={isSignedIn}
      onActionFeedback={onActionFeedback}
      onNavigate={() => undefined}
      onOpenPdf={onOpenPdf}
      onResetToTodaySession={onResetToTodaySession}
      onSessionChange={() => undefined}
      players={players}
      selectedSession={selected}
      selectedSessionId={selected.id}
      sessions={[selected, featured]}
      storagePersistence={{ status: storageStatus }}
      todayDate={today}
      upcomingSessions={upcoming}
    />,
  )
}

describe('TodayDashboard', () => {
  it('does not count pure observations as open warnings', () => {
    const markup = renderDashboardMarkup()

    expect(markup).toContain('Keine offenen Warnungen aus vorherigen Einheiten.')
    expect(markup).toContain('Notizen aus letzter Einheit')
    expect(markup).toContain('Landing im Warm-up beobachten')
  })

  it('shows goals, timeline metadata, and actionable documents without passive plan metrics', () => {
    const markup = renderDashboardMarkup()

    expect(markup).toContain('Heute zählt')
    expect(markup).toContain('Ziele')
    expect(markup).toContain('Reaktion prüfen')
    expect(markup).toContain('Grundmuster sauber trainieren')
    expect(markup).toContain('6 von 8 Blöcken')
    expect(markup).toContain('RPE 2-3')
    expect(markup).toContain('Laufbild')
    expect(markup).toContain('Unterlagen')
    expect(markup).toContain('PDF öffnen: Dienstag Trainingsplan')
    expect(markup).toContain('Training')
    expect(markup).not.toContain('App-UI aus aktiver Quelle')
    expect(markup).not.toContain('Planueberblick')
    expect(markup).not.toContain('Bloecke')
    expect(markup).not.toContain('PDFs')
  })

  it('marks a manually selected non-featured session as preview and exposes reset action', () => {
    const markup = renderDashboardMarkup({ selected: selectedSession, featured: featuredSession })

    expect(markup).toContain('Vorschau')
    expect(markup).toContain('Zur heutigen Einheit zurück')
  })

  it('hides normal storage status and shows only actionable storage problems', () => {
    const persistedMarkup = renderDashboardMarkup({ storageStatus: 'persisted' })
    const deniedMarkup = renderDashboardMarkup({ storageStatus: 'denied' })

    expect(persistedMarkup).not.toContain('Speicherstatus')
    expect(persistedMarkup).not.toContain('Offline-Speicher prüfen')
    expect(deniedMarkup).toContain('Offline-Speicher prüfen')
    expect(deniedMarkup).toContain('Gerätespeicher ist nicht dauerhaft gesichert.')
  })

  it('calls reset and PDF handlers from the dashboard controls', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const onResetToTodaySession = vi.fn()
    const onOpenPdf = vi.fn()
    const onActionFeedback = vi.fn()

    await act(async () => {
      root.render(
        <TodayDashboard
          checkInActions={buildCheckInActions()}
          featuredSession={featuredSession}
          isSignedIn
          onActionFeedback={onActionFeedback}
          onNavigate={() => undefined}
          onOpenPdf={onOpenPdf}
          onResetToTodaySession={onResetToTodaySession}
          onSessionChange={() => undefined}
          players={[player]}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={[selectedSession, featuredSession]}
          storagePersistence={{ status: 'persisted' }}
          todayDate={todayDate}
          upcomingSessions={[selectedSession, featuredSession]}
        />,
      )
    })

    container.querySelector<HTMLButtonElement>('[data-testid="today-reset-button"]')?.click()
    container.querySelector<HTMLButtonElement>('[data-testid="today-pdf-button-0"]')?.click()

    expect(onResetToTodaySession).toHaveBeenCalledTimes(1)
    expect(onOpenPdf).toHaveBeenCalledWith(selectedSession.pdfRefs[0])
    expect(onActionFeedback).toHaveBeenCalledWith('Heute-Einheit wiederhergestellt.')
    expect(onActionFeedback).toHaveBeenCalledWith('PDF in Bibliothek geöffnet.')

    await act(async () => {
      root.unmount()
    })
  })

  it('turns important attention counts into actions with feedback', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const onNavigate = vi.fn()
    const onActionFeedback = vi.fn()
    const warningEntry = {
      ...entry,
      id: 'warning-entry',
      trafficLight: 'yellow' as const,
      e2Decision: 'kein_sprint' as const,
      nextStep: 'reduzieren' as const,
      postPainScore: 3,
      sessionDate: '2026-06-13',
    }

    await act(async () => {
      root.render(
        <TodayDashboard
          checkInActions={buildCheckInActions({
            warnings: [warningEntry],
            syncOverview: { ...syncOverview, pendingCount: 2, status: 'pending' },
          })}
          featuredSession={selectedSession}
          isSignedIn
          onActionFeedback={onActionFeedback}
          onNavigate={onNavigate}
          onOpenPdf={() => undefined}
          onResetToTodaySession={() => undefined}
          onSessionChange={() => undefined}
          players={[player]}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={[selectedSession]}
          storagePersistence={{ status: 'persisted' }}
          todayDate={todayDate}
          upcomingSessions={[selectedSession]}
        />,
      )
    })

    container.querySelector<HTMLButtonElement>('[data-testid="today-warning-action"]')?.click()
    container.querySelector<HTMLButtonElement>('[data-testid="today-followup-action"]')?.click()
    container.querySelector<HTMLButtonElement>('[data-testid="today-pending-action"]')?.click()

    expect(onNavigate).toHaveBeenCalledWith('check-in')
    expect(onNavigate).toHaveBeenCalledWith('nachbereitung')
    expect(onNavigate).toHaveBeenCalledWith('einstellungen')
    expect(onActionFeedback).toHaveBeenCalledWith('Check-in geöffnet.')
    expect(onActionFeedback).toHaveBeenCalledWith('Nachbereitung geöffnet.')
    expect(onActionFeedback).toHaveBeenCalledWith('Einstellungen geöffnet.')

    await act(async () => {
      root.unmount()
    })
  })

  it('reports quick action and session-change feedback', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const onNavigate = vi.fn()
    const onSessionChange = vi.fn()
    const onActionFeedback = vi.fn()

    await act(async () => {
      root.render(
        <TodayDashboard
          checkInActions={buildCheckInActions()}
          featuredSession={selectedSession}
          isSignedIn
          onActionFeedback={onActionFeedback}
          onNavigate={onNavigate}
          onOpenPdf={() => undefined}
          onResetToTodaySession={() => undefined}
          onSessionChange={onSessionChange}
          players={[player]}
          selectedSession={selectedSession}
          selectedSessionId={selectedSession.id}
          sessions={[selectedSession, featuredSession]}
          storagePersistence={{ status: 'persisted' }}
          todayDate={todayDate}
          upcomingSessions={[selectedSession, featuredSession]}
        />,
      )
    })

    container.querySelector<HTMLButtonElement>('[data-testid="today-quick-action-check-in"]')?.click()
    const sessionSelect = container.querySelector<HTMLSelectElement>('select')
    if (sessionSelect) {
      sessionSelect.value = featuredSession.id
      sessionSelect.dispatchEvent(new Event('change', { bubbles: true }))
    }

    expect(onNavigate).toHaveBeenCalledWith('check-in')
    expect(onSessionChange).toHaveBeenCalledWith(featuredSession.id)
    expect(onActionFeedback).toHaveBeenCalledWith('Check-in geöffnet.')
    expect(onActionFeedback).toHaveBeenCalledWith('Einheit gewechselt.')

    await act(async () => {
      root.unmount()
    })
  })

  it('shows player empty states based on auth status', () => {
    const signedOutMarkup = renderDashboardMarkup({ isSignedIn: false, players: [] })
    const signedInMarkup = renderDashboardMarkup({ isSignedIn: true, players: [] })

    expect(signedOutMarkup).toContain('Nach Login werden Spieler, Warnungen und Anwesenheit geladen.')
    expect(signedInMarkup).toContain('Noch keine aktiven Spieler angelegt.')
  })

  it('uses upcoming sessions from the app-level date calculation', () => {
    const appProvidedSession = {
      ...featuredSession,
      id: 'app-provided-upcoming',
      title: 'Nur aus App-Prop',
      date: '2026-06-20',
    }
    const markup = renderDashboardMarkup({ upcoming: [appProvidedSession] })

    expect(markup).toContain('Nur aus App-Prop')
    expect(markup).not.toContain('Donnerstag')
  })

  it('translates every session type chip', () => {
    const baselineMarkup = renderDashboardMarkup({ selected: { ...selectedSession, type: 'baseline' } })
    const recheckMarkup = renderDashboardMarkup({ selected: { ...selectedSession, type: 'recheck' } })
    const transitionMarkup = renderDashboardMarkup({ selected: { ...selectedSession, type: 'transition' } })

    expect(baselineMarkup).toContain('Baseline')
    expect(recheckMarkup).toContain('Re-Check')
    expect(transitionMarkup).toContain('Übergang')
  })
})
