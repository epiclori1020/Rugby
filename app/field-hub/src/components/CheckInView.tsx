import { ClipboardCheck, FileText, Link2, Plus, RefreshCw, Settings, ShieldAlert, UserCheck, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { routes, type AppRoute } from '../navigation'
import type { SessionDefinition } from '../content/types'
import type {
  CheckInEntryPatch,
  PlayerSessionEntry,
  PlayerWarning,
  RedFlag,
  ReturnerFlag,
  TrafficLight,
} from '../domain/checkIn'
import {
  deriveAttendanceStatus,
  deriveRedFlagFromPainLocation,
  getTrafficLightSignals,
  hasMeaningfulCheckIn,
  hasPostSessionData,
  joinCheckInTextList,
  mergeRedFlags,
  splitCheckInTextList,
  toggleCheckInTextListValue,
} from '../domain/checkIn'
import {
  buildCheckInGuidance,
  type CheckInGuidanceItem,
  type CheckInGuidanceLevel,
} from '../domain/checkInWarningGuidance'
import { playerToFormValues, type Player, type PlayerFormValues } from '../domain/players'
import type { ReturnerCapSummary } from '../domain/returners'
import type { useCheckIns } from '../hooks/useCheckIns'
import type { usePlayers } from '../hooks/usePlayers'
import type { AuthSessionState } from '../lib/auth'
import {
  actionFeedbackForFailure,
  actionFeedbackForSave,
  triggerHapticFeedback,
  type ActionFeedbackTone,
} from '../lib/interactionFeedback'
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
import { PlayerEditorForm } from './PlayerEditorForm'
import { SessionPicker } from './SessionPicker'
import { AthleteRow } from './onfield'
import { PrimaryButton, SecondaryButton, Skeleton, StatusChip, TrafficLightChip, type StatusTone } from './ui'

type CheckInActions = ReturnType<typeof useCheckIns>
type PlayerActions = ReturnType<typeof usePlayers>

type CheckInViewProps = {
  authState: AuthSessionState
  checkInActions: CheckInActions
  initialSelectedPlayerId?: string | null
  playerActions: PlayerActions
  returnerCaps: ReturnerCapSummary[]
  onNavigate: (route: AppRoute) => void
  onOpenReturner?: (playerId: string) => void
  onSessionChange: (sessionId: string) => void
  onStartKiosk: () => void
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
  showSessionPicker?: boolean
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

const painLocationOptions = [
  'Kopf/Nacken',
  'Schulter',
  'Ellbogen',
  'Handgelenk/Hand',
  'Rippen/Brustkorb',
  'Rücken/LWS',
  'Hüfte/Hüftbeuger',
  'Leiste/Adduktor',
  'Hamstring/Glute',
  'Quadrizeps/vorderer Oberschenkel',
  'Knie',
  'Wade/Achilles',
  'Sprunggelenk',
  'Fuß/Zehen',
  'Sonstiges',
]

const painLocationOptionByKey = new Map(painLocationOptions.map((option) => [option.toLocaleLowerCase('de-AT'), option]))

function lifeFlagOptionValue(option: string) {
  return option === 'Unauffällig' ? '' : option
}

function splitPainLocationParts(value: string) {
  const knownValues: string[] = []
  const customValues: string[] = []

  for (const item of splitCheckInTextList(value)) {
    const knownValue = painLocationOptionByKey.get(item.toLocaleLowerCase('de-AT'))
    if (knownValue) {
      knownValues.push(knownValue)
    } else {
      customValues.push(item)
    }
  }

  return {
    knownValue: joinCheckInTextList(knownValues),
    customValue: joinCheckInTextList(customValues),
  }
}

function joinPainLocationParts(knownValue: string, customValue: string) {
  return joinCheckInTextList([...splitCheckInTextList(knownValue), ...splitCheckInTextList(customValue)])
}

type NativeShareStatus = 'idle' | 'sharing' | 'shared' | 'aborted' | 'error'
type CopyStatus = 'idle' | 'copied' | 'error'
type QrCodeStatus = 'idle' | 'loading' | 'ready' | 'error'

const guidanceLevelLabels: Record<CheckInGuidanceLevel, string> = {
  check_today: 'Heute prüfen',
  recommended_limit: 'Einschränkung empfohlen',
  adjust_load: 'Belastung anpassen',
  decision_open: 'Entscheidung offen',
  info: 'Info',
}

const guidanceLevelPriority: Record<CheckInGuidanceLevel, number> = {
  check_today: 0,
  recommended_limit: 1,
  adjust_load: 1,
  decision_open: 2,
  info: 3,
}

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

type RosterStatusTag = {
  label: string
  tone: StatusTone
}

function statusTags(
  entry: PlayerSessionEntry,
  warning: PlayerWarning | undefined,
  returnerCap: ReturnerCapSummary | undefined,
) {
  const attendance = deriveAttendanceStatus(entry)
  const tags: RosterStatusTag[] = [{
    label: formatAttendance(entry),
    tone: attendance === 'present' ? 'success' : 'neutral',
  }]
  const signals = getTrafficLightSignals(entry)
  const hasCheckIn = hasMeaningfulCheckIn(entry)

  if (entry.returnerFlag === 'ja') {
    tags.push({ label: 'Returner heute', tone: 'info' })
  } else if (hasCheckIn && signals.needsReturnerClarification) {
    tags.push({ label: 'Returner klären', tone: 'neutral' })
  }

  if (returnerCap) {
    tags.push({ label: 'Cap', tone: 'info' })
  }

  if (warning) {
    tags.push({ label: 'Vorwarnung', tone: 'warning' })
  }

  if (entry.checkInSource === 'player_link' || entry.checkInSource === 'player_kiosk') {
    tags.push({ label: 'Self', tone: 'info' })
  }

  return tags
}

type RosterTrafficTone = TrafficLight | 'open'

function rosterTrafficTone(entry: PlayerSessionEntry): RosterTrafficTone {
  if (!hasMeaningfulCheckIn(entry)) {
    return 'open'
  }

  return entry.trafficLight ?? entry.trafficLightSuggestion ?? 'open'
}

function rosterTrafficReason(
  entry: PlayerSessionEntry,
  warning: PlayerWarning | undefined,
  returnerCap: ReturnerCapSummary | undefined,
) {
  if (!hasMeaningfulCheckIn(entry)) {
    return 'Noch nicht erfasst'
  }

  const trafficLight = rosterTrafficTone(entry)
  const signals = getTrafficLightSignals(entry)

  if (trafficLight === 'red') {
    return 'Heute prüfen'
  }

  if (trafficLight === 'yellow') {
    return 'Belastung anpassen'
  }

  if (signals.needsReturnerClarification) {
    return 'Returner klären'
  }

  if (returnerCap) {
    return 'Returner-Cap prüfen'
  }

  if (warning) {
    return 'Vorwarnung prüfen'
  }

  if (trafficLight === 'green') {
    return 'Keine Warnsignale dokumentiert'
  }

  return 'Noch nicht erfasst'
}

function GuidanceCard({ item }: { item: CheckInGuidanceItem }) {
  return (
    <article className={`guidance-card guidance-${item.level}`}>
      <div className="guidance-card-head">
        <span className={`guidance-badge guidance-${item.level}`}>{guidanceLevelLabels[item.level]}</span>
        <strong>{item.title}</strong>
      </div>
      <dl className="guidance-copy">
        <div>
          <dt>Bedeutung</dt>
          <dd>{item.meaning}</dd>
        </div>
        <div>
          <dt>Warum</dt>
          <dd>{item.why}</dd>
        </div>
        <div>
          <dt>Coach-Aktion</dt>
          <dd>{item.coachAction}</dd>
        </div>
        <div>
          <dt>Konsequenz</dt>
          <dd>{item.consequence}</dd>
        </div>
      </dl>
    </article>
  )
}

function guidanceSummaryLabel(item: CheckInGuidanceItem) {
  if (item.id.startsWith('today:red-flag:')) {
    return 'Red Flag: keine normale Progression'
  }

  return item.title
}

function GuidanceList({
  collapsible = false,
  compact = false,
  guidance,
  title,
}: {
  collapsible?: boolean
  compact?: boolean
  guidance: CheckInGuidanceItem[]
  title: string
}) {
  if (guidance.length === 0) {
    return null
  }

  if (collapsible) {
    const summaryItems = guidance
      .map((item, index) => ({ item, index }))
      .sort((a, b) => guidanceLevelPriority[a.item.level] - guidanceLevelPriority[b.item.level] || a.index - b.index)
      .slice(0, 3)
      .map(({ item }) => item)
    const hiddenCount = Math.max(guidance.length - summaryItems.length, 0)
    const guidanceCountLabel = guidance.length === 1 ? '1 Hinweis' : `${guidance.length} Hinweise`

    return (
      <details className={compact ? 'guidance-section compact-guidance guidance-disclosure' : 'guidance-section guidance-disclosure'}>
        <summary className="guidance-summary">
          <span className="guidance-summary-main">
            <ShieldAlert className="nav-icon" aria-hidden />
            <span>
              <strong>{title}</strong>
              <small>{guidanceCountLabel}</small>
            </span>
          </span>
          <span className="guidance-summary-tags" aria-label="Wichtigste Hinweise">
            {summaryItems.map((item) => (
              <span className={`guidance-summary-chip guidance-${item.level}`} key={item.id}>
                {guidanceSummaryLabel(item)}
              </span>
            ))}
            {hiddenCount > 0 ? <span className="guidance-summary-more">+{hiddenCount}</span> : null}
          </span>
        </summary>
        <div className={compact ? 'guidance-list compact-guidance-list' : 'guidance-list'}>
          {guidance.map((item) => (
            <GuidanceCard item={item} key={item.id} />
          ))}
        </div>
      </details>
    )
  }

  return (
    <section className={compact ? 'guidance-section compact-guidance' : 'guidance-section'} aria-label={title}>
      <div className="status-line">
        <ShieldAlert className="nav-icon" aria-hidden />
        <h4>{title}</h4>
      </div>
      <div className={compact ? 'guidance-list compact-guidance-list' : 'guidance-list'}>
        {guidance.map((item) => (
          <GuidanceCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  )
}

function CheckInGuidanceLegend() {
  return (
    <details className="guidance-legend">
      <summary>Legende</summary>
      <div className="guidance-legend-grid">
        <p><strong>Ampel:</strong> Grün, Gelb und Rot sind Coach-Hinweise zur heutigen Belastung.</p>
        <p><strong>Red Flags:</strong> Kopf/Nacken/Neuro oder akute Instabilität konservativ prüfen.</p>
        <p><strong>Returner:</strong> Status heute ist getrennt von Returner-Caps aus dem Belastungsplan.</p>
        <p><strong>Vorwarnung:</strong> Mitnahme aus letzter Einheit, kein neuer Tagesbefund.</p>
        <p><strong>Gespeicherte Limits:</strong> können aus früheren Eingaben stammen und werden geprüft statt automatisch übernommen.</p>
        <p><strong>Alle Hinweise sind beratend.</strong> Die App sperrt keine Coach-Entscheidung.</p>
      </div>
    </details>
  )
}

function CheckInPlayerRow({
  entry,
  isExpected,
  isSavingDisabled,
  onSave,
  onReset,
  onOpenReturner,
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
  onOpenReturner?: (playerId: string) => void
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
  const guidance = buildCheckInGuidance({ entry: displayEntry, warning, returnerCap })
  const shouldOfferReturner =
    displayEntry.returnerFlag === 'ja' ||
    displayEntry.redFlag !== 'none' ||
    displayEntry.movementConcern ||
    Boolean(
      (displayEntry.trafficLight ?? displayEntry.trafficLightSuggestion) &&
      (displayEntry.trafficLight ?? displayEntry.trafficLightSuggestion) !== 'green',
    )
  const canReset = !displayEntry.id.startsWith('preview:')
  const [textValues, setTextValues] = useState(() => {
    const painLocationParts = splitPainLocationParts(displayEntry.painLocation)

    return {
      sourceEntryKey,
      lifeValue: displayEntry.lifeFlag,
      painLocationValue: painLocationParts.knownValue,
      painLocationNoteValue: painLocationParts.customValue,
      observationValue: displayEntry.observation,
    }
  })
  const currentTextValues =
    textValues.sourceEntryKey === sourceEntryKey
      ? textValues
      : (() => {
          const painLocationParts = splitPainLocationParts(displayEntry.painLocation)

          return {
            sourceEntryKey,
            lifeValue: displayEntry.lifeFlag,
            painLocationValue: painLocationParts.knownValue,
            painLocationNoteValue: painLocationParts.customValue,
            observationValue: displayEntry.observation,
          }
        })()
  const currentLifeValues = splitCheckInTextList(currentTextValues.lifeValue)
  const currentPainLocationValues = splitCheckInTextList(currentTextValues.painLocationValue)

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

      <GuidanceList collapsible guidance={guidance} title="Heute beachten" />

      {shouldOfferReturner && onOpenReturner ? (
        <SecondaryButton compact onClick={() => onOpenReturner(player.id)}>
          Im Returner prüfen
        </SecondaryButton>
      ) : null}

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

        <div className="control-group" aria-label={`Belastbarkeit heute ${player.name}`}>
          <span>Belastbarkeit heute · 1 = schlecht, 5 = voll bereit</span>
          <div className="button-row compact">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                className={displayEntry.readiness === value ? 'number-chip active' : 'number-chip'}
                key={value}
                type="button"
                disabled={controlsDisabled || savingActionKey === `readiness:${value}`}
                onClick={() =>
                  void saveWithFeedback('Belastbarkeit', `readiness:${value}`, { readiness: value, previousWarning: Boolean(warning) })
                }
              >
                {value}
              </button>
            ))}
          </div>
          <p className="scale-anchor">1 = schlecht · 5 = voll bereit</p>
        </div>

        <div className="control-group">
          <span>Was beeinflusst heute?</span>
          <div className="button-row">
            {lifeFlagOptions.map((option) => (
              <button
                className={
                  option === 'Unauffällig'
                    ? currentLifeValues.length === 0
                      ? 'segmented active'
                      : 'segmented'
                    : currentLifeValues.includes(lifeFlagOptionValue(option))
                      ? 'segmented active'
                      : 'segmented'
                }
                key={option}
                type="button"
                disabled={controlsDisabled || savingActionKey === `lifeFlag:${option}`}
                onClick={() => {
                  const optionValue = lifeFlagOptionValue(option)
                  const lifeValue = optionValue ? toggleCheckInTextListValue(currentTextValues.lifeValue, optionValue) : ''
                  setTextValues({ ...currentTextValues, lifeValue })
                  void saveWithFeedback('Alltag', `lifeFlag:${option}`, {
                    lifeFlag: lifeValue,
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
          <span>Schmerz/Beschwerden heute</span>
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
          <p className="scale-anchor">0 = keine Beschwerden · 10 = sehr stark</p>
        </div>

        <div className="control-group">
          <span>Schmerzort / Körperregion</span>
          <div className="button-row">
            {painLocationOptions.map((option) => (
              <button
                className={currentPainLocationValues.includes(option) ? 'segmented active' : 'segmented'}
                key={option}
                type="button"
                disabled={controlsDisabled || savingActionKey === `painLocation:${option}`}
                onClick={() => {
                  const painLocationChipValue = toggleCheckInTextListValue(currentTextValues.painLocationValue, option)
                  const painLocationValue = joinPainLocationParts(
                    painLocationChipValue,
                    currentTextValues.painLocationNoteValue,
                  )
                  setTextValues({ ...currentTextValues, painLocationValue: painLocationChipValue })
                  void saveWithFeedback('Schmerzort', `painLocation:${option}`, {
                    painLocation: painLocationValue,
                    redFlag: mergeRedFlags(displayEntry.redFlag, deriveRedFlagFromPainLocation(painLocationValue)),
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
            value={currentTextValues.painLocationNoteValue}
            disabled={controlsDisabled}
            placeholder="z. B. Wade rechts"
            onChange={(event) => setTextValues({ ...currentTextValues, painLocationNoteValue: event.currentTarget.value })}
            onBlur={(event) => {
              const painLocationValue = joinPainLocationParts(currentTextValues.painLocationValue, event.currentTarget.value)

              void saveWithFeedback('Eingabe', 'painLocation', {
                painLocation: painLocationValue,
                redFlag: mergeRedFlags(displayEntry.redFlag, deriveRedFlagFromPainLocation(painLocationValue)),
                previousWarning: Boolean(warning),
              })
            }}
          />
        </label>

        <div className="control-group">
          <span>Seit dem letzten Training: etwas neu oder schlechter?</span>
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
          <span>Returner heute (Coach)</span>
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
          {displayEntry.redFlag !== 'none' ? (
            <p className="privacy-note">Red Flag bleibt aktiv, bis du sie bewusst über Keine Red Flag zurücksetzt.</p>
          ) : null}
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

function CheckInRosterRow({
  entry,
  feedback,
  isExpected,
  quickSavingAttendance,
  onQuickAttendance,
  onSelect,
  player,
  returnerCap,
  warning,
}: {
  entry: PlayerSessionEntry
  feedback: { message: string; tone: ActionFeedbackTone } | null
  isExpected: boolean
  quickSavingAttendance: 'present' | 'absent' | null
  onQuickAttendance: (present: boolean) => void
  onSelect: () => void
  player: Player
  returnerCap: ReturnerCapSummary | undefined
  warning: PlayerWarning | undefined
}) {
  const tags = statusTags(entry, warning, returnerCap)
  const trafficLight = rosterTrafficTone(entry)
  const attendance = deriveAttendanceStatus(entry)
  const trafficReason = rosterTrafficReason(entry, warning, returnerCap)
  const trafficLabel = formatTrafficLight(trafficLight === 'open' ? null : trafficLight)

  return (
    <AthleteRow
      action={(
        <div className="checkin-roster-action-stack">
          <div className="checkin-roster-actions" role="group" aria-label={`${player.name} Schnellaktionen`}>
            <button
              className={attendance === 'present' ? 'checkin-row-action active' : 'checkin-row-action'}
              data-testid={`checkin-roster-present-${player.id}`}
              type="button"
              aria-busy={quickSavingAttendance === 'present' || undefined}
              aria-pressed={attendance === 'present'}
              onClick={() => onQuickAttendance(true)}
              disabled={quickSavingAttendance !== null}
            >
              {quickSavingAttendance === 'present' ? 'Speichert…' : 'Da'}
            </button>
            <button
              className={attendance === 'absent' ? 'checkin-row-action active' : 'checkin-row-action'}
              data-testid={`checkin-roster-absent-${player.id}`}
              type="button"
              aria-busy={quickSavingAttendance === 'absent' || undefined}
              aria-pressed={attendance === 'absent'}
              onClick={() => onQuickAttendance(false)}
              disabled={quickSavingAttendance !== null}
            >
              {quickSavingAttendance === 'absent' ? 'Speichert…' : 'Nicht da'}
            </button>
          </div>
          {feedback ? (
            <p
              className={`checkin-row-feedback ${feedback.tone}`}
              role={feedback.tone === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      )}
      meta={[`${player.position} · ${player.cluster}${isExpected ? ' · zuletzt dabei' : ''}`]}
      name={player.name}
      note={trafficReason}
      onSelect={onSelect}
      playerId={player.id}
      readinessLabel={`${trafficLabel}: ${trafficReason}`}
      readinessTone={trafficLight}
      selectDescription={`Ampel ${trafficLabel}. ${trafficReason}. ${tags.map((tag) => tag.label).join('. ')}.`}
      selectLabel={`${player.name} Check-in öffnen`}
      status={tags.map((tag) => (
        <StatusChip key={`${tag.label}-${tag.tone}`} label={tag.label} tone={tag.tone} />
      ))}
      traffic={(
        <TrafficLightChip
          label={trafficLabel}
          tone={trafficLight}
        />
      )}
    />
  )
}

export function CheckInView({
  authState,
  checkInActions,
  initialSelectedPlayerId = null,
  onNavigate,
  onOpenReturner,
  onSessionChange,
  onStartKiosk,
  playerActions,
  returnerCaps,
  selectedSession,
  selectedSessionId,
  sessions,
  showSessionPicker = true,
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
    resetSessionCheckIns,
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
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(initialSelectedPlayerId)
  const [isPlayerEditorOpen, setIsPlayerEditorOpen] = useState(false)
  const [playerEditorValues, setPlayerEditorValues] = useState<PlayerFormValues | null>(null)
  const [playerEditorError, setPlayerEditorError] = useState<string | null>(null)
  const [playerEditorNotice, setPlayerEditorNotice] = useState<string | null>(null)
  const [isPlayerEditorSubmitting, setIsPlayerEditorSubmitting] = useState(false)
  const [resetFeedback, setResetFeedback] = useState<string | null>(null)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [quickSaveSessionId, setQuickSaveSessionId] = useState(selectedSessionId)
  const [quickSavingByPlayerId, setQuickSavingByPlayerId] = useState<Record<string, 'present' | 'absent'>>({})
  const [quickSaveFeedbackByPlayerId, setQuickSaveFeedbackByPlayerId] = useState<
    Record<string, { message: string; tone: ActionFeedbackTone }>
  >({})
  const selectedSessionIdRef = useRef(selectedSessionId)
  const selectedSheetRef = useRef<HTMLDivElement | null>(null)
  const resetConfirmDialogRef = useRef<HTMLDivElement | null>(null)
  const resetButtonRef = useRef<HTMLButtonElement | null>(null)
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
  const nextOpenPlayer = playerRows.find(({ entry }) => deriveAttendanceStatus(entry) === 'open')?.player ?? null
  const yellowCount = activeEntries.filter((entry) => entry.trafficLight === 'yellow').length
  const redCount = activeEntries.filter((entry) => entry.trafficLight === 'red').length
  const returnerCount = activeEntries.filter((entry) => entry.returnerFlag === 'ja').length
  const returnerClarificationCount = activeEntries.filter(
    (entry) => hasMeaningfulCheckIn(entry) && getTrafficLightSignals(entry).needsReturnerClarification,
  ).length
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
      return hasMeaningfulCheckIn(entry) && getTrafficLightSignals(entry).needsReturnerClarification
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
    { pending: 0, imported: 0, conflict: 0, superseded: 0, reset: 0 },
  )
  const resetPreviewEntries = checkInActions.sessionEntries.filter((entry) => hasPlayerId(entry) && !entry.deletedAt)
  const resetPreview = resetPreviewEntries.reduce(
    (preview, entry) => {
      preview.sourceCounts[entry.checkInSource ?? 'coach'] += 1
      if (hasPostSessionData(entry)) {
        preview.retainedPostSessionCount += 1
      }
      return preview
    },
    {
      sourceCounts: { coach: 0, player_link: 0, player_kiosk: 0, mixed: 0 },
      retainedPostSessionCount: 0,
    },
  )
  const resetPreviewEntryCount = Object.values(resetPreview.sourceCounts).reduce((total, count) => total + count, 0)
  const resetPreviewPublicSubmissionCount = checkInActions.publicCheckInSubmissions.filter(
    (submission) => !submission.deletedAt && submission.status !== 'reset',
  ).length
  const canResetSessionCheckIns = Boolean(checkInActions.sessionLogId) || resetPreviewPublicSubmissionCount > 0
  const canNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (!selectedSessionSharePayload ||
      typeof navigator.canShare !== 'function' ||
      navigator.canShare(selectedSessionSharePayload))
  const isRosterLoading = isLoading || playerActions.isLoading

  function openPlayerEditor(player: Player) {
    setPlayerEditorValues(playerToFormValues(player))
    setPlayerEditorError(null)
    setPlayerEditorNotice(null)
    setIsPlayerEditorOpen(true)
  }

  function closeSelectedPlayerSheet() {
    setSelectedPlayerId(null)
    setIsPlayerEditorOpen(false)
    setPlayerEditorValues(null)
    setPlayerEditorError(null)
    setPlayerEditorNotice(null)
  }

  function closePlayerEditor() {
    setIsPlayerEditorOpen(false)
    setPlayerEditorError(null)
    setPlayerEditorNotice(null)
  }

  function updatePlayerEditorField<K extends keyof PlayerFormValues>(field: K, value: PlayerFormValues[K]) {
    setPlayerEditorValues((currentValues) => (currentValues ? { ...currentValues, [field]: value } : currentValues))
  }

  async function saveSelectedPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlayer || !playerEditorValues) {
      return
    }

    setPlayerEditorError(null)
    setPlayerEditorNotice(null)
    setIsPlayerEditorSubmitting(true)
    triggerHapticFeedback('selection')

    try {
      await playerActions.savePlayer(playerEditorValues, selectedPlayer)
      await playerActions.refreshLocalPlayers()
      setPlayerEditorNotice('Spieler aktualisiert.')
      triggerHapticFeedback('success')
    } catch (caughtError) {
      triggerHapticFeedback('warning')
      setPlayerEditorError(caughtError instanceof Error ? caughtError.message : 'Spieler konnte nicht gespeichert werden.')
    } finally {
      setIsPlayerEditorSubmitting(false)
    }
  }

  useEffect(() => {
    selectedSessionIdRef.current = selectedSessionId
  }, [selectedSessionId])

  useEffect(() => {
    if (!selectedPlayerId || !selectedPlayer) {
      return undefined
    }

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    selectedSheetRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (isPlayerEditorOpen) {
          closePlayerEditor()
        } else {
          closeSelectedPlayerSheet()
        }
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements = Array.from(
        selectedSheetRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )
      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements.at(-1)

      if (!firstFocusable || !lastFocusable) {
        event.preventDefault()
        return
      }

      if (event.shiftKey && (document.activeElement === firstFocusable || document.activeElement === selectedSheetRef.current)) {
        event.preventDefault()
        lastFocusable.focus()
      } else if (!event.shiftKey && document.activeElement === selectedSheetRef.current) {
        event.preventDefault()
        firstFocusable.focus()
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [isPlayerEditorOpen, selectedPlayer, selectedPlayerId])

  useEffect(() => {
    if (!isResetConfirmOpen) {
      return undefined
    }

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const fallbackFocusElement = resetButtonRef.current
    resetConfirmDialogRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsResetConfirmOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      const focusTarget = previousActiveElement ?? fallbackFocusElement
      focusTarget?.focus()
    }
  }, [isResetConfirmOpen])

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

  async function handleConfirmResetAllCheckIns() {
    const result = await resetSessionCheckIns()
    setIsResetConfirmOpen(false)

    if (result.ok) {
      const totalResetCount = result.resetCount + result.publicSubmissionResetCount
      setResetFeedback(
        totalResetCount > 0
          ? `${result.resetCount} Check-in-Einträge und ${result.publicSubmissionResetCount} Link-Eingänge zurückgesetzt.`
          : 'Keine zurücksetzbaren Check-ins für diese Einheit.',
      )
    } else {
      setResetFeedback(result.error)
    }
  }

  async function handleQuickAttendance(player: Player, present: boolean, warning: PlayerWarning | undefined) {
    const requestSessionId = selectedSessionId
    setQuickSaveSessionId(requestSessionId)
    setQuickSavingByPlayerId((current) => (
      quickSaveSessionId === requestSessionId
        ? { ...current, [player.id]: present ? 'present' : 'absent' }
        : { [player.id]: present ? 'present' : 'absent' }
    ))
    setQuickSaveFeedbackByPlayerId((current) => {
      if (quickSaveSessionId !== requestSessionId) {
        return {}
      }

      const next = { ...current }
      delete next[player.id]
      return next
    })
    triggerHapticFeedback('selection')

    try {
      const result = await saveEntry(player, { present, previousWarning: Boolean(warning) }, undefined)

      if (selectedSessionIdRef.current !== requestSessionId) {
        return
      }

      if (result.ok) {
        const feedback = actionFeedbackForSave({
          isOnline: syncOverview.isOnline,
          syncStatus: result.entry.syncStatus,
        })
        setQuickSaveFeedbackByPlayerId((current) => ({ ...current, [player.id]: feedback }))
        triggerHapticFeedback('success')
      } else {
        setQuickSaveFeedbackByPlayerId((current) => ({
          ...current,
          [player.id]: actionFeedbackForFailure(),
        }))
        triggerHapticFeedback('warning')
      }
    } catch {
      if (selectedSessionIdRef.current !== requestSessionId) {
        return
      }

      setQuickSaveFeedbackByPlayerId((current) => ({
        ...current,
        [player.id]: actionFeedbackForFailure(),
      }))
      triggerHapticFeedback('warning')
    } finally {
      if (selectedSessionIdRef.current === requestSessionId) {
        setQuickSavingByPlayerId((current) => {
          const next = { ...current }
          delete next[player.id]
          return next
        })
      }
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
            {selectedSession.title}: Anwesenheit, Belastbarkeit, Alltag, Schmerz, Returner und Ampel vor dem
            Training.
          </p>
        </div>
        <div className="player-toolbar">
          {showSessionPicker ? (
            <SessionPicker
              onSessionChange={handleSessionChange}
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
          ) : null}
          <PrimaryButton
            disabled={activePlayers.length === 0}
            disabledReason={activePlayers.length === 0 ? 'Lege zuerst mindestens einen aktiven Spieler an.' : undefined}
            onClick={() => {
              if (nextOpenPlayer) {
                setSelectedPlayerId(nextOpenPlayer.id)
                return
              }

              onNavigate(routes.unitTraining)
            }}
          >
            {nextOpenPlayer ? 'Nächsten offenen Check-in' : 'Training öffnen'}
          </PrimaryButton>
          {syncOverview.status === 'error' ? (
            <SecondaryButton icon={<RefreshCw className="nav-icon" aria-hidden />} isLoading={isLoading} loadingLabel="Sync laeuft" onClick={runSync}>
              Erneut synchronisieren
            </SecondaryButton>
          ) : null}
          <SecondaryButton icon={<UserCheck className="nav-icon" aria-hidden />} onClick={() => onNavigate(routes.players)}>
            Spieler verwalten
          </SecondaryButton>
          <SecondaryButton
            disabled={activePlayers.length === 0}
            disabledReason={activePlayers.length === 0 ? 'Lege zuerst mindestens einen aktiven Spieler an.' : undefined}
            icon={<ClipboardCheck className="nav-icon" aria-hidden />}
            onClick={onStartKiosk}
          >
            Kiosk starten
          </SecondaryButton>
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

      <section className="panel checkin-roster-panel" aria-label="Check-in Roster">
        <div className="checkin-roster-head">
          <div className="library-heading compact-heading">
            <p className="eyebrow">Roster zuerst</p>
            <h3>Check-in Roster</h3>
            <p>Spieler scannen, Status prüfen und bei Bedarf die Detailansicht öffnen.</p>
          </div>
          <dl className="checkin-roster-counts" aria-label="Roster-Zusammenfassung">
            <div>
              <dt>Aktive Spieler</dt>
              <dd className="of-num">{activePlayers.length}</dd>
            </div>
            <div>
              <dt>Da / offen</dt>
              <dd className="of-num">{checkedInCount} / {openCount}</dd>
            </div>
            <div>
              <dt>Gelb / Rot</dt>
              <dd className="of-num">{yellowCount} / {redCount}</dd>
            </div>
            <div>
              <dt>Returner / Klärung</dt>
              <dd className="of-num">{returnerCount} / {returnerClarificationCount}</dd>
            </div>
          </dl>
        </div>

        {activePlayers.length > 0 ? (
          <>
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
                ['clarify', 'Returner klären'],
                ['warning', 'Vorwarnung'],
              ].map(([value, label]) => (
                <button
                  className={activeFilter === value ? 'filter-chip active' : 'filter-chip'}
                  aria-pressed={activeFilter === value}
                  key={value}
                  type="button"
                  onClick={() => setActiveFilter(value as typeof activeFilter)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <div className="checkin-roster-groups">
          {isRosterLoading && activePlayers.length === 0 ? (
            <>
              <Skeleton label="Check-in Roster wird geladen" variant="row" />
              <Skeleton label="Weitere Check-ins werden geladen" variant="row" />
              <Skeleton label="Weitere Check-ins werden geladen" variant="row" />
            </>
          ) : activePlayers.length > 0 ? (
            groupedPlayerRows.map(([initial, rows]) => (
              <div className="checkin-roster-group" key={initial}>
                <h4>{initial}</h4>
                <div className="checkin-roster-list">
                  {rows.map(({ entry, player, warning }) => (
                    <CheckInRosterRow
                      entry={entry}
                      feedback={quickSaveSessionId === selectedSessionId ? quickSaveFeedbackByPlayerId[player.id] ?? null : null}
                      isExpected={expectedPlayerSet.has(player.id)}
                      quickSavingAttendance={quickSaveSessionId === selectedSessionId ? quickSavingByPlayerId[player.id] ?? null : null}
                      key={player.id}
                      onQuickAttendance={(present) => void handleQuickAttendance(player, present, warning)}
                      onSelect={() => {
                        setSelectedPlayerId(player.id)
                        setIsPlayerEditorOpen(false)
                        setPlayerEditorValues(null)
                        setPlayerEditorError(null)
                        setPlayerEditorNotice(null)
                      }}
                      player={player}
                      returnerCap={returnerCapByPlayerId.get(player.id)}
                      warning={warning}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="sync-help">Noch keine aktiven Spieler im Roster.</p>
          )}
        </div>
        {filteredPlayerRows.length === 0 && activePlayers.length > 0 ? (
          <p className="sync-help">Keine Spieler für diesen Filter.</p>
        ) : null}
      </section>

      <section className="checkin-secondary-tools" aria-label="Sekundäre Check-in Werkzeuge">
        <details className="panel checkin-secondary-panel public-checkin-coach-panel" open={Boolean(selectedSessionSharePayload)}>
          <summary>
            <span className="status-line">
              <Link2 className="nav-icon" aria-hidden />
              <span>
                <strong>Public/Kiosk</strong>
                <small>Link, QR und Kiosk bleiben separat.</small>
              </span>
            </span>
          </summary>
          <div className="checkin-secondary-body" aria-label="Check-in-Link teilen">
            <div className="button-row">
              <SecondaryButton
                data-testid="public-checkin-create-link"
                onClick={() => void handleCreatePublicLink()}
                icon={<Plus className="nav-icon" aria-hidden />}
                isLoading={isLoading}
                loadingLabel="Link wird erstellt"
              >
                {activePublicLink ? 'Neuen Link erstellen' : 'Link erstellen'}
              </SecondaryButton>
              {activePublicLink ? (
                <SecondaryButton
                  data-testid="public-checkin-close-link"
                  onClick={() => void handleClosePublicLink()}
                  icon={<X className="nav-icon" aria-hidden />}
                >
                  Link schliessen
                </SecondaryButton>
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
                ? ` Eingaenge: ${publicSubmissionCounts.pending} offen, ${publicSubmissionCounts.imported} uebernommen, ${publicSubmissionCounts.conflict} Konflikte, ${publicSubmissionCounts.reset} zurueckgesetzt.`
                : ''}
              {checkInActions.publicCheckInNotice ? ` ${checkInActions.publicCheckInNotice}` : ''}
              {selectedSessionSharePayload ? ' Link erstellt. Teile ihn oben oder lasse den QR-Code scannen.' : ''}
            </p>
          </div>
        </details>

        <details className="panel checkin-secondary-panel">
          <summary>
            <span>
              <strong>Reset</strong>
              <small>Zurücksetzen bleibt geschützt und sekundär.</small>
            </span>
          </summary>
          <div className="checkin-secondary-body" aria-label="Check-in zurücksetzen">
            <p className="sync-help">
              Setzt alle Check-ins dieser Einheit zurück, inklusive Coach, WhatsApp/QR und Kiosk. Nachbereitungsdaten
              bleiben erhalten.
            </p>
            <button
              ref={resetButtonRef}
              className="secondary-action"
              type="button"
              aria-describedby={!canResetSessionCheckIns ? 'reset-open-disabled-reason' : undefined}
              disabled={!canResetSessionCheckIns}
              onClick={() => setIsResetConfirmOpen(true)}
            >
              Alle Check-ins zurücksetzen
            </button>
            {!canResetSessionCheckIns ? (
              <p className="disabled-action-reason" id="reset-open-disabled-reason">
                Es gibt fuer diese Einheit keine Check-ins zum Zuruecksetzen.
              </p>
            ) : null}
            {resetFeedback ? <p className="action-feedback visible">{resetFeedback}</p> : null}
          </div>
        </details>

        <details className="panel checkin-secondary-panel">
          <summary>
            <span>
              <strong>Legende & Hinweise</strong>
              <small>Ampel- und Beratungstexte.</small>
            </span>
          </summary>
          <div className="checkin-secondary-body">
            <CheckInGuidanceLegend />
          </div>
        </details>

        {activeWarnings.length > 0 ? (
          <details className="panel checkin-secondary-panel warning-panel">
            <summary>
              <span className="status-line">
                <ShieldAlert className="nav-icon" aria-hidden />
                <span>
                  <strong>Mitnehmen aus letzter Einheit</strong>
                  <small>{activeWarnings.length} Spieler</small>
                </span>
              </span>
            </summary>
            <div className="checkin-secondary-body warning-list" aria-label="Mitnehmen aus letzter Einheit">
              {activeWarnings.map((warning) => {
                const player = playerActions.players.find((item) => item.id === warning.playerId)
                const playerEntry = player ? getEntryForPlayer(player) : null
                const carryoverGuidance = playerEntry
                  ? buildCheckInGuidance({ entry: playerEntry, warning }).filter((item) => item.source === 'carryover')
                  : []
                return (
                  <article className="carryover-player-guidance" key={`${warning.playerId}-${warning.sessionDate}`}>
                    <strong>{player?.name ?? 'Spieler'}</strong>
                    <div className="guidance-list compact-guidance-list">
                      {carryoverGuidance.map((item) => (
                        <GuidanceCard item={item} key={item.id} />
                      ))}
                    </div>
                    {warning.observation ? <p className="sync-help">Notiz: {warning.observation}</p> : null}
                  </article>
                )
              })}
            </div>
          </details>
        ) : null}

        {activeObservations.length > 0 ? (
          <details className="panel checkin-secondary-panel">
            <summary>
              <span className="status-line">
                <FileText className="nav-icon" aria-hidden />
                <span>
                  <strong>Notizen aus letzter Einheit</strong>
                  <small>{activeObservations.length} Spieler</small>
                </span>
              </span>
            </summary>
            <div className="checkin-secondary-body warning-list" aria-label="Notizen aus letzter Einheit">
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
          </details>
        ) : null}
      </section>

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
              <div className="sheet-heading-actions">
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Spieler bearbeiten"
                  onClick={() => openPlayerEditor(selectedPlayer)}
                >
                  <Settings className="nav-icon" aria-hidden />
                </button>
                <button className="icon-button" type="button" aria-label="Check-in schließen" onClick={closeSelectedPlayerSheet}>
                  <X className="nav-icon" aria-hidden />
                </button>
              </div>
            </div>
            {isPlayerEditorOpen && playerEditorValues ? (
              <section className="checkin-player-editor" aria-label="Spieler-Stammdaten">
                <div className="library-heading compact-heading">
                  <div>
                    <p className="eyebrow">Bearbeiten</p>
                    <h3>Spieler-Stammdaten</h3>
                  </div>
                  <button className="icon-button" type="button" aria-label="Spieler-Editor schließen" onClick={closePlayerEditor}>
                    <X className="nav-icon" aria-hidden />
                  </button>
                </div>
                <PlayerEditorForm
                  formError={playerEditorError}
                  formNotice={playerEditorNotice}
                  isSubmitting={isPlayerEditorSubmitting}
                  onFieldChange={updatePlayerEditorField}
                  onSubmit={saveSelectedPlayer}
                  values={playerEditorValues}
                />
              </section>
            ) : (
              <CheckInPlayerRow
                entry={getEntryForPlayer(selectedPlayer)}
                isExpected={expectedPlayerSet.has(selectedPlayer.id)}
                isSavingDisabled={false}
                key={selectedPlayer.id}
                onSave={(selectedPlayer, patch, manualTrafficLight) => {
                  return saveEntry(selectedPlayer, patch, manualTrafficLight)
                }}
                onReset={(entry) => resetEntry(entry.id)}
                onOpenReturner={onOpenReturner}
                player={selectedPlayer}
                returnerCap={returnerCapByPlayerId.get(selectedPlayer.id)}
                warning={warningByPlayerId.get(selectedPlayer.id)}
              />
            )}
          </div>
        </section>
      ) : null}

      {isResetConfirmOpen ? (
        <section className="checkin-sheet-backdrop" aria-label="Reset bestätigen">
          <div
            className="checkin-sheet reset-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-confirm-heading"
            ref={resetConfirmDialogRef}
            tabIndex={-1}
          >
            <div className="sheet-heading">
              <div>
                <p className="eyebrow">Zweite Absicherung</p>
                <h3 id="reset-confirm-heading">Alle Check-ins zurücksetzen?</h3>
              </div>
              <button className="secondary-action compact-action" type="button" onClick={() => setIsResetConfirmOpen(false)}>
                Schliessen
              </button>
            </div>
            <p className="sync-help">
              Diese Aktion leert Coach-, WhatsApp/QR- und Kiosk-Check-ins für diese Einheit. Nachbereitungsdaten bleiben
              bestehen; die betroffenen Zeilen werden nur auf offene Check-ins zurückgesetzt.
            </p>
            <div className="reset-confirm-grid" aria-label="Reset-Vorschau">
              <div className="metric">
                <span>Coach</span>
                <strong>{resetPreview.sourceCounts.coach}</strong>
              </div>
              <div className="metric">
                <span>WhatsApp/QR</span>
                <strong>{resetPreview.sourceCounts.player_link}</strong>
              </div>
              <div className="metric">
                <span>Kiosk</span>
                <strong>{resetPreview.sourceCounts.player_kiosk}</strong>
              </div>
              <div className="metric">
                <span>Mixed</span>
                <strong>{resetPreview.sourceCounts.mixed}</strong>
              </div>
              <div className="metric">
                <span>Post-Session bleibt</span>
                <strong>{resetPreview.retainedPostSessionCount}</strong>
              </div>
              <div className="metric">
                <span>Link-Eingänge</span>
                <strong>{resetPreviewPublicSubmissionCount}</strong>
              </div>
            </div>
            <div className="button-row">
              <button className="secondary-action" type="button" onClick={() => setIsResetConfirmOpen(false)}>
                Abbrechen
              </button>
              <button
                className="secondary-action danger"
                type="button"
                onClick={() => void handleConfirmResetAllCheckIns()}
                aria-describedby={resetPreviewEntryCount + resetPreviewPublicSubmissionCount === 0 ? 'reset-confirm-disabled-reason' : undefined}
                disabled={resetPreviewEntryCount + resetPreviewPublicSubmissionCount === 0}
              >
                Alle Check-ins zurücksetzen
              </button>
            </div>
            {resetPreviewEntryCount + resetPreviewPublicSubmissionCount === 0 ? (
              <p className="disabled-action-reason" id="reset-confirm-disabled-reason">
                Keine Coach-, Link- oder Kiosk-Check-ins fuer diese Einheit vorhanden.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {!isRosterLoading && activePlayers.length === 0 ? (
        <section className="placeholder">
          <UserCheck className="placeholder-icon" aria-hidden />
          <h2>Noch keine aktiven Spieler</h2>
          <p>Lege zuerst Spieler im Spieler-Tab an. Danach erscheinen sie hier automatisch im Check-in.</p>
        </section>
      ) : null}
    </section>
  )
}
