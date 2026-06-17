import { useCallback } from 'react'
import { ArrowRight, CalendarDays, ClipboardCheck, Dumbbell, FileText, ShieldAlert, Users } from 'lucide-react'
import type { HubTab } from '../App'
import type { PdfRef, SessionDefinition, SessionType } from '../content/types'
import type { Player } from '../domain/players'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { StoragePersistenceState } from '../hooks/useStoragePersistence'
import { hasPlayerId } from '../lib/playerId'
import { pendingCountLabel } from '../lib/syncLabels'
import { SessionPicker } from './SessionPicker'

type TodayDashboardProps = {
  checkInActions: ReturnType<typeof useCheckIns>
  featuredSession: SessionDefinition
  isSignedIn: boolean
  onActionFeedback: (message: string) => void
  onNavigate: (tab: HubTab) => void
  onOpenPdf: (pdf: PdfRef) => void
  onResetToTodaySession: () => void
  onSessionChange: (sessionId: string) => void
  players: Player[]
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
  storagePersistence: StoragePersistenceState
  todayDate: Date
  upcomingSessions: SessionDefinition[]
}

const quickActions: Array<{ label: string; tab: HubTab; feedback: string; testId: string }> = [
  { label: 'Check-in öffnen', tab: 'check-in', feedback: 'Check-in geöffnet.', testId: 'today-quick-action-check-in' },
  { label: 'Training anzeigen', tab: 'training', feedback: 'Training geöffnet.', testId: 'today-quick-action-training' },
  { label: 'Nachbereitung', tab: 'nachbereitung', feedback: 'Nachbereitung geöffnet.', testId: 'today-quick-action-post' },
  { label: 'Bibliothek', tab: 'bibliothek', feedback: 'Bibliothek geöffnet.', testId: 'today-quick-action-library' },
]

const sessionTypeLabels: Record<SessionType, string> = {
  training: 'Training',
  baseline: 'Baseline',
  recheck: 'Re-Check',
  transition: 'Übergang',
}

