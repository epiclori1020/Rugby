import { AlertTriangle, ClipboardCheck, FileText, Link2, Plus, RefreshCw, ShieldAlert, UserCheck, X } from 'lucide-react'
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
import { deriveAttendanceStatus, getTrafficLightSignals } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ReturnerCapSummary } from '../domain/returners'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { usePlayers } from '../hooks/usePlayers'
import type { AuthSessionState } from '../lib/auth'
import { triggerHapticFeedback } from '../lib/interactionFeedback'
import { applyOptimisticCheckInPatch } from '../lib/optimisticUpdates'
import { measureInteraction } from '../lib/performanceTrace'
import { hasPlayerId } from '../lib/playerId'
import {
  buildPublicCheckInSharePayload,
  copyPublicCheckInLink,
  createPublicCheckInQrCodeDataUrl,
  type PublicCheckInSharePayload,
} from '../lib/publicCheckInShare'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import { PublicCheckInSharePanel } from './PublicCheckInSharePanel'
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
  onStartKiosk: () => void
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

const sessionReactionOptions: Array<{ value: PlayerSessionEntry['sessionReaction']; label: string }> = [
  { value: 'none', label: 'Nein' },
  { value: 'new_or_worse', label: 'Ja, neu/schlechter' },
  { value: 'unsure', label: 'Unsicher' },
]

const lifeFlagOptions = ['Unauffällig', 'Schlecht geschlafen', 'Stress', 'Muskelkater', 'Müde']
const singleResetUndoMs = 5000
const bulkResetConfirmMessage =
  'Coach-Eingaben dieser Einheit zurücksetzen? Self-Check-ins und explizite Nicht-da-Einträge bleiben geschützt.'

const painLocationOptions = [
  'Leiste/Adduktor',
  'Hamstring/Glute',
  'Wade/Achilles',
  'Knie',
  'Sprunggelenk',
  'Schulter/Handgelenk',
  'Kopf/Nacken',
]

function lifeFlagOptionValue(option: string) {
  return option === 'Unauffällig' ? '' : option
}

type NativeShareStatus = 'idle' | 'sharing' | 'shared' | 'aborted' | 'error'
type CopyStatus = 'idle' | 'copied' | 'error'
type QrCodeStatus = 'idle' | 'loading' | 'ready' | 'error'

function entryRenderKey(entry: PlayerSessionEntry) {
  return `${entry.id}:${entry.clientUpdatedAt}:${entry.syncStatus}`
}

function formatTrafficLight(trafficLight: TrafficLight | null) {
  return trafficLight ? trafficLabels[trafficLight] : 'Offen'
}

function formatAttendance(entry: PlayerSessionEntry) {
  const status = deriveAttendanceStatus(entry)

  if (status === 'present') {
    return 'Da'
  }

  if (status === 'absent') {
    return 'Nicht da'
  }

  return 'Offen'
}

function playerInitial(name: string) {
  return name.trim().slice(0, 1).toLocaleUpperCase('de-AT') || '#'
}

