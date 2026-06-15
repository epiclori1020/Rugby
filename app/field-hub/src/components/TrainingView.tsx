import {
  AlertTriangle,
  Dumbbell,
  Gauge,
  RefreshCw,
  Route,
  ShieldAlert,
  UserCheck,
} from 'lucide-react'
import type { FormEvent } from 'react'
import type { HubTab } from '../App'
import { exerciseMappings, variantCards } from '../content/trainingReference'
import type { SessionDefinition } from '../content/types'
import type { CheckInEntryPatch, CheckInLimit, PlayerSessionEntry, PlayerWarning, TrafficLight } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ReturnerCapSummary } from '../domain/returners'
import { applyTrainingQuickAction, type TrainingQuickAction } from '../domain/training'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { AuthSessionState } from '../lib/auth'
import { hasPlayerId } from '../lib/playerId'
import { pendingCountLabel, syncStatusLabel } from '../lib/syncLabels'
import { AuthPanel } from './AuthPanel'
import { SessionPicker } from './SessionPicker'

type TrainingActions = ReturnType<typeof useCheckIns>

type TrainingViewProps = {
  authState: AuthSessionState
  checkInActions: TrainingActions
  onNavigate: (tab: HubTab) => void
  onSessionChange: (sessionId: string) => void
  returnerCaps: ReturnerCapSummary[]
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
}

const trafficLabels: Record<TrafficLight, string> = {
  green: 'Gruen',
  yellow: 'Gelb',
  red: 'Rot',
}

const limitLabels: Record<CheckInLimit, string> = {
  kein_sprint: 'kein Sprint',
  kein_cond: 'kein Conditioning',
  kein_schweres_heben: 'kein schweres Heben',
  physio: 'Physio/Medical',
  klaeren: 'klaeren',
}

const quickActions: Array<{ action: TrainingQuickAction; label: string; tone?: 'danger' }> = [
  { action: 'variant_c', label: 'C-Variante' },
  { action: 'variant_d', label: 'D / stop / klaeren', tone: 'danger' },
  { action: 'kein_sprint', label: 'kein Sprint' },
  { action: 'kein_conditioning', label: 'kein Conditioning' },
  { action: 'kein_schweres_heben', label: 'kein schweres Heben' },
  { action: 'physio_medical', label: 'Physio/Medical' },
]

function formatTrafficLight(trafficLight: TrafficLight | null) {
  return trafficLight ? trafficLabels[trafficLight] : 'Offen'
}

function WarningNote({ warning }: { warning: PlayerWarning | undefined }) {
  if (!warning) {
    return null
  }

  const followUps = [
    warning.e2Decision && warning.e2Decision !== 'normal' ? `E2 ${warning.e2Decision}` : null,
    warning.nextStep ? `Next ${warning.nextStep}` : null,
    warning.postPainScore !== null ? `Post-Pain ${warning.postPainScore}/10` : null,
  ].filter(Boolean)

  return (
    <div className="warning-note">
      <AlertTriangle className="nav-icon" aria-hidden />
      <span>
        Vorwarnung {warning.sessionDate}: {formatTrafficLight(warning.trafficLight)}
        {warning.returnerFlag !== 'nein' ? ` · Returner ${warning.returnerFlag}` : ''}
        {warning.limits.length > 0 ? ` · Limits ${warning.limits.map((limit) => limitLabels[limit]).join(', ')}` : ''}
        {followUps.length > 0 ? ` · ${followUps.join(' · ')}` : ''}
      </span>
    </div>
  )
}

function ReturnerCapNote({ cap }: { cap: ReturnerCapSummary | undefined }) {
  if (!cap) {
    return null
  }

  const parts = [
    cap.allowedToday ? `Erlaubt: ${cap.allowedToday}` : null,
    cap.speedCap ? `Speed: ${cap.speedCap}` : null,
    cap.codDecelCap ? `COD: ${cap.codDecelCap}` : null,
    cap.conditioningCap ? `Cond: ${cap.conditioningCap}` : null,
    cap.contactCap ? `Kontakt: ${cap.contactCap}` : null,
  ].filter(Boolean)

  if (parts.length === 0) {
    return null
  }

  return (
    <div className="warning-note returner-cap-note">
      <ShieldAlert className="nav-icon" aria-hidden />
      <span>Returner-Caps {cap.sessionDate}: {parts.join(' · ')}. Keine medizinische Freigabe.</span>
    </div>
  )
}

