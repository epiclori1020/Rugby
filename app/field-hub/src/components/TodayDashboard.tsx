import { useCallback } from 'react'
import { ArrowRight, CalendarDays, ClipboardCheck, Dumbbell, FileText, ShieldAlert } from 'lucide-react'
import { routes, type AppRoute } from '../navigation'
import type { PdfRef, SessionDefinition, SessionType } from '../content/types'
import type { PlayerWarning, TrafficLight } from '../domain/checkIn'
import type { CoachInsight, CoachInsightSource } from '../domain/coachInsights'
import type { Player } from '../domain/players'
import type { LatestRelevantPostSessionWork } from '../domain/postSessionCompletion'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { StoragePersistenceState } from '../hooks/useStoragePersistence'
import { hasPlayerId } from '../lib/playerId'
import { pendingCountLabel } from '../lib/syncLabels'
import { CoachInsightsPanel } from './CoachInsightsPanel'
import { AthleteRow, ScoreboardStrip, type ReadinessTone, type ScoreboardMetric } from './onfield'
import { EmptyState, PrimaryButton, SecondaryButton, StatusChip, type StatusTone } from './ui'
import { SessionPicker } from './SessionPicker'

type TodayDashboardProps = {
  checkInActions: ReturnType<typeof useCheckIns>
  coachInsights: CoachInsight[]
  featuredSession: SessionDefinition
  isSignedIn: boolean
  onActionFeedback: (message: string) => void
  onOpenCoachInsightSource: (source: CoachInsightSource) => void
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
  todayDate: Date
  upcomingSessions: SessionDefinition[]
}

type AttentionRow = {
  id: string
  name: string
  position: string
  detail: string
  trendLabel: string
  chipLabel: string
  chipTone: StatusTone
  readinessTone: ReadinessTone
  readinessLabel: string
  sortRank: number
}

const sessionTypeLabels: Record<SessionType, string> = {
  training: 'Training',
  baseline: 'Baseline',
  recheck: 'Re-Check',
  transition: 'Übergang',
}

const trafficLabels: Record<TrafficLight, string> = {
  green: 'Grün',
  yellow: 'Gelb',
  red: 'Rot',
}

