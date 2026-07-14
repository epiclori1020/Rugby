import { useCallback, type ReactNode } from 'react'
import { ArrowRight, CalendarDays, ClipboardCheck, Dumbbell, FileText, ShieldAlert } from 'lucide-react'
import { routes, type AppRoute } from '../navigation'
import type { PdfRef, SessionDefinition, SessionType } from '../content/types'
import type { CoachInsight, CoachInsightSource } from '../domain/coachInsights'
import type { Player } from '../domain/players'
import type { LatestRelevantPostSessionWork } from '../domain/postSessionCompletion'
import { buildTodaySquadSummary, type TodayAttentionTone } from '../domain/todaySquad'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { StoragePersistenceState } from '../hooks/useStoragePersistence'
import { triggerHapticFeedback } from '../lib/interactionFeedback'
import { hasPlayerId } from '../lib/playerId'
import { CoachInsightsPanel } from './CoachInsightsPanel'
import { AthleteRow, OnFieldWordmark, ScoreboardStrip, type ScoreboardMetric } from './onfield'
import { EmptyState, PrimaryButton, SecondaryButton, Skeleton, StatusChip, type StatusTone } from './ui'
import { SessionPicker } from './SessionPicker'

type TodayDashboardProps = {
  checkInActions: ReturnType<typeof useCheckIns>
  coachInsights: CoachInsight[]
  featuredSession: SessionDefinition
  isLoading?: boolean
  isSignedIn: boolean
  onActionFeedback: (message: string) => void
  onOpenCoachInsightSource: (source: CoachInsightSource) => void
  onOpenReturner?: (playerId: string) => void
  onNavigate: (route: AppRoute) => void
  onOpenLibrary: (session: SessionDefinition) => void
  onOpenPdf: (pdf: PdfRef) => void
  onResetToTodaySession: () => void
  onSessionChange: (sessionId: string) => void
  players: Player[]
  postSessionWork: LatestRelevantPostSessionWork | null
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
  storagePersistence: StoragePersistenceState
  syncStatusSlot?: ReactNode
  todayDate: Date
  upcomingSessions: SessionDefinition[]
}

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

