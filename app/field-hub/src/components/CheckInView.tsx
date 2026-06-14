import { AlertTriangle, ClipboardCheck, RefreshCw, ShieldAlert, UserCheck } from 'lucide-react'
import type { FormEvent } from 'react'
import type { HubTab } from '../App'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry, PlayerWarning, RedFlag, ReturnerFlag, TrafficLight } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ReturnerCapSummary } from '../domain/returners'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { usePlayers } from '../hooks/usePlayers'
import type { AuthSessionState } from '../lib/auth'
import { AuthPanel } from './AuthPanel'
import { SessionPicker } from './SessionPicker'

type CheckInActions = ReturnType<typeof useCheckIns>
type PlayerActions = ReturnType<typeof usePlayers>

type CheckInViewProps = {
  authState: AuthSessionState
  checkInActions: CheckInActions
  playerActions: PlayerActions
  returnerCaps: ReturnerCapSummary[]
  onNavigate: (tab: HubTab) => void
  onSessionChange: (sessionId: string) => void
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
}

const trafficLabels: Record<TrafficLight, string> = {
  green: 'Gruen',
  yellow: 'Gelb',
  red: 'Rot',
}

const redFlagOptions: Array<{ value: RedFlag; label: string }> = [
  { value: 'none', label: 'Keine Red Flag' },
  { value: 'head_neck_neuro', label: 'Kopf/Nacken/Neuro' },
  { value: 'acute_instability', label: 'Akut instabil/stark' },
]