function statusTags(entry: PlayerSessionEntry, warning: PlayerWarning | undefined) {
  const tags = [formatAttendance(entry)]
  const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion
  const signals = getTrafficLightSignals(entry)

  if (trafficLight === 'yellow' || trafficLight === 'red') {
    tags.push(formatTrafficLight(trafficLight))
  }

  if (entry.returnerFlag === 'ja') {
    tags.push('Returner')
  } else if (signals.needsReturnerClarification) {
    tags.push('Klärung offen')
  }

  if (warning) {
    tags.push('Warnung')
  }

  if (entry.checkInSource === 'player_link' || entry.checkInSource === 'player_kiosk') {
    tags.push('Self')
  }

  return tags
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
  onReset,
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
  onReset: (entry: PlayerSessionEntry) => Promise<{ ok: true; entry: PlayerSessionEntry } | { ok: false; error: string }>
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
  const resetTimeoutRef = useRef<number | null>(null)
  const [isResetPending, setIsResetPending] = useState(false)
  const controlsDisabled = isSavingDisabled || isResetPending
  const sourceEntryKey = entryRenderKey(entry)
  const displayEntry = localEntryOverride?.baseKey === sourceEntryKey ? localEntryOverride.entry : entry
  const canReset = !displayEntry.id.startsWith('preview:')
  const [textValues, setTextValues] = useState({
    sourceEntryKey,
    lifeValue: displayEntry.lifeFlag,
    painLocationValue: displayEntry.painLocation,
    observationValue: displayEntry.observation,
  })
  const currentTextValues =
    textValues.sourceEntryKey === sourceEntryKey
      ? textValues
      : {
          sourceEntryKey,
          lifeValue: displayEntry.lifeFlag,
          painLocationValue: displayEntry.painLocation,
          observationValue: displayEntry.observation,
        }

  useEffect(() => {
    return () => {
      savingActionRef.current = null
      if (saveFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(saveFeedbackTimeoutRef.current)
      }
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  function clearSaveFeedbackTimer() {
    if (saveFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(saveFeedbackTimeoutRef.current)
      saveFeedbackTimeoutRef.current = null
    }
  }

  function scheduleSaveFeedbackClear() {
    if (typeof window === 'undefined') {
      return
    }

    clearSaveFeedbackTimer()
    saveFeedbackTimeoutRef.current = window.setTimeout(() => {
      setSaveFeedback(null)
      saveFeedbackTimeoutRef.current = null
    }, 1400)
  }

  function clearPendingReset() {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
    savingActionRef.current = null
    setSavingActionKey(null)
    setIsResetPending(false)
  }

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

    scheduleSaveFeedbackClear()
  }

  async function executeResetWithFeedback(entryToReset: PlayerSessionEntry) {
    const previousEntry = displayEntry
    savingActionRef.current = 'reset'
    setSaveFeedback('Setzt zurück...')
    setSavingActionKey('reset')

    try {
      const result = await measureInteraction('check-in:reset', () => onReset(entryToReset))

      if (result.ok) {
        triggerHapticFeedback('success')
        setLocalEntryOverride(result.entry.deletedAt ? null : { baseKey: sourceEntryKey, entry: result.entry })
        setSaveFeedback('Check-in zurückgesetzt')
      } else {
        triggerHapticFeedback('warning')
        setLocalEntryOverride({ baseKey: sourceEntryKey, entry: previousEntry })
        setSaveFeedback('Reset nicht gespeichert')
      }
    } catch {
      triggerHapticFeedback('warning')
      setLocalEntryOverride({ baseKey: sourceEntryKey, entry: previousEntry })
      setSaveFeedback('Reset nicht gespeichert')
    } finally {
      savingActionRef.current = null
      setSavingActionKey(null)
    }

    scheduleSaveFeedbackClear()
  }

  function resetWithFeedback() {
    if (isSavingDisabled || savingActionRef.current === 'reset' || !canReset || isResetPending) {
      return
    }

    triggerHapticFeedback('selection')
    savingActionRef.current = 'reset'
    setSavingActionKey('reset')
    setIsResetPending(true)
    setSaveFeedback(`Reset für ${player.name} wird in 5 Sekunden ausgeführt.`)
    clearSaveFeedbackTimer()
    resetTimeoutRef.current = window.setTimeout(() => {
      resetTimeoutRef.current = null
      setIsResetPending(false)
      void executeResetWithFeedback(displayEntry)
    }, singleResetUndoMs)
  }

  function undoPendingReset() {
    if (!isResetPending) {
      return
    }

    clearPendingReset()
    triggerHapticFeedback('selection')
    setSaveFeedback('Reset abgebrochen')
    scheduleSaveFeedbackClear()
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
        <div className="button-row compact">
          <span className={`sync-pill ${displayEntry.syncStatus}`}>{syncStatusLabel(displayEntry.syncStatus)}</span>
          {canReset ? (
            <button
              className="secondary-action compact-action"
              type="button"
              disabled={controlsDisabled || savingActionKey === 'reset'}
              onClick={() => void resetWithFeedback()}
            >
              {isResetPending ? 'Reset geplant' : 'Zurücksetzen'}
            </button>
          ) : null}
        </div>
      </div>

      <WarningNote warning={warning} />
      <ReturnerCapNote cap={returnerCap} />

      <div className="checkin-controls">
        <div className="control-group">
          <span>Anwesenheit</span>
          <div className="button-row">
            <button
              className={deriveAttendanceStatus(displayEntry) === 'present' ? 'segmented active' : 'segmented'}
              type="button"
              disabled={controlsDisabled || savingActionKey === 'present:true'}
              onClick={() =>
                void saveWithFeedback('Anwesenheit', 'present:true', {
                  present: true,
                  previousWarning: Boolean(warning),
                })
              }
            >
              <UserCheck className="nav-icon" aria-hidden />
              <span>Da</span>
            </button>
            <button
              className={deriveAttendanceStatus(displayEntry) === 'absent' ? 'segmented active' : 'segmented'}
              type="button"
              disabled={controlsDisabled || savingActionKey === 'present:false'}
              onClick={() =>
                void saveWithFeedback('Anwesenheit', 'present:false', {
                  present: false,
                  previousWarning: Boolean(warning),
                })
              }
            >
              Nicht da
            </button>
          </div>
        </div>

        <div className="control-group" aria-label={`Readiness ${player.name}`}>
          <span>Readiness · 1 = schlecht, 5 = bereit</span>
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

        <div className="control-group">
          <span>Schlaf / Stress / Muskelkater</span>
          <div className="button-row">
            {lifeFlagOptions.map((option) => (
              <button
                className={displayEntry.lifeFlag === lifeFlagOptionValue(option) ? 'segmented active' : 'segmented'}
                key={option}
                type="button"
                disabled={controlsDisabled || savingActionKey === `lifeFlag:${option}`}
                onClick={() => {
                  const optionValue = lifeFlagOptionValue(option)
                  setTextValues({ ...currentTextValues, lifeValue: optionValue })
                  void saveWithFeedback('Alltag', `lifeFlag:${option}`, {
                    lifeFlag: optionValue,
                    previousWarning: Boolean(warning),
                  })
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Andere Alltagsnotiz</span>
          <input
            value={currentTextValues.lifeValue}
            disabled={controlsDisabled}
            placeholder="Schlaf, Stress, Muskelkater"
            onChange={(event) => setTextValues({ ...currentTextValues, lifeValue: event.currentTarget.value })}
            onBlur={(event) =>
              void saveWithFeedback('Eingabe', 'lifeFlag', {
                lifeFlag: event.currentTarget.value,
                previousWarning: Boolean(warning),
              })
            }
          />
        </label>

        <div className="control-group" aria-label={`Schmerz ${player.name}`}>
          <span>Schmerz heute</span>
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

        <div className="control-group">
          <span>Schmerzort / Körperregion</span>
          <div className="button-row">
            {painLocationOptions.map((option) => (
              <button
                className={displayEntry.painLocation === option ? 'segmented active' : 'segmented'}
                  key={option}
                  type="button"
                  disabled={controlsDisabled || savingActionKey === `painLocation:${option}`}
                  onClick={() => {
                  setTextValues({ ...currentTextValues, painLocationValue: option })
                  void saveWithFeedback('Schmerzort', `painLocation:${option}`, {
                    painLocation: option,
                    previousWarning: Boolean(warning),
                  })
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Anderer Schmerzort</span>
          <input
            value={currentTextValues.painLocationValue}
            disabled={controlsDisabled}
            placeholder="z. B. Wade rechts"
            onChange={(event) => setTextValues({ ...currentTextValues, painLocationValue: event.currentTarget.value })}
            onBlur={(event) =>
              void saveWithFeedback('Eingabe', 'painLocation', {
                painLocation: event.currentTarget.value,
                previousWarning: Boolean(warning),
              })
            }
          />
        </label>

        <div className="control-group">
          <span>Seit letzter Einheit neu oder schlechter?</span>
          <div className="button-row">
            {sessionReactionOptions.map((option) => (
              <button
                className={displayEntry.sessionReaction === option.value ? 'segmented active' : 'segmented'}
                key={option.value}
                type="button"
                disabled={controlsDisabled || savingActionKey === `sessionReaction:${option.value}`}
                onClick={() =>
                  void saveWithFeedback('Reaktion', `sessionReaction:${option.value}`, {
                    sessionReaction: option.value,
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
          <span>Returner-Status</span>
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
          <span>Red Flags</span>
          <div className="button-row">
            {redFlagOptions.map((option) => {
              const isActiveDanger = option.value !== 'none' && displayEntry.redFlag === option.value
              const isActiveNeutral = option.value === 'none' && displayEntry.redFlag === 'none'

              return (
                <button
                  className={isActiveDanger ? 'segmented active danger' : isActiveNeutral ? 'segmented active neutral' : 'segmented'}
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
            Auto-Ampel: <strong>{formatTrafficLight(displayEntry.trafficLightSuggestion)}</strong>
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
            value={currentTextValues.observationValue}
            disabled={controlsDisabled}
            rows={2}
            placeholder="z. B. Hinken, Leiste 3/10, Technik auffaellig"
            onChange={(event) => setTextValues({ ...currentTextValues, observationValue: event.currentTarget.value })}
            onBlur={(event) =>
              void saveWithFeedback('Notiz', 'observation', {
                observation: event.currentTarget.value,
                previousWarning: Boolean(warning),
              })
            }
          />
        </label>
      </div>
      <div className={saveFeedback ? 'action-feedback visible' : 'action-feedback'} aria-live="polite">
        {saveFeedback ? <span>{saveFeedback}</span> : null}
        {isResetPending ? (
          <button className="secondary-action compact-action" type="button" onClick={undoPendingReset}>
            Rückgängig
          </button>
        ) : null}
      </div>
    </article>
  )
}

function CompactCheckInPlayerRow({
  entry,
  isExpected,
  onSelect,
  player,
  warning,
}: {
  entry: PlayerSessionEntry
  isExpected: boolean
  onSelect: () => void
  player: Player
  warning: PlayerWarning | undefined
}) {
  const tags = statusTags(entry, warning)
  const trafficLight = entry.trafficLight ?? entry.trafficLightSuggestion ?? 'open'

  return (
    <button className={`checkin-player-card traffic-${trafficLight}`} type="button" onClick={onSelect}>
      <span className="player-avatar placeholder-avatar">{playerInitial(player.name)}</span>
      <span className="checkin-player-card-main">
        <strong>{player.name}</strong>
        <small>{player.position} · {player.cluster}{isExpected ? ' · zuletzt dabei' : ''}</small>
      </span>
      <span className="checkin-player-card-tags">
        {tags.map((tag) => (
          <span className="tag compact" key={tag}>{tag}</span>
        ))}
      </span>
    </button>
  )
}

export function CheckInView({
  authState,
  checkInActions,
  onNavigate,
  onSessionChange,
  onStartKiosk,
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
    observations,
    warnings,
    syncOverview,
    isLoading,
    runSync,
    saveEntry,
    resetEntry,
    resetSessionCoachEntries,
    getEntryForPlayer,
    clearError,
  } = checkInActions
  const showSyncAttention = shouldShowSyncAttention(syncOverview)
  const [createdSharePayload, setCreatedSharePayload] = useState<PublicCheckInSharePayload | null>(null)
  const [createdShareSessionId, setCreatedShareSessionId] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [qrCodeStatus, setQrCodeStatus] = useState<QrCodeStatus>('idle')
  const [nativeShareStatus, setNativeShareStatus] = useState<NativeShareStatus>('idle')
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'present' | 'issues' | 'returner' | 'clarify' | 'warning'>('all')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [resetFeedback, setResetFeedback] = useState<string | null>(null)
  const selectedSheetRef = useRef<HTMLDivElement | null>(null)
  const returnerCapByPlayerId = new Map(returnerCaps.filter(hasPlayerId).map((cap) => [cap.playerId, cap]))
  const expectedPlayerSet = new Set(expectedPlayerIds)
  const activePlayerIdSet = new Set(activePlayers.map((player) => player.id))
  const activeEntries = entries.filter((entry) => hasPlayerId(entry) && activePlayerIdSet.has(entry.playerId))
  const activeWarnings = warnings.filter((warning) => hasPlayerId(warning) && activePlayerIdSet.has(warning.playerId))
  const activeObservations = observations.filter(
    (observation) => hasPlayerId(observation) && activePlayerIdSet.has(observation.playerId),
  )
  const warningByPlayerId = new Map(activeWarnings.map((warning) => [warning.playerId, warning]))
  const orderedPlayers = [...activePlayers].sort((a, b) => {
    const aExpected = expectedPlayerSet.has(a.id)
    const bExpected = expectedPlayerSet.has(b.id)

    if (aExpected === bExpected) {
      return a.name.localeCompare(b.name, 'de-AT')
    }

    return aExpected ? -1 : 1
  })
  const playerRows = orderedPlayers.map((player) => ({
    player,
    entry: getEntryForPlayer(player),
    warning: warningByPlayerId.get(player.id),
  }))
  const checkedInCount = playerRows.filter(({ entry }) => deriveAttendanceStatus(entry) === 'present').length
  const absentCount = playerRows.filter(({ entry }) => deriveAttendanceStatus(entry) === 'absent').length
  const openCount = Math.max(activePlayers.length - checkedInCount - absentCount, 0)
  const yellowCount = activeEntries.filter((entry) => entry.trafficLight === 'yellow').length
  const redCount = activeEntries.filter((entry) => entry.trafficLight === 'red').length
  const returnerCount = activeEntries.filter((entry) => entry.returnerFlag === 'ja').length
  const returnerClarificationCount = activeEntries.filter((entry) => getTrafficLightSignals(entry).needsReturnerClarification).length
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('de-AT')
  const filteredPlayerRows = playerRows.filter(({ entry, player, warning }) => {
    if (normalizedSearch && !player.name.toLocaleLowerCase('de-AT').includes(normalizedSearch)) {
      return false
    }

    if (activeFilter === 'open') {
      return deriveAttendanceStatus(entry) === 'open'
    }

    if (activeFilter === 'present') {
      return deriveAttendanceStatus(entry) === 'present'
    }

    if (activeFilter === 'issues') {
      return entry.trafficLight === 'yellow' || entry.trafficLight === 'red'
    }

    if (activeFilter === 'returner') {
      return entry.returnerFlag === 'ja'
    }

    if (activeFilter === 'clarify') {
      return getTrafficLightSignals(entry).needsReturnerClarification
    }

    if (activeFilter === 'warning') {
      return Boolean(warning)
    }

    return true
  })
  const groupedPlayerRows = (() => {
    const groups = new Map<string, typeof filteredPlayerRows>()
    for (const row of filteredPlayerRows) {
      const initial = playerInitial(row.player.name)
      groups.set(initial, [...(groups.get(initial) ?? []), row])
    }

    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'de-AT'))
  })()
  const selectedPlayer = selectedPlayerId ? activePlayers.find((player) => player.id === selectedPlayerId) ?? null : null
  const selectedSheetHeadingId = selectedPlayer ? `checkin-sheet-heading-${selectedPlayer.id}` : undefined
  const activePublicLink = checkInActions.publicCheckInLinks.find((link) => !link.closedAt)
  const selectedSessionSharePayload = createdShareSessionId === selectedSessionId ? createdSharePayload : null
  const selectedSessionQrCodeDataUrl = createdShareSessionId === selectedSessionId ? qrCodeDataUrl : null
  const selectedSessionQrCodeStatus = createdShareSessionId === selectedSessionId ? qrCodeStatus : 'idle'
  const publicSubmissionCounts = checkInActions.publicCheckInSubmissions.reduce(
    (counts, submission) => {
      counts[submission.status] += 1
      return counts
    },
    { pending: 0, imported: 0, conflict: 0, superseded: 0 },
  )
  const canNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (!selectedSessionSharePayload ||
      typeof navigator.canShare !== 'function' ||
      navigator.canShare(selectedSessionSharePayload))

  useEffect(() => {
    if (!selectedPlayerId) {
      return undefined
    }

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    selectedSheetRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedPlayerId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [selectedPlayerId])

  function clearTransientShareState() {
    setCreatedSharePayload(null)
    setCreatedShareSessionId(null)
    setQrCodeDataUrl(null)
    setQrCodeStatus('idle')
    setNativeShareStatus('idle')
    setCopyStatus('idle')
  }

  function handleSessionChange(sessionId: string) {
    clearTransientShareState()
    onSessionChange(sessionId)
  }

  async function handleCreatePublicLink() {
    const createdLink = await checkInActions.createPublicLink()
    if (!createdLink) {
      return
    }

    const sharePayload = buildPublicCheckInSharePayload({
      sessionDate: selectedSession.date,
      sessionTitle: selectedSession.title,
      url: createdLink.url,
    })
    setCreatedSharePayload(sharePayload)
    setCreatedShareSessionId(selectedSessionId)
    setQrCodeDataUrl(null)
    setQrCodeStatus('loading')
    setNativeShareStatus('idle')
    setCopyStatus('idle')

    try {
      setQrCodeDataUrl(await createPublicCheckInQrCodeDataUrl(createdLink.url))
      setQrCodeStatus('ready')
    } catch {
      setQrCodeDataUrl(null)
      setQrCodeStatus('error')
    }
  }

  async function handleNativeShare() {
    if (!selectedSessionSharePayload || !canNativeShare) {
      return
    }

    setNativeShareStatus('sharing')
    setCopyStatus('idle')

    try {
      await navigator.share(selectedSessionSharePayload)
      setNativeShareStatus('shared')
    } catch (caughtError) {
      if (caughtError && typeof caughtError === 'object' && 'name' in caughtError && caughtError.name === 'AbortError') {
        setNativeShareStatus('aborted')
        return
      }

      setNativeShareStatus('error')
    }
  }

  async function handleCopyShareLink() {
    if (!selectedSessionSharePayload) {
      return
    }

    setCopyStatus('idle')

    try {
      await copyPublicCheckInLink(selectedSessionSharePayload.url)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  async function handleClosePublicLink() {
    if (!activePublicLink) {
      return
    }

    clearTransientShareState()
    await checkInActions.closePublicLink(activePublicLink.id)
  }

  async function handleResetCoachEntries() {
    if (!window.confirm(bulkResetConfirmMessage)) {
      return
    }

    const result = await resetSessionCoachEntries()

    if (result.ok) {
      setResetFeedback(
        result.resetCount > 0
          ? `${result.resetCount} Check-in-Einträge zurückgesetzt.`
          : 'Keine zurücksetzbaren Check-ins für diese Einheit.',
      )
    } else {
      setResetFeedback(result.error)
    }
  }

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <section className="placeholder" aria-labelledby="checkin-locked-heading">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <h2 id="checkin-locked-heading">Pre-Session Check-in</h2>
          <p>Check-in-Daten werden erst nach Coach-Login in Einstellungen lokal gespeichert und synchronisiert.</p>
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
            onSessionChange={handleSessionChange}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
          {syncOverview.status === 'error' ? (
            <button className="secondary-action" type="button" onClick={runSync} disabled={isLoading}>
              <RefreshCw className="nav-icon" aria-hidden />
              <span>{isLoading ? 'Sync laeuft...' : 'Retry'}</span>
            </button>
          ) : null}
          <button className="secondary-action" type="button" onClick={() => onNavigate('spieler')}>
            <UserCheck className="nav-icon" aria-hidden />
            <span>Spieler verwalten</span>
          </button>
          <button className="secondary-action" type="button" onClick={onStartKiosk} disabled={activePlayers.length === 0}>
            <ClipboardCheck className="nav-icon" aria-hidden />
            <span>Kiosk starten</span>
          </button>
        </div>
      </div>

      <div className="metric-grid checkin-metrics">
        <div className="metric">
          <span>Aktive Spieler</span>
          <strong>{activePlayers.length}</strong>
        </div>
        <div className="metric">
          <span>Da / offen</span>
          <strong>{checkedInCount} / {openCount}</strong>
        </div>
        <div className="metric">
          <span>Gelb / Rot</span>
          <strong>{yellowCount} / {redCount}</strong>
        </div>
        <div className="metric">
          <span>Returner / Klärung</span>
          <strong>{returnerCount} / {returnerClarificationCount}</strong>
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

      {showSyncAttention ? (
        <div className="panel checkin-sync-strip">
          <span className={`status-dot ${syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
          <strong>{syncStatusLabel(syncOverview.status)}</strong>
          <span>{pendingCountLabel(syncOverview.pendingCount, 'Check-in-Änderungen')}</span>
          {syncOverview.errorMessage ? <span>{syncOverview.errorMessage}</span> : null}
        </div>
      ) : null}

      <section className="panel checkin-reset-panel" aria-label="Check-in zurücksetzen">
        <div>
          <h3>Reset</h3>
          <p className="sync-help">
            Setzt Coach-Eingaben dieser Einheit zurück. Spieler-Self-Check-ins bleiben erhalten; bewusst gesetzte
            Nicht-da-Einträge bleiben im Massen-Reset bestehen.
          </p>
        </div>
        <button
          className="secondary-action"
          type="button"
          onClick={() => void handleResetCoachEntries()}
          disabled={!checkInActions.sessionLogId}
        >
          Coach-Check-ins zurücksetzen
        </button>
        {resetFeedback ? <p className="action-feedback visible">{resetFeedback}</p> : null}
      </section>

      <section className="panel public-checkin-coach-panel" aria-label="Check-in-Link teilen">
        <div className="status-line">
          <Link2 className="nav-icon" aria-hidden />
          <div>
            <h3>Check-in-Link teilen</h3>
            <p>
              Erstellt einen privaten Link fuer diese Einheit. Spieler sehen Namensauswahl und eigenes Formular.
            </p>
          </div>
        </div>
        <div className="button-row">
          <button
            className="primary-action"
            data-testid="public-checkin-create-link"
            type="button"
            onClick={() => void handleCreatePublicLink()}
            disabled={isLoading}
          >
            <Plus className="nav-icon" aria-hidden />
            <span>{activePublicLink ? 'Neuen Link erstellen' : 'Link erstellen'}</span>
          </button>
          {activePublicLink ? (
            <button
              className="secondary-action"
              data-testid="public-checkin-close-link"
              type="button"
              onClick={() => void handleClosePublicLink()}
            >
              <X className="nav-icon" aria-hidden />
              <span>Link schliessen</span>
            </button>
          ) : null}
        </div>
        {selectedSessionSharePayload ? (
          <PublicCheckInSharePanel
            canNativeShare={canNativeShare}
            copyStatus={copyStatus}
            nativeShareStatus={nativeShareStatus}
            onClose={clearTransientShareState}
            onCopy={() => void handleCopyShareLink()}
            onNativeShare={() => void handleNativeShare()}
            payload={selectedSessionSharePayload}
            qrCodeDataUrl={selectedSessionQrCodeDataUrl}
            qrCodeStatus={selectedSessionQrCodeStatus}
          />
        ) : null}
        <p className="sync-help">
          {activePublicLink
            ? `Link aktiv bis ${new Date(activePublicLink.expiresAt).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}. Aus Sicherheitsgründen kann ein bestehender Link nachträglich nicht erneut angezeigt werden.`
            : 'Noch kein aktiver Link fuer diese Einheit lokal sichtbar.'}
          {checkInActions.publicCheckInSubmissions.length > 0
            ? ` Eingaenge: ${publicSubmissionCounts.pending} offen, ${publicSubmissionCounts.imported} uebernommen, ${publicSubmissionCounts.conflict} Konflikte.`
            : ''}
          {checkInActions.publicCheckInNotice ? ` ${checkInActions.publicCheckInNotice}` : ''}
          {selectedSessionSharePayload ? ' Link erstellt. Teile ihn oben oder lasse den QR-Code scannen.' : ''}
        </p>
      </section>

      {activeWarnings.length > 0 ? (
        <aside className="panel warning-panel" aria-label="Offene Warnungen">
          <div className="status-line">
            <ShieldAlert className="nav-icon" aria-hidden />
            <h3>Offene Warnungen</h3>
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

      {activeObservations.length > 0 ? (
        <aside className="panel" aria-label="Notizen aus letzter Einheit">
          <div className="status-line">
            <FileText className="nav-icon" aria-hidden />
            <h3>Notizen aus letzter Einheit</h3>
          </div>
          <div className="warning-list">
            {activeObservations.map((observation) => {
              const player = playerActions.players.find((item) => item.id === observation.playerId)
              return (
                <div className="warning-note" key={`${observation.playerId}-${observation.sessionDate}`}>
                  <FileText className="nav-icon" aria-hidden />
                  <span>
                    <strong>{player?.name ?? 'Spieler'}</strong>: {observation.observation}
                  </span>
                </div>
              )
            })}
          </div>
        </aside>
      ) : null}

      {activePlayers.length > 0 ? (
        <section className="panel checkin-finder" aria-label="Spieler finden">
          <div className="checkin-finder-head">
            <label className="inline-field wide">
              <span>Name suchen</span>
              <input
                value={searchTerm}
                placeholder="Spielername"
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
              />
            </label>
            <div className="button-row compact">
              {[
                ['all', 'Alle'],
                ['open', 'Offen'],
                ['present', 'Da'],
                ['issues', 'Gelb/Rot'],
                ['returner', 'Returner'],
                ['clarify', 'Klärung offen'],
                ['warning', 'Warnung'],
              ].map(([value, label]) => (
                <button
                  className={activeFilter === value ? 'filter-chip active' : 'filter-chip'}
                  key={value}
                  type="button"
                  onClick={() => setActiveFilter(value as typeof activeFilter)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="checkin-player-groups">
            {groupedPlayerRows.map(([initial, rows]) => (
              <div className="checkin-player-group" key={initial}>
                <h4>{initial}</h4>
                <div className="checkin-player-grid">
                  {rows.map(({ entry, player, warning }) => (
                    <CompactCheckInPlayerRow
                      entry={entry}
                      isExpected={expectedPlayerSet.has(player.id)}
                      key={player.id}
                      onSelect={() => setSelectedPlayerId(player.id)}
                      player={player}
                      warning={warning}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {filteredPlayerRows.length === 0 ? <p className="sync-help">Keine Spieler für diesen Filter.</p> : null}
        </section>
      ) : null}

      {selectedPlayer ? (
        <section className="checkin-sheet-backdrop" aria-label={`Check-in ${selectedPlayer.name}`}>
          <div
            className="checkin-sheet"
            ref={selectedSheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={selectedSheetHeadingId}
            tabIndex={-1}
          >
            <div className="sheet-heading">
              <div>
                <p className="eyebrow">Spieler-Check-in</p>
                <h3 id={selectedSheetHeadingId}>{selectedPlayer.name}</h3>
              </div>
              <button className="secondary-action compact-action" type="button" onClick={() => setSelectedPlayerId(null)}>
                Schliessen
              </button>
            </div>
            <CheckInPlayerRow
              entry={getEntryForPlayer(selectedPlayer)}
              isExpected={expectedPlayerSet.has(selectedPlayer.id)}
              isSavingDisabled={false}
              key={selectedPlayer.id}
              onSave={(selectedPlayer, patch, manualTrafficLight) => {
                return saveEntry(selectedPlayer, patch, manualTrafficLight)
              }}
              onReset={(entry) => resetEntry(entry.id)}
              player={selectedPlayer}
              returnerCap={returnerCapByPlayerId.get(selectedPlayer.id)}
              warning={warningByPlayerId.get(selectedPlayer.id)}
            />
          </div>
        </section>
      ) : null}

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