function formatContextDate(date: Date) {
  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(date)
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

function rowChipTone(tone: TodayAttentionTone): StatusTone {
  if (tone === 'red') {
    return 'danger'
  }

  if (tone === 'yellow') {
    return 'warning'
  }

  if (tone === 'returner') {
    return 'info'
  }

  return 'neutral'
}

function chipLabelForTone(tone: TodayAttentionTone) {
  if (tone === 'red') {
    return 'Rot'
  }

  if (tone === 'yellow') {
    return 'Gelb'
  }

  if (tone === 'returner') {
    return 'Returner'
  }

  return 'Klären'
}

export function TodayDashboard({
  checkInActions,
  coachInsights,
  featuredSession,
  isLoading = false,
  isSignedIn,
  onActionFeedback,
  onOpenCoachInsightSource,
  onOpenReturner,
  onNavigate,
  onOpenLibrary,
  onOpenPdf,
  onResetToTodaySession,
  onSessionChange,
  players,
  postSessionWork,
  selectedSession,
  selectedSessionId,
  sessions,
  storagePersistence,
  syncStatusSlot,
  todayDate,
  upcomingSessions,
}: TodayDashboardProps) {
  const isPreview = selectedSession.id !== featuredSession.id
  const activePlayers = players.filter((player) => player.active)
  const playerById = new Map(activePlayers.map((player) => [player.id, player]))
  const todaySummary = buildTodaySquadSummary({
    coachInsights,
    entries: checkInActions.entries,
    expectedPlayerIds: checkInActions.expectedPlayerIds,
    players,
    warnings: checkInActions.warnings,
  })
  const squadPlayerIds = new Set(todaySummary.squadPlayerIds)
  const activeObservations = checkInActions.observations.filter(
    (observation) => hasPlayerId(observation) && squadPlayerIds.has(observation.playerId),
  )

  const scoreboardMetrics: ScoreboardMetric[] = [
    {
      id: 'squad',
      label: 'Kader',
      value: todaySummary.squadCount,
      tone: 'open',
      assistiveLabel: `${todaySummary.squadCount} im operativen Kader`,
    },
    {
      id: 'present',
      label: 'Anwesend',
      value: todaySummary.presentCount,
      detail: `von ${todaySummary.squadCount} eingecheckt`,
      tone: 'green',
      assistiveLabel: `${todaySummary.presentCount} von ${todaySummary.squadCount} anwesend`,
    },
    { id: 'yellow', label: 'Gelb', value: todaySummary.yellowCount, tone: 'yellow' },
    { id: 'red', label: 'Rot', value: todaySummary.redCount, tone: 'red' },
    { id: 'returner', label: 'Returner', value: todaySummary.returnerCount, tone: 'returner' },
  ]

  const postSessionDefinition = postSessionWork
    ? sessions.find((session) => session.id === postSessionWork.sessionLog.sessionDefinitionId)
    : null
  const postSessionMissingCount = postSessionWork
    ? postSessionWork.completion.blockers.reduce((sum, blocker) => sum + Math.max(1, blocker.count), 0)
    : 0
  const showStorageWarning = !['checking', 'persisted'].includes(storagePersistence.status)
  const showWelcomeSurface = activePlayers.length === 0
  const welcomeTitle = 'Squad für OnField anlegen'
  const welcomeBody = 'Lege aktive Spieler an, damit Check-in, Session Flow und Wrap-up mit demselben Funktionsumfang starten.'
  const reportAction = useCallback(
    (message: string) => {
      triggerHapticFeedback('selection')
      onActionFeedback(message)
    },
    [onActionFeedback],
  )
  const navigateWithFeedback = useCallback(
    (route: AppRoute, message: string) => {
      reportAction(message)
      onNavigate(route)
    },
    [onNavigate, reportAction],
  )

  const handleSessionChange = useCallback(
    (sessionId: string) => {
      onSessionChange(sessionId)
      reportAction('Einheit gewechselt.')
    },
    [onSessionChange, reportAction],
  )

  const handleResetToTodaySession = useCallback(() => {
    onResetToTodaySession()
    reportAction('Heute-Einheit wiederhergestellt.')
  }, [onResetToTodaySession, reportAction])

  const handleOpenPdf = useCallback(
    (pdf: PdfRef) => {
      onOpenPdf(pdf)
      reportAction('PDF in Bibliothek geöffnet.')
    },
    [onOpenPdf, reportAction],
  )

  const handleOpenLibrary = useCallback(() => {
    onOpenLibrary(selectedSession)
    reportAction('Heutige Unterlagen geöffnet.')
  }, [onOpenLibrary, reportAction, selectedSession])

  const handleOpenPostSessionWork = useCallback(() => {
    if (postSessionWork) {
      onSessionChange(postSessionWork.sessionLog.sessionDefinitionId)
    }
    navigateWithFeedback(routes.unitPostSession, 'Nachbereitung geöffnet.')
  }, [navigateWithFeedback, onSessionChange, postSessionWork])

  if (showWelcomeSurface) {
    return (
      <section className="dashboard-grid today-squad-screen today-squad-empty" aria-labelledby="today-heading">
        <header className="today-squad-header">
          <div className="today-squad-brandline">
            <OnFieldWordmark className="today-wordmark" compact />
            <span>{formatContextDate(todayDate)} · {selectedSession.kw}</span>
            {syncStatusSlot ? <div className="today-sync-slot">{syncStatusSlot}</div> : null}
          </div>
          <div className="today-squad-title">
            <div>
              <p className="eyebrow">Squad heute</p>
              <h2 id="today-heading">Squad heute</h2>
              <p>
                {selectedSession.title} · {relativeSessionLabel(selectedSession.date, todayDate)} ·{' '}
                {sessionTypeLabels[selectedSession.type]}
              </p>
            </div>
          </div>
        </header>
        <main className="today-squad-main" aria-label="Squad heute Empty State">
          <section className="today-attention-section today-empty-state-panel" aria-busy={isLoading || undefined}>
            {isSignedIn && isLoading ? (
              <div className="today-loading-state">
                <h3>Squad wird geladen</h3>
                <Skeleton label="Squad wird geladen" variant="panel" />
                <p>Lokale Spieler- und Check-in-Daten werden vorbereitet.</p>
              </div>
            ) : (
              <EmptyState
                action={
                  <PrimaryButton
                    data-testid="today-welcome-action"
                    icon={<ArrowRight aria-hidden />}
                    onClick={() => navigateWithFeedback(routes.players, 'Spieler geöffnet.')}
                  >
                    Spieler anlegen
                  </PrimaryButton>
                }
                body={welcomeBody}
                title={welcomeTitle}
              />
            )}
          </section>
        </main>
      </section>
    )
  }

  return (
    <section className="dashboard-grid today-squad-screen" aria-labelledby="today-heading">
      <header className="today-squad-header">
        <div className="today-squad-brandline">
          <OnFieldWordmark className="today-wordmark" compact />
          <span>{formatContextDate(todayDate)} · {selectedSession.kw}</span>
          {isPreview ? <StatusChip label="Vorschau" tone="warning" /> : null}
          {syncStatusSlot ? <div className="today-sync-slot">{syncStatusSlot}</div> : null}
        </div>
        <div className="today-squad-title">
          <div>
            <p className="eyebrow">Squad heute</p>
            <h2 id="today-heading">Squad heute</h2>
            <p>
              {selectedSession.title} · {relativeSessionLabel(selectedSession.date, todayDate)} ·{' '}
              {sessionTypeLabels[selectedSession.type]}
            </p>
          </div>
          <div className="today-session-tools">
            <SessionPicker
              onSessionChange={handleSessionChange}
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
            {isPreview ? (
              <SecondaryButton compact data-testid="today-reset-button" onClick={handleResetToTodaySession}>
                Zur heutigen Einheit zurück
              </SecondaryButton>
            ) : null}
          </div>
        </div>
      </header>

      <main className="today-squad-main" aria-label="Squad heute Leitbereich">
        <section className="today-scoreboard-panel" aria-label="Squad Überblick">
          <ScoreboardStrip metrics={scoreboardMetrics} primaryMetricId="present" />
          <PrimaryButton
            className="today-primary-checkin"
            data-testid="today-quick-action-check-in"
            icon={<ArrowRight aria-hidden />}
            onClick={() => navigateWithFeedback(routes.unitCheckIn, 'Check-in geöffnet.')}
          >
            Check-in öffnen
          </PrimaryButton>
        </section>

        <section className="today-attention-section" aria-labelledby="today-attention-heading">
          <div className="today-section-heading">
            <ShieldAlert className="nav-icon" aria-hidden />
            <div>
              <h3 id="today-attention-heading">Aufpassen zuerst</h3>
              <p>Rot, Gelb, Returner und offene Klärungen zuerst.</p>
            </div>
          </div>
          {todaySummary.attentionRows.length > 0 ? (
            <div className="today-attention-list">
              {todaySummary.attentionRows.map((row) => {
                const primaryReason = row.reasons[0]
                const reasonDetails = [...new Set(row.reasons.map((reason) => reason.detail))].join(' · ')
                const isReturnerContext = row.reasons.some(
                  (reason) => reason.tone === 'returner' || reason.tone === 'red' || reason.tone === 'yellow',
                )

                return (
                  <AthleteRow
                    key={row.playerId}
                    meta={[row.position]}
                    name={row.name}
                    note={reasonDetails}
                    playerId={row.playerId}
                    readinessLabel={`Status ${chipLabelForTone(row.tone)}`}
                    readinessTone={row.tone}
                    status={<StatusChip label={chipLabelForTone(row.tone)} tone={rowChipTone(row.tone)} />}
                    trendLabel={primaryReason.context}
                    action={
                      <SecondaryButton
                        compact
                        data-testid={`today-attention-${isReturnerContext ? 'returner' : 'check-in'}-${row.playerId}`}
                        onClick={() => {
                          if (isReturnerContext && onOpenReturner) {
                            triggerHapticFeedback('selection')
                            onOpenReturner(row.playerId)
                            onActionFeedback('Returner-Aufgabe geöffnet.')
                            return
                          }

                          navigateWithFeedback(routes.unitCheckIn, 'Check-in geöffnet.')
                        }}
                      >
                        {isReturnerContext ? 'Returner öffnen' : 'Im Check-in klären'}
                      </SecondaryButton>
                    }
                  />
                )
              })}
            </div>
          ) : todaySummary.presentCount === 0 ? (
            <EmptyState
              body="Öffne den Check-in, um Anwesenheit und aktuelle Hinweise für diese Einheit zu sehen. Nicht eingecheckte Spieler bleiben im Check-in."
              title="Noch niemand eingecheckt"
            />
          ) : (
            <EmptyState
              body="Für die anwesenden Spieler gibt es aktuell keine roten, gelben, Returner- oder Klärhinweise."
              title="Keine aktuellen Hinweise"
            />
          )}
        </section>
      </main>

      <aside className="today-context-column" aria-label="Sekundärer Kontext">
        <details className="today-context-panel">
          <summary>
            <span>Kontext</span>
            <small>Material, Ablauf, Notizen und offene Nachbereitung</small>
          </summary>
          <div className="today-context-stack">
            <section className="today-context-block" aria-labelledby="today-session-context-heading">
              <div className="status-line">
                <CalendarDays className="nav-icon" aria-hidden />
                <h3 id="today-session-context-heading">Einheit</h3>
              </div>
              <ul className="compact-list">
                {selectedSession.goals.map((goal) => (
                  <li key={goal}>{goal}</li>
                ))}
              </ul>
            </section>

            <section className="today-context-block" aria-labelledby="today-material-heading">
              <div className="status-line">
                <Dumbbell className="nav-icon" aria-hidden />
                <h3 id="today-material-heading">Material</h3>
              </div>
              {selectedSession.materials.length > 0 ? (
                <ul className="compact-list">
                  {selectedSession.materials.map((material) => (
                    <li key={material}>{material}</li>
                  ))}
                </ul>
              ) : (
                <p className="compact-empty">Kein Material hinterlegt.</p>
              )}
            </section>

            <section className="today-context-block" aria-labelledby="today-documents-heading">
              <div className="status-line">
                <FileText className="nav-icon" aria-hidden />
                <h3 id="today-documents-heading">Unterlagen</h3>
              </div>
              {selectedSession.pdfRefs.length > 0 ? (
                <div className="today-secondary-actions">
                  {selectedSession.pdfRefs.map((pdf, index) => (
                    <SecondaryButton
                      compact
                      data-testid={`today-pdf-button-${index}`}
                      key={pdf.href}
                      onClick={() => handleOpenPdf(pdf)}
                    >
                      PDF öffnen: {pdf.label}
                    </SecondaryButton>
                  ))}
                </div>
              ) : (
                <p className="compact-empty">Keine PDF-Unterlagen für diese Einheit.</p>
              )}
              <SecondaryButton compact data-testid="today-quick-action-library" onClick={handleOpenLibrary}>
                Bibliothek öffnen
              </SecondaryButton>
            </section>

            {postSessionWork ? (
              <section className="today-context-block" aria-labelledby="today-post-session-heading">
                <div className="status-line">
                  <ClipboardCheck className="nav-icon" aria-hidden />
                  <h3 id="today-post-session-heading">Nachbereitung</h3>
                </div>
                <p>
                  {postSessionDefinition?.title ?? postSessionWork.sessionLog.date}: {' '}
                  {postSessionWork.completion.status === 'abgeschlossen'
                    ? 'Abgeschlossen, Export prüfen.'
                    : `${postSessionMissingCount} Pflichtpunkt(e) offen.`}
                </p>
                <SecondaryButton compact data-testid="today-post-session-work-action" onClick={handleOpenPostSessionWork}>
                  Nachbereitung öffnen
                </SecondaryButton>
              </section>
            ) : null}

            {activeObservations.length > 0 ? (
              <section className="today-context-block" aria-labelledby="today-observations-heading">
                <div className="status-line">
                  <FileText className="nav-icon" aria-hidden />
                  <h3 id="today-observations-heading">Notizen aus letzter Einheit</h3>
                </div>
                <ul className="compact-list">
                  {activeObservations.map((observation) => {
                    const player = observation.playerId ? playerById.get(observation.playerId) : null
                    return (
                      <li key={`${observation.playerId}-${observation.sessionDate}`}>
                        <strong>{player?.name ?? 'Spieler'}:</strong> {observation.observation}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

            <section className="today-context-block" aria-labelledby="today-upcoming-heading">
              <div className="status-line">
                <ClipboardCheck className="nav-icon" aria-hidden />
                <h3 id="today-upcoming-heading">Ab heute</h3>
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
            </section>

            <CoachInsightsPanel
              dismissKey={`today:${selectedSession.id}`}
              emptyText="Keine offenen Coach Insights."
              insights={todaySummary.relevantCoachInsights}
              limit={3}
              onOpenSource={onOpenCoachInsightSource}
              variant="embedded"
            />

            {showStorageWarning ? (
              <section className="today-context-block today-storage-warning" aria-labelledby="today-storage-heading">
                <div className="status-line">
                  <FileText className="nav-icon" aria-hidden />
                  <h3 id="today-storage-heading">Offline-Speicher prüfen</h3>
                </div>
                <p>Gerätespeicher ist nicht dauerhaft gesichert. In Einstellungen prüfen.</p>
                <SecondaryButton compact onClick={() => navigateWithFeedback(routes.moreSettings, 'Einstellungen geöffnet.')}>
                  Zu Einstellungen
                </SecondaryButton>
              </section>
            ) : null}
          </div>
        </details>
      </aside>
    </section>
  )
}