function TrainingPlayerRow({
  entry,
  isSavingDisabled,
  onSave,
  player,
  returnerCap,
  warning,
}: {
  entry: PlayerSessionEntry
  isSavingDisabled: boolean
  onSave: (player: Player, patch: CheckInEntryPatch) => void
  player: Player
  returnerCap: ReturnerCapSummary | undefined
  warning: PlayerWarning | undefined
}) {
  function handleObservationBlur(event: FormEvent<HTMLTextAreaElement>) {
    onSave(player, { observation: event.currentTarget.value, previousWarning: Boolean(warning) })
  }

  function handleQuickAction(action: TrainingQuickAction) {
    onSave(player, {
      ...applyTrainingQuickAction(entry, action),
      previousWarning: Boolean(warning),
    })
  }

  const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
  const isStop = trafficLight === 'red' || entry.trainingVariant === 'D' || entry.limits.includes('klaeren')

  return (
    <article className={`training-player-row traffic-${trafficLight ?? 'open'}`}>
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {entry.trainingVariant ? <span className="tag compact">Variante {entry.trainingVariant}</span> : null}
            {isStop ? <span className="tag danger compact">Stop/klaeren</span> : null}
          </div>
          <p>
            {player.position} · {player.cluster} · Ampel {formatTrafficLight(trafficLight)}
          </p>
        </div>
        <span className={`sync-pill ${entry.syncStatus}`}>{syncStatusLabel(entry.syncStatus)}</span>
      </div>

      <WarningNote warning={warning} />
      <ReturnerCapNote cap={returnerCap} />

      <div className="training-limits">
        {entry.limits.length > 0 ? (
          entry.limits.map((limit) => (
            <span className={limit === 'klaeren' || limit === 'physio' ? 'tag danger compact' : 'tag compact'} key={limit}>
              {limitLabels[limit]}
            </span>
          ))
        ) : (
          <span className="tag compact">keine Limits gesetzt</span>
        )}
      </div>

      <div className="button-row training-actions">
        {quickActions.map((item) => (
          <button
            className={item.tone === 'danger' ? 'segmented danger' : 'segmented'}
            disabled={isSavingDisabled}
            key={item.action}
            type="button"
            onClick={() => handleQuickAction(item.action)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isStop ? (
        <div className="warning-note danger">
          <ShieldAlert className="nav-icon" aria-hidden />
          <span>D/Rot wirkt nicht als normaler Trainingsblock. Keine automatische medizinische Freigabe.</span>
        </div>
      ) : null}

      <label className="inline-field wide">
        <span>Beobachtung, keine Diagnose</span>
        <textarea
          defaultValue={entry.observation}
          disabled={isSavingDisabled}
          rows={2}
          placeholder="z. B. C-Variante im Hinge, kein Sprint, Schulter beobachten"
          onBlur={handleObservationBlur}
        />
      </label>
    </article>
  )
}

export function TrainingView({
  authState,
  checkInActions,
  onNavigate,
  onSessionChange,
  returnerCaps,
  selectedSession,
  selectedSessionId,
  sessions,
}: TrainingViewProps) {
  const {
    activePlayers,
    errorMessage,
    expectedPlayerIds,
    warnings,
    syncOverview,
    isLoading,
    runSync,
    saveEntry,
    saveSessionPatch,
    getEntryForPlayer,
    sessionLog,
    clearError,
  } = checkInActions
  const expectedPlayerSet = new Set(expectedPlayerIds)
  const warningByPlayerId = new Map(warnings.filter(hasPlayerId).map((warning) => [warning.playerId, warning]))
  const returnerCapByPlayerId = new Map(returnerCaps.filter(hasPlayerId).map((cap) => [cap.playerId, cap]))
  const orderedPlayers = [...activePlayers].sort((a, b) => {
    const aExpected = expectedPlayerSet.has(a.id)
    const bExpected = expectedPlayerSet.has(b.id)

    if (aExpected === bExpected) {
      return a.name.localeCompare(b.name, 'de-AT')
    }

    return aExpected ? -1 : 1
  })
  const variantCount = orderedPlayers.filter((player) => getEntryForPlayer(player).trainingVariant).length
  const limitedCount = orderedPlayers.filter((player) => getEntryForPlayer(player).limits.length > 0).length

  function handleSessionTextBlur(field: 'contactIndex' | 'speedExposureNote') {
    return (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value.trim()
      const currentValue = sessionLog?.[field] ?? ''

      if (value === currentValue) {
        return
      }

      void saveSessionPatch({
        [field]: value,
        planChanged: true,
        status: 'in_progress',
      })
    }
  }

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <AuthPanel authState={authState} />
        <section className="placeholder" aria-labelledby="training-locked-heading">
          <Dumbbell className="placeholder-icon" aria-hidden />
          <h2 id="training-locked-heading">Training</h2>
          <p>Training-Anpassungen werden erst nach Coach-Login lokal gespeichert und synchronisiert.</p>
        </section>
      </div>
    )
  }

  return (
    <section className="training-layout" aria-labelledby="training-heading">
      <div className="panel checkin-header">
        <div className="library-heading">
          <p className="eyebrow">Am Feld</p>
          <h3 id="training-heading">Training-Ansicht</h3>
          <p>{selectedSession.title}: Plan, Varianten, Quick Actions, Kontaktindex und Speed-Exposure.</p>
        </div>
        <div className="player-toolbar">
          <SessionPicker
            onSessionChange={onSessionChange}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
          <button className="secondary-action" type="button" onClick={runSync} disabled={isLoading}>
            <RefreshCw className="nav-icon" aria-hidden />
            <span>{isLoading ? 'Sync laeuft...' : 'Sync'}</span>
          </button>
          <button className="secondary-action" type="button" onClick={() => onNavigate('check-in')}>
            <UserCheck className="nav-icon" aria-hidden />
            <span>Check-in</span>
          </button>
        </div>
      </div>

      <div className="metric-grid checkin-metrics">
        <div className="metric">
          <span>Bloecke</span>
          <strong>{selectedSession.timeline.length}</strong>
        </div>
        <div className="metric">
          <span>Spieler</span>
          <strong>{activePlayers.length}</strong>
        </div>
        <div className="metric">
          <span>Varianten</span>
          <strong>{variantCount}</strong>
        </div>
        <div className="metric">
          <span>Limits</span>
          <strong>{limitedCount}</strong>
        </div>
      </div>

      {errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Training nicht vollstaendig synchronisiert</strong>
          <span>{errorMessage}</span>
          <button className="secondary-action" type="button" onClick={clearError}>
            Schliessen
          </button>
        </div>
      ) : null}

      <div className="panel checkin-sync-strip">
        <span className={`status-dot ${syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
        <strong>{syncStatusLabel(syncOverview.status)}</strong>
        <span>{pendingCountLabel(syncOverview.pendingCount, 'Training/Check-in-Aenderungen')}</span>
        {syncOverview.errorMessage ? <span>{syncOverview.errorMessage}</span> : null}
      </div>

      <div className="training-grid">
        <div className="content-stack">
          <article className="panel">
            <div className="status-line">
              <Route className="nav-icon" aria-hidden />
              <h3>Timeline</h3>
            </div>
            <div className="session-timeline training-timeline">
              {selectedSession.timeline.map((block) => (
                <div className="timeline-row" key={`${block.time}-${block.title}`}>
                  <span>{block.time}</span>
                  <div>
                    <strong>{block.title}</strong>
                    <p>{block.work}</p>
                    <div className="tag-row">
                      {block.dose ? <span className="tag compact">{block.dose}</span> : null}
                      {block.note ? <span className="tag compact">{block.note}</span> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="status-line">
              <Gauge className="nav-icon" aria-hidden />
              <h3>Kontaktindex und Speed-Exposure</h3>
            </div>
            <div className="training-coach-fields">
              <label className="inline-field wide">
                <span>Kontaktindex</span>
                <input
                  defaultValue={sessionLog?.contactIndex ?? ''}
                  disabled={isLoading}
                  key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-contact-index`}
                  placeholder="z. B. 0 kein Kontakt, 1 kontrollierte Prep"
                  onBlur={handleSessionTextBlur('contactIndex')}
                />
              </label>
              <label className="inline-field wide">
                <span>Speed-Exposure</span>
                <textarea
                  defaultValue={sessionLog?.speedExposureNote ?? ''}
                  disabled={isLoading}
                  key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-speed-exposure`}
                  rows={2}
                  placeholder="z. B. 4x10 m, keine Max-Speed-Reps, SB smooth fast"
                  onBlur={handleSessionTextBlur('speedExposureNote')}
                />
              </label>
            </div>
          </article>
        </div>

        <aside className="content-stack" aria-label="Varianten und Mapping">
          <article className="panel">
            <h3>Varianten A+/A/B/C/D</h3>
            <div className="variant-grid">
              {variantCards.map((card) => (
                <div className={card.variant === 'D' ? 'variant-card danger' : 'variant-card'} key={card.variant}>
                  <strong>{card.label}</strong>
                  <span>{card.summary}</span>
                  <p>{card.decision}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Exercise Mapping</h3>
            <div className="exercise-mapping-list">
              {exerciseMappings.map((mapping) => (
                <details className="mapping-detail" key={mapping.pattern}>
                  <summary>{mapping.pattern}</summary>
                  <p><strong>Default:</strong> {mapping.defaultOption}</p>
                  <p><strong>Alternative:</strong> {mapping.alternative}</p>
                  <p><strong>Gelb/Returner:</strong> {mapping.yellowReturner}</p>
                  <p><strong>Fokus:</strong> {mapping.coachFocus}</p>
                </details>
              ))}
            </div>
          </article>
        </aside>
      </div>

      <section className="panel training-player-panel" aria-label="Spieler-Anpassungen">
        <div className="status-line">
          <UserCheck className="nav-icon" aria-hidden />
          <h3>Spieler Quick Actions</h3>
        </div>
        <div className="training-player-list">
          {orderedPlayers.map((player) => (
            <TrainingPlayerRow
              entry={getEntryForPlayer(player)}
              isSavingDisabled={isLoading}
              key={player.id}
            onSave={(selectedPlayer, patch) => {
              void saveEntry(selectedPlayer, patch)
            }}
            player={player}
            returnerCap={returnerCapByPlayerId.get(player.id)}
            warning={warningByPlayerId.get(player.id)}
          />
          ))}
        </div>
        {activePlayers.length === 0 ? (
          <section className="placeholder">
            <UserCheck className="placeholder-icon" aria-hidden />
            <h2>Noch keine aktiven Spieler</h2>
            <p>Lege zuerst Spieler im Spieler-Tab an. Danach erscheinen sie hier automatisch im Training.</p>
          </section>
        ) : null}
      </section>
    </section>
  )
}
