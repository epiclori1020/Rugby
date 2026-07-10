import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { sessionDefinitions } from '../content/sessions'
import type { PostSessionCompletion } from '../domain/postSessionCompletion'
import type { ReturnerTaskState } from '../domain/returnerTasks'
import type { PlayerSyncOverview } from '../domain/sync'
import { emptyCheckInDraft, type PlayerSessionEntry, type PlayerWarning } from '../domain/checkIn'
import { SessionWorkspace } from './SessionWorkspace'

const selectedSession = sessionDefinitions[0]

const pendingSync: PlayerSyncOverview = {
  isOnline: true,
  status: 'pending',
  pendingCount: 2,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}

const entry: PlayerSessionEntry = {
  ...emptyCheckInDraft,
  id: 'entry-1',
  userId: 'user-1',
  sessionLogId: 'session-log-1',
  playerId: 'player-1',
  present: true,
  trafficLightSuggestion: 'yellow',
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
  syncStatus: 'pending',
  syncError: null,
}

const warning: PlayerWarning = {
  playerId: 'player-2',
  trafficLight: 'red',
  returnerFlag: 'offen',
  limits: [],
  observation: 'Vorwarnung',
  e2Decision: null,
  nextStep: null,
  postPainScore: null,
  postPainLocation: '',
  sessionLoad: null,
  sessionDate: '2026-06-14',
}

const returnerTask: ReturnerTaskState = {
  playerId: 'player-3',
  phase: 'planning',
  tone: 'warning',
  isOpen: true,
  label: 'Plan für heute festlegen',
}

const completion: PostSessionCompletion = {
  status: 'teilweise_abgeschlossen',
  blockers: [{ kind: 'missing_srpe', label: 'sRPE fehlt bei anwesenden Spielern.', count: 1, playerNames: ['A'] }],
  advisories: [{ kind: 'backup_export', label: 'Nach Abschluss JSON/CSV-Export als Zusatzbackup erstellen.', count: 0, playerNames: [] }],
  needsBackupExport: true,
}

describe('SessionWorkspace', () => {
  it('renders the current session context and owns unit subnavigation', () => {
    const markup = renderToStaticMarkup(
      <SessionWorkspace
        activeUnitRoute="training"
        entries={[entry]}
        onSessionChange={() => undefined}
        onUnitRouteChange={() => undefined}
        postSessionCompletion={completion}
        returnerTasks={[returnerTask]}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={sessionDefinitions}
        syncOverview={pendingSync}
        warnings={[warning]}
      >
        <p>Training content</p>
      </SessionWorkspace>,
    )

    expect(markup).toContain(selectedSession.title)
    expect(markup).toContain('aria-label="Einheit Unterbereiche"')
    expect(markup).toContain('Check-in')
    expect(markup).toContain('Training')
    expect(markup).toContain('Returner')
    expect(markup).toContain('Nachbereitung')
    expect(markup).toContain('aria-pressed="true"')
    expect(markup).toContain('Hinweise')
    expect(markup).toContain('Nachbereitung')
    expect(markup).toContain('1 Returner-Aufgabe offen')
    expect(markup).toContain('Sync')
    expect(markup).toContain('2 Aenderungen warten auf Sync')
    expect(markup).toContain('Training content')
  })

  it('limits live status announcements to sync and pending changes', () => {
    const markup = renderToStaticMarkup(
      <SessionWorkspace
        activeUnitRoute="check-in"
        entries={[entry]}
        onSessionChange={() => undefined}
        onUnitRouteChange={() => undefined}
        postSessionCompletion={completion}
        returnerTasks={[]}
        selectedSession={selectedSession}
        selectedSessionId={selectedSession.id}
        sessions={sessionDefinitions}
        syncOverview={pendingSync}
        warnings={[warning]}
      >
        <p>Check-in content</p>
      </SessionWorkspace>,
    )

    expect(markup).toContain('aria-label="Einheit Kontext"')
    expect(markup).not.toContain('aria-label="Einheit Kontext" role="status"')
    expect(markup).toContain('class="session-workspace-sync-status" role="status" aria-live="polite"')
    expect(markup).toContain('Returner aktuell geklärt')
  })
})
