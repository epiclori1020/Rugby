import { AlertTriangle, ClipboardCheck, RefreshCw, ShieldAlert, UserCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { HubTab } from '../App'
import type { SessionDefinition } from '../content/types'
import type {
  CheckInEntryPatch,
  PlayerSessionEntry,
  PlayerWarning,
  RedFlag,
  ReturnerFlag,
  TrafficLight,
} from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ReturnerCapSummary } from '../domain/returners'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { usePlayers } from '../hooks/usePlayers'
import type { AuthSessionState } from '../lib/auth'
import { triggerHapticFeedback } from '../lib/interactionFeedback'
import { applyOptimisticCheckInPatch } from '../lib/optimisticUpdates'
import { measureInteraction } from '../lib/performanceTrace'
import { hasPlayerId } from '../lib/playerId'
import { pendingCountLabel, syncStatusLabel } from '../lib/syncLabels'
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

function entryRenderKey(entry: PlayerSessionEntry) {
  return `${entry.id}:${entry.clientUpdatedAt}:${entry.syncStatus}`
}

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
  onSave: (
    player: Player,
    patch: CheckInEntryPatch,
    manualTrafficLight?: TrafficLight | 'auto',
  ) => Promise<{ ok: true; entry: PlayerSessionEntry } | { ok: false; error: string }>
  player: Player
  returnerCap: ReturnerCapSummary | undefined
  warning: PlayerWarning | undefined
}) {
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
  const [savingActionKey, setSavingActionKey] = useState<string | null>(null)
  const [localEntryOverride, setLocalEntryOverride] = useState<{ baseKey: string; entry: PlayerSessionEntry } | null>(
    null,
  )
  const savingActionRef = useRef<string | null>(null)
  const saveFeedbackTimeoutRef = useRef<number | null>(null)
  const controlsDisabled = isSavingDisabled
  const sourceEntryKey = entryRenderKey(entry)
  const displayEntry = localEntryOverride?.baseKey === sourceEntryKey ? localEntryOverride.entry : entry

  useEffect(() => {
    return () => {
      savingActionRef.current = null
      if (saveFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(saveFeedbackTimeoutRef.current)
      }
    }
  }, [])

  async function saveWithFeedback(
    label: string,
    actionKey: string,
    patch: CheckInEntryPatch,
    manualTrafficLight?: TrafficLight | 'auto',
  ) {
    if (isSavingDisabled || savingActionRef.current === actionKey) {
      return
    }

    const previousEntry = displayEntry
    const optimisticEntry = applyOptimisticCheckInPatch(displayEntry, patch, manualTrafficLight)
    savingActionRef.current = actionKey
    triggerHapticFeedback('selection')
    setLocalEntryOverride({ baseKey: sourceEntryKey, entry: optimisticEntry })
    setSaveFeedback('Speichert...')
    setSavingActionKey(actionKey)

    try {
      const result = await measureInteraction(`check-in:${actionKey}`, () => onSave(player, patch, manualTrafficLight))

      if (result.ok) {
        triggerHapticFeedback('success')
        setLocalEntryOverride({ baseKey: sourceEntryKey, entry: result.entry })
        setSaveFeedback(`${label} gespeichert`)
      } else {
        triggerHapticFeedback('warning')
        setLocalEntryOverride({ baseKey: sourceEntryKey, entry: previousEntry })
        setSaveFeedback(`${label} nicht gespeichert`)
      }
    } catch {
      triggerHapticFeedback('warning')
      setLocalEntryOverride({ baseKey: sourceEntryKey, entry: previousEntry })
      setSaveFeedback(`${label} nicht gespeichert`)
    } finally {
      savingActionRef.current = null
      setSavingActionKey(null)
    }

    if (typeof window !== 'undefined') {
      if (saveFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(saveFeedbackTimeoutRef.current)
      }
      saveFeedbackTimeoutRef.current = window.setTimeout(() => {
        setSaveFeedback(null)
        saveFeedbackTimeoutRef.current = null
      }, 1400)
    }
  }

  return (
    <article className={`checkin-row traffic-${displayEntry.trafficLight ?? displayEntry.trafficLightSuggestion ?? 'open'}`}>
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {isExpected ? <span className="tag compact">Zuletzt dabei</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${displayEntry.syncStatus}`}>{syncStatusLabel(displayEntry.syncStatus)}</span>
      </div>

      <WarningNote warning={warning} />
      <ReturnerCapNote cap={returnerCap} />

      <div className="checkin-controls">
        <button
          className={displayEntry.present ? 'segmented active' : 'segmented'}
          type="button"
          disabled={controlsDisabled || savingActionKey === 'present'}
          onClick={() =>
            void saveWithFeedback('Anwesenheit', 'present', {
              present: !displayEntry.present,
              previousWarning: Boolean(warning),
            })
          }
        >
          <UserCheck className="nav-icon" aria-hidden />
          <span>{displayEntry.present ? 'Anwesend' : 'Abwesend'}</span>
        </button>

        <div className="control-group" aria-label={`Readiness ${player.name}`}>
          <span>Readiness</span>
          <div className="button-row compact">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                className={displayEntry.readiness === value ? 'number-chip active' : 'number-chip'}
                key={value}
                type="button"
                disabled={controlsDisabled || savingActionKey === `readiness:${value}`}
                onClick={() =>
                  void saveWithFeedback('Readiness', `readiness:${value}`, { readiness: value, previousWarning: Boolean(warning) })
                }
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Life</span>
          <input
            defaultValue={displayEntry.lifeFlag}
            disabled={controlsDisabled}
            placeholder="Schlaf, Stress, Muskelkater"
            onBlur={(event) =>
              void saveWithFeedback('Eingabe', 'lifeFlag', {
                lifeFlag: event.currentTarget.value,
                previousWarning: Boolean(warning),
              })
            }
          />
        </label>

        <div className="control-group" aria-label={`Schmerz ${player.name}`}>
          <span>Schmerz</span>
          <div className="button-row compact pain-scale">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                className={displayEntry.painScore === value ? 'number-chip active' : 'number-chip'}
                key={value}
                type="button"
                disabled={controlsDisabled || savingActionKey === `pain:${value}`}
                onClick={() =>
                  void saveWithFeedback('Schmerz', `pain:${value}`, { painScore: value, previousWarning: Boolean(warning) })
                }
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Ort</span>
          <input
            defaultValue={displayEntry.painLocation}
            disabled={controlsDisabled}
            placeholder="z. B. Wade rechts"
            onBlur={(event) =>
              void saveWithFeedback('Eingabe', 'painLocation', {
                painLocation: event.currentTarget.value,
                previousWarning: Boolean(warning),
              })
            }
          />
        </label>

        <div className="control-group">
          <span>Returner</span>
          <div className="button-row">
            {returnerOptions.map((option) => (
              <button
                className={displayEntry.returnerFlag === option.value ? 'segmented active' : 'segmented'}
                key={option.value}
                type="button"
                disabled={controlsDisabled || savingActionKey === `returner:${option.value}`}
                onClick={() =>
                  void saveWithFeedback('Returner', `returner:${option.value}`, {
                    returnerFlag: option.value,
                    previousWarning: Boolean(warning),
                  })
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
            {redFlagOptions.map((option) => {
              const isActiveDanger = option.value !== 'none' && displayEntry.redFlag === option.value

              return (
                <button
                  className={isActiveDanger ? 'segmented active danger' : 'segmented'}
                  key={option.value}
                  type="button"
                  disabled={controlsDisabled || savingActionKey === `safety:${option.value}`}
                  onClick={() =>
                    void saveWithFeedback('Safety', `safety:${option.value}`, {
                      redFlag: option.value,
                      previousWarning: Boolean(warning),
                    })
                  }
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <label className="toggle-row checkin-toggle">
          <input
            type="checkbox"
            checked={displayEntry.movementConcern}
            disabled={controlsDisabled}
            onChange={(event) =>
              void saveWithFeedback('Bewegung', 'movementConcern', {
                movementConcern: event.currentTarget.checked,
                previousWarning: Boolean(warning),
              })
            }
          />
          <span>Auffaelliges Laufbild / Bewegung</span>
        </label>

        <div className="traffic-control">
          <span>
            Vorschlag: <strong>{formatTrafficLight(displayEntry.trafficLightSuggestion)}</strong>
            {displayEntry.trafficLightWasManual ? ' · Coach korrigiert' : ''}
          </span>
          <div className="button-row">
            {(['green', 'yellow', 'red'] as TrafficLight[]).map((trafficLight) => {
              const isManualSelection = displayEntry.trafficLightWasManual && displayEntry.trafficLight === trafficLight

              return (
                <button
                  className={isManualSelection ? `traffic-chip ${trafficLight} active` : `traffic-chip ${trafficLight}`}
                  key={trafficLight}
                  type="button"
                  disabled={controlsDisabled || savingActionKey === `traffic:${trafficLight}`}
                  onClick={() =>
                    void saveWithFeedback('Ampel', `traffic:${trafficLight}`, { previousWarning: Boolean(warning) }, trafficLight)
                  }
                >
                  {trafficLabels[trafficLight]}
                </button>
              )
            })}
            {displayEntry.trafficLightWasManual ? (
              <button
                className="secondary-action compact-action traffic-auto-reset"
                type="button"
                disabled={controlsDisabled || savingActionKey === 'traffic:auto'}
                title="Coach-Korrektur verwerfen und automatischen Vorschlag wieder aktivieren"
                onClick={() => void saveWithFeedback('Ampel', 'traffic:auto', { previousWarning: Boolean(warning) }, 'auto')}
              >
                Automatisch
              </button>
            ) : null}
          </div>
        </div>

        <label className="inline-field wide">
          <span>Notiz, keine Diagnose</span>
          <textarea
            defaultValue={displayEntry.observation}
            disabled={controlsDisabled}
            rows={2}
            placeholder="z. B. Hinken, Leiste 3/10, Technik auffaellig"
            onBlur={(event) =>
              void saveWithFeedback('Notiz', 'observation', {
                observation: event.currentTarget.value,
                previousWarning: Boolean(warning),
              })
            }
          />
        </label>
      </div>
      <p className={saveFeedback ? 'action-feedback visible' : 'action-feedback'} aria-live="polite">
        {saveFeedback ?? ''}
      </p>
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
  const returnerCapByPlayerId = new Map(returnerCaps.filter(hasPlayerId).map((cap) => [cap.playerId, cap]))
  const expectedPlayerSet = new Set(expectedPlayerIds)
  const activePlayerIdSet = new Set(activePlayers.map((player) => player.id))
  const activeEntries = entries.filter((entry) => hasPlayerId(entry) && activePlayerIdSet.has(entry.playerId))
  const activeWarnings = warnings.filter((warning) => hasPlayerId(warning) && activePlayerIdSet.has(warning.playerId))
  const warningByPlayerId = new Map(activeWarnings.map((warning) => [warning.playerId, warning]))
  const orderedPlayers = [...activePlayers].sort((a, b) => {
    const aExpected = expectedPlayerSet.has(a.id)
    const bExpected = expectedPlayerSet.has(b.id)

    if (aExpected === bExpected) {
      return a.name.localeCompare(b.name, 'de-AT')
    }

    return aExpected ? -1 : 1
  })
  const checkedInCount = activeEntries.filter((entry) => entry.present).length
  const yellowCount = activeEntries.filter((entry) => entry.trafficLight === 'yellow').length
  const redCount = activeEntries.filter((entry) => entry.trafficLight === 'red').length
  const returnerCount = activeEntries.filter((entry) => entry.returnerFlag !== 'nein').length

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
          <p className="eyebrow">Vor dem Training</p>
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
        <strong>{syncStatusLabel(syncOverview.status)}</strong>
        <span>{pendingCountLabel(syncOverview.pendingCount, 'Check-in-Aenderungen')}</span>
        {syncOverview.errorMessage ? <span>{syncOverview.errorMessage}</span> : null}
      </div>

      {activeWarnings.length > 0 ? (
        <aside className="panel warning-panel" aria-label="Offene Warnungen">
          <div className="status-line">
            <ShieldAlert className="nav-icon" aria-hidden />
            <h3>Offene Warnungen aus letzter Einheit</h3>
          </div>
          <div className="warning-list">
            {activeWarnings.map((warning) => {
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
              return saveEntry(selectedPlayer, patch, manualTrafficLight)
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