const returnerOptions: Array<{ value: ReturnerFlag; label: string }> = [
  { value: 'nein', label: 'Nein' },
  { value: 'ja', label: 'Ja' },
  { value: 'offen', label: 'Offen' },
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
        {warning.limits.length > 0 ? ` · Limits ${warning.limits.join(', ')}` : ''}
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
    cap.currentStage ? `Stufe ${cap.currentStage}` : null,
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

function CheckInPlayerRow({
  entry,
  isExpected,
  isSavingDisabled,
  onSave,
  player,
  returnerCap,
  warning,
}: {
  entry: PlayerSessionEntry
  isExpected: boolean
  isSavingDisabled: boolean
  onSave: (player: Player, patch: Parameters<CheckInActions['saveEntry']>[1], manualTrafficLight?: TrafficLight) => void
  player: Player
  returnerCap: ReturnerCapSummary | undefined
  warning: PlayerWarning | undefined
}) {
  function handleTextBlur(field: 'lifeFlag' | 'painLocation' | 'observation') {
    return (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onSave(player, { [field]: event.currentTarget.value, previousWarning: Boolean(warning) })
    }
  }

  return (
    <article className={`checkin-row traffic-${entry.trafficLight ?? entry.trafficLightSuggestion ?? 'open'}`}>
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {isExpected ? <span className="tag compact">Zuletzt dabei</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${entry.syncStatus}`}>{entry.syncStatus}</span>
      </div>

      <WarningNote warning={warning} />
      <ReturnerCapNote cap={returnerCap} />

      <div className="checkin-controls">
        <button
          className={entry.present ? 'segmented active' : 'segmented'}
          type="button"
          disabled={isSavingDisabled}
          onClick={() => onSave(player, { present: !entry.present, previousWarning: Boolean(warning) })}
        >
          <UserCheck className="nav-icon" aria-hidden />
          <span>{entry.present ? 'Anwesend' : 'Nicht da'}</span>
        </button>

        <div className="control-group" aria-label={`Readiness ${player.name}`}>
          <span>Readiness</span>
          <div className="button-row compact">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                className={entry.readiness === value ? 'number-chip active' : 'number-chip'}
                key={value}
                type="button"
                disabled={isSavingDisabled}
                onClick={() => onSave(player, { readiness: value, previousWarning: Boolean(warning) })}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Life</span>
          <input
            defaultValue={entry.lifeFlag}
            disabled={isSavingDisabled}
            placeholder="Schlaf, Stress, Muskelkater"
            onBlur={handleTextBlur('lifeFlag')}
          />
        </label>

        <div className="control-group" aria-label={`Schmerz ${player.name}`}>
          <span>Schmerz</span>
          <div className="button-row compact pain-scale">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                className={entry.painScore === value ? 'number-chip active' : 'number-chip'}
                key={value}
                type="button"
                disabled={isSavingDisabled}
                onClick={() => onSave(player, { painScore: value, previousWarning: Boolean(warning) })}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Ort</span>
          <input
            defaultValue={entry.painLocation}
            disabled={isSavingDisabled}
            placeholder="z. B. Wade rechts"
            onBlur={handleTextBlur('painLocation')}
          />
        </label>

        <div className="control-group">
          <span>Returner</span>
          <div className="button-row">
            {returnerOptions.map((option) => (
              <button
                className={entry.returnerFlag === option.value ? 'segmented active' : 'segmented'}
                key={option.value}
                type="button"
                disabled={isSavingDisabled}
                onClick={() =>
                  onSave(player, { returnerFlag: option.value, previousWarning: Boolean(warning) })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <span>Safety</span>
          <div className="button-row">
            {redFlagOptions.map((option) => (
              <button
                className={entry.redFlag === option.value ? 'segmented active danger' : 'segmented'}
                key={option.value}
                type="button"
                disabled={isSavingDisabled}
                onClick={() => onSave(player, { redFlag: option.value, previousWarning: Boolean(warning) })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="toggle-row checkin-toggle">
          <input
            type="checkbox"
            checked={entry.movementConcern}
            disabled={isSavingDisabled}
            onChange={(event) =>
              onSave(player, { movementConcern: event.currentTarget.checked, previousWarning: Boolean(warning) })
            }
          />
          <span>Auffaelliges Laufbild / Bewegung</span>
        </label>

        <div className="traffic-control">
          <span>
            Vorschlag: <strong>{formatTrafficLight(entry.trafficLightSuggestion)}</strong>
            {entry.trafficLightWasManual ? ' · Coach korrigiert' : ''}
          </span>
          <div className="button-row">
            {(['green', 'yellow', 'red'] as TrafficLight[]).map((trafficLight) => (
              <button
                className={entry.trafficLight === trafficLight ? `traffic-chip ${trafficLight} active` : `traffic-chip ${trafficLight}`}
                key={trafficLight}
                type="button"
                disabled={isSavingDisabled}
                onClick={() => onSave(player, { previousWarning: Boolean(warning) }, trafficLight)}
              >
                {trafficLabels[trafficLight]}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field wide">
          <span>Notiz, keine Diagnose</span>
          <textarea
            defaultValue={entry.observation}
            disabled={isSavingDisabled}
            rows={2}
            placeholder="z. B. Hinken, Leiste 3/10, Technik auffaellig"
            onBlur={handleTextBlur('observation')}
          />
        </label>
      </div>
    </article>
  )
}

export function CheckInView({
  authState,
  checkInActions,
  onNavigate,
  onSessionChange,
  playerActions,
  returnerCaps,
  selectedSession,
  selectedSessionId,
  sessions,
}: CheckInViewProps) {
  const {
    activePlayers,
    entries,
    errorMessage,
    expectedPlayerIds,
    warnings,
    syncOverview,
    isLoading,
    runSync,
    saveEntry,
    getEntryForPlayer,
    clearError,
  } = checkInActions
  const warningByPlayerId = new Map(warnings.map((warning) => [warning.playerId, warning]))
  const returnerCapByPlayerId = new Map(returnerCaps.map((cap) => [cap.playerId, cap]))
  const expectedPlayerSet = new Set(expectedPlayerIds)
  const orderedPlayers = [...activePlayers].sort((a, b) => {
    const aExpected = expectedPlayerSet.has(a.id)
    const bExpected = expectedPlayerSet.has(b.id)

    if (aExpected === bExpected) {
      return a.name.localeCompare(b.name, 'de-AT')
    }

    return aExpected ? -1 : 1
  })
  const checkedInCount = entries.filter((entry) => entry.present).length
  const yellowCount = entries.filter((entry) => entry.trafficLight === 'yellow').length
  const redCount = entries.filter((entry) => entry.trafficLight === 'red').length
  const returnerCount = entries.filter((entry) => entry.returnerFlag !== 'nein').length

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <AuthPanel authState={authState} />
        <section className="placeholder" aria-labelledby="checkin-locked-heading">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <h2 id="checkin-locked-heading">Pre-Session Check-in</h2>
          <p>Check-in-Daten werden erst nach Coach-Login lokal gespeichert und synchronisiert.</p>
        </section>
      </div>
    )
  }

  return (
    <section className="checkin-layout" aria-labelledby="checkin-heading">
      <div className="panel checkin-header">
        <div className="library-heading">
          <p className="eyebrow">Sprint 4</p>
          <h3 id="checkin-heading">Pre-Session Check-in</h3>
          <p>
            {selectedSession.title}: Anwesenheit, Readiness, Life-Flag, Schmerz, Returner und Ampel vor dem
            Training.
          </p>
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
          <button className="secondary-action" type="button" onClick={() => onNavigate('spieler')}>
            <UserCheck className="nav-icon" aria-hidden />
            <span>Spieler verwalten</span>
          </button>
        </div>
      </div>

      <div className="metric-grid checkin-metrics">
        <div className="metric">
          <span>Aktive Spieler</span>
          <strong>{activePlayers.length}</strong>
        </div>
        <div className="metric">
          <span>Anwesend</span>
          <strong>{checkedInCount}</strong>
        </div>
        <div className="metric">
          <span>Gelb / Rot</span>
          <strong>{yellowCount} / {redCount}</strong>
        </div>
        <div className="metric">
          <span>Returner/offen</span>
          <strong>{returnerCount}</strong>
        </div>
      </div>

      {errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Check-in nicht vollstaendig synchronisiert</strong>
          <span>{errorMessage}</span>
          <button className="secondary-action" type="button" onClick={clearError}>
            Schliessen
          </button>
        </div>
      ) : null}

      <div className="panel checkin-sync-strip">
        <span className={`status-dot ${syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
        <strong>{syncOverview.status}</strong>
        <span>{syncOverview.pendingCount} Check-in pending</span>
        {syncOverview.errorMessage ? <span>{syncOverview.errorMessage}</span> : null}
      </div>

      {warnings.length > 0 ? (
        <aside className="panel warning-panel" aria-label="Offene Warnungen">
          <div className="status-line">
            <ShieldAlert className="nav-icon" aria-hidden />
            <h3>Offene Warnungen aus letzter Einheit</h3>
          </div>
          <div className="warning-list">
            {warnings.map((warning) => {
              const player = playerActions.players.find((item) => item.id === warning.playerId)
              return (
                <div className="warning-note" key={`${warning.playerId}-${warning.sessionDate}`}>
                  <AlertTriangle className="nav-icon" aria-hidden />
                  <span>
                    <strong>{player?.name ?? 'Spieler'}</strong>: {formatTrafficLight(warning.trafficLight)}
                    {warning.returnerFlag !== 'nein' ? ` · Returner ${warning.returnerFlag}` : ''}
                    {warning.e2Decision && warning.e2Decision !== 'normal' ? ` · E2 ${warning.e2Decision}` : ''}
                    {warning.nextStep ? ` · Next ${warning.nextStep}` : ''}
                    {warning.postPainScore !== null ? ` · Post-Pain ${warning.postPainScore}/10` : ''}
                    {warning.observation ? ` · ${warning.observation}` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </aside>
      ) : null}

      <div className="checkin-list">
        {orderedPlayers.map((player) => (
          <CheckInPlayerRow
            entry={getEntryForPlayer(player)}
            isExpected={expectedPlayerSet.has(player.id)}
            isSavingDisabled={isLoading}
            key={player.id}
            onSave={(selectedPlayer, patch, manualTrafficLight) => {
              void saveEntry(selectedPlayer, patch, manualTrafficLight)
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
          <p>Lege zuerst Spieler im Spieler-Tab an. Danach erscheinen sie hier automatisch im Check-in.</p>
        </section>
      ) : null}
    </section>
  )
}