function formatSessionDate(date: string) {
  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T12:00:00`))
}

function relativeSessionLabel(date: string, todayDate: Date) {
  const sessionDate = new Date(`${date}T12:00:00`)
  const diffDays = Math.round((sessionDate.getTime() - todayDate.getTime()) / 86_400_000)

  if (diffDays === 0) {
    return 'Heute'
  }

  if (diffDays === 1) {
    return 'Morgen'
  }

  if (diffDays > 1) {
    return `in ${diffDays} Tagen`
  }

  return 'vergangen'
}

export function TodayDashboard({
  checkInActions,
  featuredSession,
  isSignedIn,
  onActionFeedback,
  onNavigate,
  onOpenPdf,
  onResetToTodaySession,
  onSessionChange,
  players,
  selectedSession,
  selectedSessionId,
  sessions,
  storagePersistence,
  todayDate,
  upcomingSessions,
}: TodayDashboardProps) {
  const isPreview = selectedSession.id !== featuredSession.id
  const activePlayers = players.filter((player) => player.active)
  const activePlayerIds = new Set(activePlayers.map((player) => player.id))
  const activeWarnings = checkInActions.warnings.filter(
    (warning) => hasPlayerId(warning) && activePlayerIds.has(warning.playerId),
  )
  const activeObservations = checkInActions.observations.filter(
    (observation) => hasPlayerId(observation) && activePlayerIds.has(observation.playerId),
  )
  const expectedPlayerSet = new Set(checkInActions.expectedPlayerIds)
  const expectedCount =
    expectedPlayerSet.size > 0 ? activePlayers.filter((player) => expectedPlayerSet.has(player.id)).length : activePlayers.length
  const expectedMetricLabel = expectedPlayerSet.size > 0 ? 'Zuletzt dabei' : 'Aktiv'
  const presentCount = checkInActions.entries.filter(
    (entry) => hasPlayerId(entry) && activePlayerIds.has(entry.playerId) && entry.present,
  ).length
  const warningCount = activeWarnings.length
  const postSessionFollowUpCount = activeWarnings.filter(
    (warning) =>
      (warning.e2Decision !== null && warning.e2Decision !== 'normal') ||
      warning.nextStep === 'reduzieren' ||
      warning.nextStep === 'klaeren' ||
      (warning.postPainScore !== null && warning.postPainScore >= 3),
  ).length
  const pendingCount = checkInActions.syncOverview.pendingCount
  const timelinePreview = selectedSession.timeline.slice(0, 6)
  const timelineLabel =
    selectedSession.timeline.length > timelinePreview.length
      ? `${timelinePreview.length} von ${selectedSession.timeline.length} Blöcken`
      : `alle ${selectedSession.timeline.length} Blöcke`
  const showStorageWarning = !['checking', 'persisted'].includes(storagePersistence.status)
  const playerStatusText = !isSignedIn
    ? 'Nach Login werden Spieler, Warnungen und Anwesenheit geladen.'
    : activePlayers.length === 0
      ? 'Noch keine aktiven Spieler angelegt.'
      : null

  const navigateWithFeedback = useCallback(
    (tab: HubTab, message: string) => {
      onActionFeedback(message)
      onNavigate(tab)
    },
    [onActionFeedback, onNavigate],
  )

  const handleSessionChange = useCallback(
    (sessionId: string) => {
      onSessionChange(sessionId)
      onActionFeedback('Einheit gewechselt.')
    },
    [onActionFeedback, onSessionChange],
  )

  const handleResetToTodaySession = useCallback(() => {
    onResetToTodaySession()
    onActionFeedback('Heute-Einheit wiederhergestellt.')
  }, [onActionFeedback, onResetToTodaySession])

  const handleOpenPdf = useCallback(
    (pdf: PdfRef) => {
      onOpenPdf(pdf)
      onActionFeedback('PDF in Bibliothek geöffnet.')
    },
    [onActionFeedback, onOpenPdf],
  )

  return (
    <section className="dashboard-grid" aria-labelledby="today-heading">
        <article className="panel today-command-card">
          <p className="eyebrow">Heute zählt</p>
          <h3 id="today-heading">{selectedSession.title}</h3>
          <p>{selectedSession.summary}</p>
          <div className="tag-row" aria-label="Session Status">
            <span className="tag">{selectedSession.kw}</span>
            <span className="tag">{relativeSessionLabel(selectedSession.date, todayDate)}</span>
            <span className="tag">{sessionTypeLabels[selectedSession.type]}</span>
            {isPreview ? <span className="tag warning-tag">Vorschau</span> : null}
          </div>
          <SessionPicker
            onSessionChange={handleSessionChange}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
          {isPreview ? (
            <button
              className="secondary-action compact-action"
              data-testid="today-reset-button"
              type="button"
              onClick={handleResetToTodaySession}
            >
              Zur heutigen Einheit zurück
            </button>
          ) : null}
          <div className="today-goals">
            <span>Ziele</span>
            <ul className="compact-list">
              {selectedSession.goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </div>
        </article>

        <article className="panel quick-action-panel">
          <h3>Schnell handeln</h3>
          <div className="quick-actions today-actions">
            {quickActions.map((action, index) => (
              <button
                className={index === 0 ? 'quick-action primary-quick-action' : 'quick-action'}
                data-testid={action.testId}
                key={action.tab}
                type="button"
                onClick={() => navigateWithFeedback(action.tab, action.feedback)}
              >
                <span>{action.label}</span>
                <ArrowRight className="nav-icon" aria-hidden />
              </button>
            ))}
          </div>
          {selectedSession.pdfRefs.length > 0 ? (
            <div className="today-documents">
              <h4>Unterlagen</h4>
              <div className="pdf-link-grid">
                {selectedSession.pdfRefs.map((pdf, index) => (
                  <button
                    className="pdf-link"
                    data-testid={`today-pdf-button-${index}`}
                    key={pdf.href}
                    type="button"
                    onClick={() => handleOpenPdf(pdf)}
                  >
                    <span>PDF öffnen: {pdf.label}</span>
                    <FileText className="nav-icon" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <article className="panel timeline-preview-panel">
          <div className="status-line">
            <CalendarDays className="nav-icon" aria-hidden />
            <h3>Ablauf-Vorschau</h3>
          </div>
          <p>{timelineLabel}</p>
          <div className="session-timeline">
            {timelinePreview.map((block) => (
              <div className="timeline-row" key={`${block.time}-${block.title}`}>
                <span>{block.time}</span>
                <div>
                  <strong>{block.title}</strong>
                  <p>{block.work}</p>
                  {block.dose || block.note ? (
                    <div className="timeline-tags">
                      {block.dose ? <span className="tag compact">{block.dose}</span> : null}
                      {block.note ? <span className="tag compact">{block.note}</span> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <button
            className="quick-action"
            type="button"
            onClick={() => navigateWithFeedback('training', 'Training geöffnet.')}
          >
            <span>Vollständigen Ablauf öffnen</span>
            <ArrowRight className="nav-icon" aria-hidden />
          </button>
        </article>

      <aside className="content-stack" aria-label="Vorbereitungsstatus">
        <article className={warningCount > 0 ? 'panel warning-panel attention-panel' : 'panel attention-panel'}>
          <div className="status-line">
            <ShieldAlert className="nav-icon" aria-hidden />
            <h3>Aufpassen</h3>
          </div>
          {warningCount > 0 ? (
            <button
              className="quick-action compact-status-action"
              data-testid="today-warning-action"
              type="button"
              onClick={() => navigateWithFeedback('check-in', 'Check-in geöffnet.')}
            >
              <span>{warningCount} Warnung(en) prüfen</span>
              <ArrowRight className="nav-icon" aria-hidden />
            </button>
          ) : (
            <p>Keine offenen Warnungen aus vorherigen Einheiten.</p>
          )}
          {postSessionFollowUpCount > 0 ? (
            <button
              className="quick-action compact-status-action"
              data-testid="today-followup-action"
              type="button"
              onClick={() => navigateWithFeedback('nachbereitung', 'Nachbereitung geöffnet.')}
            >
              <span>{postSessionFollowUpCount} Follow-up(s) prüfen</span>
              <ArrowRight className="nav-icon" aria-hidden />
            </button>
          ) : (
            <p>Keine lokalen E2-/Progressions-Follow-ups aus der Nachbereitung.</p>
          )}
          {pendingCount > 0 ? (
            <button
              className="quick-action compact-status-action"
              data-testid="today-pending-action"
              type="button"
              onClick={() => navigateWithFeedback('einstellungen', 'Einstellungen geöffnet.')}
            >
              <span>{pendingCountLabel(pendingCount, 'Check-in-Änderungen')}</span>
              <ArrowRight className="nav-icon" aria-hidden />
            </button>
          ) : null}
          <ul className="compact-list">
            {selectedSession.safetyNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>

        <article className="panel material-panel">
          <div className="status-line">
            <Dumbbell className="nav-icon" aria-hidden />
            <h3>Material</h3>
          </div>
          <ul className="compact-list">
            {selectedSession.materials.map((material) => (
              <li key={material}>{material}</li>
            ))}
          </ul>
        </article>

        <article className="panel upcoming-panel">
          <div className="status-line">
            <ClipboardCheck className="nav-icon" aria-hidden />
            <h3>Ab heute</h3>
          </div>
          <div className="upcoming-list">
            {upcomingSessions.map((session) => (
              <button
                className="upcoming-session"
                key={session.id}
                type="button"
                onClick={() => handleSessionChange(session.id)}
              >
                <span>{formatSessionDate(session.date)}</span>
                <strong>{session.title}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="panel players-panel">
          <div className="status-line">
            <Users className="nav-icon" aria-hidden />
            <h3>Spieler</h3>
          </div>
          <div className="metric-grid mini">
            <div className="metric">
              <span>{expectedMetricLabel}</span>
              <strong>{expectedCount}</strong>
            </div>
            <div className="metric">
              <span>Anwesend</span>
              <strong>{presentCount}</strong>
            </div>
          </div>
          <button
            className="quick-action"
            type="button"
            onClick={() => navigateWithFeedback('check-in', 'Check-in geöffnet.')}
          >
            <span>Zum Check-in</span>
            <ArrowRight className="nav-icon" aria-hidden />
          </button>
          {playerStatusText ? <p>{playerStatusText}</p> : null}
        </article>

        {activeObservations.length > 0 ? (
          <article className="panel observations-panel">
            <div className="status-line">
              <FileText className="nav-icon" aria-hidden />
              <h3>Notizen aus letzter Einheit</h3>
            </div>
            <ul className="compact-list">
              {activeObservations.map((observation) => {
                const player = activePlayers.find((item) => item.id === observation.playerId)
                return (
                  <li key={`${observation.playerId}-${observation.sessionDate}`}>
                    <strong>{player?.name ?? 'Spieler'}:</strong> {observation.observation}
                  </li>
                )
              })}
            </ul>
          </article>
        ) : null}

        {showStorageWarning ? (
          <article className="panel warning-panel storage-warning-panel">
            <div className="status-line">
              <FileText className="nav-icon" aria-hidden />
              <h3>Offline-Speicher prüfen</h3>
            </div>
            <p>Gerätespeicher ist nicht dauerhaft gesichert. In Einstellungen prüfen.</p>
            <button
              className="quick-action"
              type="button"
              onClick={() => navigateWithFeedback('einstellungen', 'Einstellungen geöffnet.')}
            >
              <span>Zu Einstellungen</span>
              <ArrowRight className="nav-icon" aria-hidden />
            </button>
          </article>
        ) : null}
      </aside>
    </section>
  )
}