const syncTone: Record<ReturnType<typeof useCheckIns>['syncOverview']['status'], StatusTone> = {
  error: 'danger',
  pending: 'warning',
  synced: 'success',
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

function formatReturnerFlag(flag: PlayerWarning['returnerFlag']) {
  if (flag === 'ja') {
    return 'Returner'
  }

  if (flag === 'offen') {
    return 'Returner offen'
  }

  return null
}

function warningTone(warning: PlayerWarning): ReadinessTone {
  if (warning.trafficLight === 'red' || warning.nextStep === 'klaeren') {
    return 'red'
  }

  if (warning.trafficLight === 'yellow' || warning.nextStep === 'reduzieren' || (warning.postPainScore ?? 0) >= 3) {
    return 'yellow'
  }

  if (warning.returnerFlag !== 'nein') {
    return 'returner'
  }

  return 'open'
}

function rowRank(tone: ReadinessTone) {
  if (tone === 'red') {
    return 0
  }

  if (tone === 'yellow') {
    return 1
  }

  if (tone === 'returner') {
    return 2
  }

  return 3
}

function rowChipTone(tone: ReadinessTone): StatusTone {
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

function warningDetail(warning: PlayerWarning) {
  const parts = [
    warning.trafficLight ? `Ampel ${trafficLabels[warning.trafficLight]}` : null,
    formatReturnerFlag(warning.returnerFlag),
    warning.nextStep ? `Nächster Schritt: ${warning.nextStep}` : null,
    warning.observation.trim() ? warning.observation.trim() : null,
  ].filter(Boolean)

  return parts.join(' · ') || 'Offene Klärung aus letzter Einheit.'
}

function chipLabelForTone(tone: ReadinessTone) {
  if (tone === 'red') {
    return 'Rot'
  }

  if (tone === 'yellow') {
    return 'Gelb'
  }

  if (tone === 'returner') {
    return 'Returner'
  }

  return 'Offen'
}

function upsertAttentionRow(rows: Map<string, AttentionRow>, row: AttentionRow) {
  const existing = rows.get(row.id)
  if (!existing || row.sortRank < existing.sortRank) {
    rows.set(row.id, row)
  }
}

function insightTone(insight: CoachInsight): ReadinessTone {
  if (insight.severity === 'high') {
    return 'red'
  }

  if (insight.severity === 'medium') {
    return 'yellow'
  }

  return 'open'
}

export function TodayDashboard({
  checkInActions,
  coachInsights,
  featuredSession,
  isSignedIn,
  onActionFeedback,
  onOpenCoachInsightSource,
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
  todayDate,
  upcomingSessions,
}: TodayDashboardProps) {
  const isPreview = selectedSession.id !== featuredSession.id
  const activePlayers = players.filter((player) => player.active)
  const activePlayerIds = new Set(activePlayers.map((player) => player.id))
  const playerById = new Map(activePlayers.map((player) => [player.id, player]))
  const activeEntries = checkInActions.entries.filter(
    (entry) => hasPlayerId(entry) && activePlayerIds.has(entry.playerId),
  )
  const activeWarnings = checkInActions.warnings.filter(
    (warning) => hasPlayerId(warning) && activePlayerIds.has(warning.playerId),
  )
  const activeObservations = checkInActions.observations.filter(
    (observation) => hasPlayerId(observation) && activePlayerIds.has(observation.playerId),
  )
  const expectedPlayerSet = new Set(checkInActions.expectedPlayerIds)
  const expectedCount =
    expectedPlayerSet.size > 0 ? activePlayers.filter((player) => expectedPlayerSet.has(player.id)).length : activePlayers.length
  const presentCount = activeEntries.filter((entry) => entry.present).length
  const redPlayerIds = new Set<string>()
  const yellowPlayerIds = new Set<string>()
  const returnerPlayerIds = new Set<string>()

  activePlayers.forEach((player) => {
    if (player.returnerStatus !== 'nein') {
      returnerPlayerIds.add(player.id)
    }
  })

  activeEntries.forEach((entry) => {
    if (!entry.playerId) {
      return
    }
    const playerId = entry.playerId
    const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
    if (trafficLight === 'red') {
      redPlayerIds.add(playerId)
    } else if (trafficLight === 'yellow') {
      yellowPlayerIds.add(playerId)
    }

    if (entry.returnerFlag !== 'nein') {
      returnerPlayerIds.add(playerId)
    }
  })

  activeWarnings.forEach((warning) => {
    if (!warning.playerId) {
      return
    }
    const playerId = warning.playerId
    if (warning.trafficLight === 'red') {
      redPlayerIds.add(playerId)
    } else if (warning.trafficLight === 'yellow') {
      yellowPlayerIds.add(playerId)
    }

    if (warning.returnerFlag !== 'nein') {
      returnerPlayerIds.add(playerId)
    }
  })

  redPlayerIds.forEach((playerId) => yellowPlayerIds.delete(playerId))

  const scoreboardMetrics: ScoreboardMetric[] = [
    { id: 'squad', label: 'Kader', value: expectedCount, tone: 'open', assistiveLabel: `${expectedCount} im Kader` },
    {
      id: 'present',
      label: 'Anwesend',
      value: presentCount,
      tone: 'green',
      assistiveLabel: `${presentCount} anwesend`,
    },
    { id: 'yellow', label: 'Gelb', value: yellowPlayerIds.size, tone: 'yellow' },
    { id: 'red', label: 'Rot', value: redPlayerIds.size, tone: 'red' },
    { id: 'returner', label: 'Returner', value: returnerPlayerIds.size, tone: 'returner' },
  ]

  const postSessionDefinition = postSessionWork
    ? sessions.find((session) => session.id === postSessionWork.sessionLog.sessionDefinitionId)
    : null
  const postSessionMissingCount = postSessionWork
    ? postSessionWork.completion.blockers.reduce((sum, blocker) => sum + Math.max(1, blocker.count), 0)
    : 0
  const pendingCount = checkInActions.syncOverview.pendingCount
  const showStorageWarning = !['checking', 'persisted'].includes(storagePersistence.status)
  const showWelcomeSurface = !isSignedIn || activePlayers.length === 0
  const welcomeTitle = !isSignedIn ? 'Trainingstag vorbereiten' : 'Squad für OnField anlegen'
  const welcomeBody = !isSignedIn
    ? 'Nach dem Login werden Spielerstatus, Anwesenheit und offene Aufgaben auf iPhone und iPad verfügbar.'
    : 'Lege aktive Spieler an, damit Check-in, Session Flow und Wrap-up mit demselben Funktionsumfang starten.'
  const syncLabel = !checkInActions.syncOverview.isOnline
    ? 'offline'
    : pendingCount > 0
      ? pendingCountLabel(pendingCount)
      : checkInActions.syncOverview.status === 'synced'
        ? 'synchronisiert'
        : 'Sync läuft'
  const syncChipTone = checkInActions.syncOverview.isOnline ? syncTone[checkInActions.syncOverview.status] : 'warning'

  const attentionRowMap = new Map<string, AttentionRow>()

  activeWarnings.forEach((warning) => {
    if (!warning.playerId) {
      return
    }
    const playerId = warning.playerId
    const player = playerById.get(playerId)
    const tone = warningTone(warning)
    upsertAttentionRow(attentionRowMap, {
      id: `warning:${playerId}`,
      name: player?.name ?? 'Spieler',
      position: player?.position ?? 'Position offen',
      detail: warningDetail(warning),
      trendLabel: `Letzte Einheit ${formatSessionDate(warning.sessionDate)}`,
      chipLabel: chipLabelForTone(tone),
      chipTone: rowChipTone(tone),
      readinessTone: tone,
      readinessLabel: `Status ${chipLabelForTone(tone)}`,
      sortRank: rowRank(tone),
    })
  })

  coachInsights.forEach((insight) => {
    const tone = insightTone(insight)
    insight.sources.filter(hasPlayerId).forEach((source) => {
      if (!activePlayerIds.has(source.playerId)) {
        return
      }
      const player = playerById.get(source.playerId)
      upsertAttentionRow(attentionRowMap, {
        id: `insight:${source.playerId}:${insight.id}`,
        name: player?.name ?? source.playerName ?? 'Spieler',
        position: player?.position ?? targetLabel(source.correctionTarget),
        detail: insight.reason,
        trendLabel: `Coach Insight · ${targetLabel(source.correctionTarget)}`,
        chipLabel: chipLabelForTone(tone),
        chipTone: rowChipTone(tone),
        readinessTone: tone,
        readinessLabel: `Coach Insight ${chipLabelForTone(tone)}`,
        sortRank: rowRank(tone),
      })
    })
  })

  activePlayers.forEach((player) => {
    if (player.returnerStatus === 'nein') {
      return
    }
    upsertAttentionRow(attentionRowMap, {
      id: `returner:${player.id}`,
      name: player.name,
      position: player.position,
      detail: `Returner ${player.returnerStatus}`,
      trendLabel: 'Belastungsplan prüfen',
      chipLabel: 'Returner',
      chipTone: 'info',
      readinessTone: 'returner',
      readinessLabel: 'Returner-Kontext',
      sortRank: rowRank('returner'),
    })
  })

  const attentionRows = [...attentionRowMap.values()].sort(
    (a, b) => a.sortRank - b.sortRank || a.name.localeCompare(b.name, 'de-AT'),
  )

  const navigateWithFeedback = useCallback(
    (route: AppRoute, message: string) => {
      onActionFeedback(message)
      onNavigate(route)
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

  const handleOpenLibrary = useCallback(() => {
    onOpenLibrary(selectedSession)
    onActionFeedback('Heutige Unterlagen geöffnet.')
  }, [onActionFeedback, onOpenLibrary, selectedSession])

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
            <span className="today-wordmark">OnField<span aria-hidden>•</span></span>
            <span>{formatContextDate(todayDate)} · {selectedSession.kw}</span>
            <StatusChip label={`Sync: ${syncLabel}`} tone={syncChipTone} />
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
          <section className="today-attention-section today-empty-state-panel">
            <EmptyState
              action={
                <PrimaryButton
                  data-testid="today-welcome-action"
                  icon={<ArrowRight aria-hidden />}
                  onClick={() =>
                    !isSignedIn
                      ? navigateWithFeedback(routes.moreSettings, 'Einstellungen geöffnet.')
                      : navigateWithFeedback(routes.players, 'Spieler geöffnet.')
                  }
                >
                  {!isSignedIn ? 'Login öffnen' : 'Spieler anlegen'}
                </PrimaryButton>
              }
              body={welcomeBody}
              title={welcomeTitle}
            />
          </section>
        </main>
      </section>
    )
  }

  return (
    <section className="dashboard-grid today-squad-screen" aria-labelledby="today-heading">
      <header className="today-squad-header">
        <div className="today-squad-brandline">
          <span className="today-wordmark">OnField<span aria-hidden>•</span></span>
          <span>{formatContextDate(todayDate)} · {selectedSession.kw}</span>
          {isPreview ? <StatusChip label="Vorschau" tone="warning" /> : null}
          <StatusChip label={`Sync: ${syncLabel}`} tone={syncChipTone} />
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
          {attentionRows.length > 0 ? (
            <div className="today-attention-list">
              {attentionRows.map((row) => (
                <AthleteRow
                  key={row.id}
                  meta={[row.position]}
                  name={row.name}
                  note={row.detail}
                  readinessLabel={row.readinessLabel}
                  readinessTone={row.readinessTone}
                  status={<StatusChip label={row.chipLabel} tone={row.chipTone} />}
                  trendLabel={row.trendLabel}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <SecondaryButton compact onClick={() => navigateWithFeedback(routes.unitCheckIn, 'Check-in geöffnet.')}>
                  Check-in prüfen
                </SecondaryButton>
              }
              body="Keine offenen Warnungen, Returner-Hinweise oder Coach Insights für aktive Spieler."
              title="Keine offenen Punkte"
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
              insights={coachInsights}
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

function targetLabel(target: CoachInsightSource['correctionTarget']) {
  const targetLabels: Record<CoachInsightSource['correctionTarget'], string> = {
    analysis: 'Analyse',
    'check-in': 'Check-in',
    nachbereitung: 'Nachbereitung',
    returner: 'Returner',
    spieler: 'Spieler',
    training: 'Training',
  }

  return targetLabels[target]
}
