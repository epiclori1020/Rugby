import { ArrowRight, CalendarDays, ClipboardCheck, Dumbbell, FileText, ShieldAlert, Users } from 'lucide-react'
import type { HubTab } from '../App'
import { getRelevantSessions } from '../content/sessions'
import type { SessionDefinition } from '../content/types'
import type { Player } from '../domain/players'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { StoragePersistenceState } from '../hooks/useStoragePersistence'
import { hasPlayerId } from '../lib/playerId'
import { pendingCountLabel } from '../lib/syncLabels'
import { SessionPicker } from './SessionPicker'

type TodayDashboardProps = {
  checkInActions: ReturnType<typeof useCheckIns>
  onNavigate: (tab: HubTab) => void
  onSessionChange: (sessionId: string) => void
  players: Player[]
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
  storagePersistence: StoragePersistenceState
}

const quickActions: Array<{ label: string; tab: HubTab }> = [
  { label: 'Check-in oeffnen', tab: 'check-in' },
  { label: 'Training anzeigen', tab: 'training' },
  { label: 'Nachbereitung', tab: 'nachbereitung' },
  { label: 'Bibliothek', tab: 'bibliothek' },
]

function formatSessionDate(date: string) {
  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T12:00:00`))
}

export function TodayDashboard({
  checkInActions,
  onNavigate,
  onSessionChange,
  players,
  selectedSession,
  selectedSessionId,
  sessions,
  storagePersistence,
}: TodayDashboardProps) {
  const { upcomingSessions } = getRelevantSessions()
  const featuredSession = selectedSession
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

  return (
    <section className="dashboard-grid" aria-labelledby="today-heading">
      <div className="content-stack">
        <article className="panel">
          <p className="eyebrow">Naechste Einheit</p>
          <h3 id="today-heading">{featuredSession.title}</h3>
          <p>{featuredSession.summary}</p>
          <div className="tag-row" aria-label="Session Status">
            <span className="tag">{featuredSession.kw}</span>
            <span className="tag">{formatSessionDate(featuredSession.date)}</span>
            <span className="tag">App-UI aus aktiver Quelle</span>
          </div>
          <SessionPicker
            onSessionChange={onSessionChange}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
        </article>

        <article className="panel soft">
          <h3>Planueberblick</h3>
          <div className="metric-grid">
            <div className="metric">
              <span>Typ</span>
              <strong>{featuredSession.type}</strong>
            </div>
            <div className="metric">
              <span>Bloecke</span>
              <strong>{featuredSession.timeline.length}</strong>
            </div>
            <div className="metric">
              <span>PDFs</span>
              <strong>{featuredSession.pdfRefs.length}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="status-line">
            <CalendarDays className="nav-icon" aria-hidden />
            <h3>Heute-Ablauf</h3>
          </div>
          <div className="session-timeline">
            {featuredSession.timeline.slice(0, 6).map((block) => (
              <div className="timeline-row" key={`${block.time}-${block.title}`}>
                <span>{block.time}</span>
                <div>
                  <strong>{block.title}</strong>
                  <p>{block.work}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>Schnellzugriff</h3>
          <div className="quick-actions">
            {quickActions.map((action) => (
              <button
                className="quick-action"
                key={action.tab}
                type="button"
                onClick={() => onNavigate(action.tab)}
              >
                <span>{action.label}</span>
                <ArrowRight className="nav-icon" aria-hidden />
              </button>
            ))}
          </div>
        </article>
      </div>

      <aside className="content-stack" aria-label="Vorbereitungsstatus">
        <article className="panel">
          <div className="status-line">
            <ShieldAlert className="nav-icon" aria-hidden />
            <h3>Safety</h3>
          </div>
          <ul className="compact-list">
            {featuredSession.safetyNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="status-line">
            <Dumbbell className="nav-icon" aria-hidden />
            <h3>Material</h3>
          </div>
          <ul className="compact-list">
            {featuredSession.materials.map((material) => (
              <li key={material}>{material}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="status-line">
            <ClipboardCheck className="nav-icon" aria-hidden />
            <h3>Naechste Sessions</h3>
          </div>
          <div className="upcoming-list">
            {upcomingSessions.map((session) => (
              <button
                className="upcoming-session"
                key={session.id}
                type="button"
                onClick={() => onSessionChange(session.id)}
              >
                <span>{formatSessionDate(session.date)}</span>
                <strong>{session.title}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="panel">
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
          <button className="quick-action" type="button" onClick={() => onNavigate('check-in')}>
            <span>Zum Check-in</span>
            <ArrowRight className="nav-icon" aria-hidden />
          </button>
        </article>

        <article className={warningCount > 0 ? 'panel warning-panel' : 'panel'}>
          <div className="status-line">
            <ShieldAlert className="nav-icon" aria-hidden />
            <h3>Offene Warnungen</h3>
          </div>
          <p>
            {warningCount > 0
              ? `${warningCount} Gelb/Rot/Returner-Hinweis aus vorherigen Einheiten sichtbar.`
              : 'Keine lokalen Gelb/Rot/Returner-Hinweise aus vorherigen Einheiten.'}
          </p>
          <p>
            {postSessionFollowUpCount > 0
              ? `${postSessionFollowUpCount} E2-/Progressions-Follow-ups fuer die naechste Einheit.`
              : 'Keine lokalen E2-/Progressions-Follow-ups aus der Nachbereitung.'}
          </p>
          <p>{pendingCountLabel(pendingCount, 'Check-in-Aenderungen')}.</p>
        </article>

        {activeObservations.length > 0 ? (
          <article className="panel">
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

        <article className="panel">
          <div className="status-line">
            <FileText className="nav-icon" aria-hidden />
            <h3>Speicherstatus</h3>
          </div>
          <p>Aktueller Browserstatus: {storagePersistence.status}.</p>
        </article>
      </aside>
    </section>
  )
}
