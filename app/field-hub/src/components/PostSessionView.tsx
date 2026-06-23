import { AlertTriangle, ClipboardCheck, RefreshCw, ShieldAlert, UserCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { HubTab } from '../App'
import type { SessionDefinition } from '../content/types'
import { metricDefinitions } from '../content/metricDefinitions'
import { exerciseDefinitions } from '../content/exerciseDefinitions'
import {
  formatOptionalBaselineNumber,
  hasBaselineContent,
  parseOptionalBaselineNumber,
  sprint30mOptionalLabel,
  type BaselineEntry,
  type BaselineEntryPatch,
} from '../domain/baseline'
import type { E2Decision, NextStep, ProgressEntry } from '../domain/postSession'
import { derivePostSessionFollowUps, suggestNextStep } from '../domain/postSession'
import {
  exercisePainResponses,
  exerciseTechniqueQualities,
  exerciseVariants,
  formatExerciseResult,
  type ExerciseResult,
  type ExerciseResultPatch,
  type ExerciseVariant,
} from '../domain/exercises'
import { formatMetricValue, getMetricDefinition, parseOptionalMetricValue, type MetricResult, type MetricResultPatch } from '../domain/metrics'
import type { PlayerSessionEntry, PlayerWarning } from '../domain/checkIn'
import { derivePostSessionCompletion, type PostSessionCompletion } from '../domain/postSessionCompletion'
import { deriveMissingPostSessionValues, type MissingPostSessionValue } from '../domain/postSessionMissingValues'
import type { Player } from '../domain/players'
import type { ReturnerCapSummary } from '../domain/returners'
import type { SessionBlockLog } from '../domain/sessionBlocks'
import type { useBaselines } from '../hooks/useBaselines'
import type { useExposures } from '../hooks/useExposures'
import type { useExercises } from '../hooks/useExercises'
import type { useMetrics } from '../hooks/useMetrics'
import type { usePostSession } from '../hooks/usePostSession'
import type { AuthSessionState } from '../lib/auth'
import { hasPlayerId } from '../lib/playerId'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import { ExposureReviewPanel } from './ExposureReviewPanel'
import { SessionPicker } from './SessionPicker'

type PostSessionActions = ReturnType<typeof usePostSession>
type BaselineActions = ReturnType<typeof useBaselines>
type ExposureActions = ReturnType<typeof useExposures>
type ExerciseActions = ReturnType<typeof useExercises>
type MetricActions = ReturnType<typeof useMetrics>

type PostSessionViewProps = {
  authState: AuthSessionState
  baselineActions: BaselineActions
  exposureActions: ExposureActions
  exposureBlockLogs: SessionBlockLog[]
  exerciseActions: ExerciseActions
  lastExportAt: string | null
  metricActions: MetricActions
  onNavigate: (tab: HubTab) => void
  onSessionChange: (sessionId: string) => void
  postSessionActions: PostSessionActions
  returnerCaps: ReturnerCapSummary[]
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
}

const e2Options: Array<{ value: E2Decision; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'kein_sprint', label: 'kein Sprint' },
  { value: 'kein_cond', label: 'kein Cond' },
  { value: 'physio', label: 'Physio' },
]

const nextStepOptions: Array<{ value: NextStep; label: string }> = [
  { value: 'steigern', label: 'Steigern' },
  { value: 'halten', label: 'Halten' },
  { value: 'reduzieren', label: 'Reduzieren' },
  { value: 'klaeren', label: 'Klaeren' },
]

const exerciseVariantLabels: Record<ExerciseVariant, string> = {
  A_plus: 'A+',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  custom: 'Custom',
}

function progressPreview(player: Player, entry: ProgressEntry | null): ProgressEntry {
  return (
    entry ?? {
      id: 'progress-preview',
      userId: player.userId,
      playerId: player.id,
      sessionLogId: 'session-preview',
      mainExercise: '',
      load: '',
      reps: '',
      rpe: '',
      powerOrSprint: '',
      conditioning: '',
      note: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
      clientUpdatedAt: '',
      syncStatus: 'synced',
      syncError: null,
    }
  )
}

function baselinePreview(player: Player, entry: BaselineEntry | null): BaselineEntry {
  return (
    entry ?? {
      id: 'baseline-preview',
      userId: player.userId,
      playerId: player.id,
      sessionLogId: 'session-preview',
      broadJumpCm: null,
      medBallChestPassM: null,
      medBallWeightKg: null,
      sprint30m: null,
      note: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
      clientUpdatedAt: '',
      syncStatus: 'synced',
      syncError: null,
    }
  )
}

function WarningSummary({ warning }: { warning: PlayerWarning | undefined }) {
  if (!warning) {
    return null
  }

  const parts = [
    warning.trafficLight ? `Ampel ${warning.trafficLight}` : null,
    warning.e2Decision && warning.e2Decision !== 'normal' ? `E2 ${warning.e2Decision}` : null,
    warning.nextStep ? `Next ${warning.nextStep}` : null,
    warning.postPainScore !== null ? `Post-Pain ${warning.postPainScore}/10` : null,
  ].filter(Boolean)

  if (parts.length === 0) {
    return null
  }

  return (
    <div className="warning-note">
      <AlertTriangle className="nav-icon" aria-hidden />
      <span>Vorwarnung {warning.sessionDate}: {parts.join(' · ')}</span>
    </div>
  )
}

function ClosureChecklist({ completion }: { completion: PostSessionCompletion }) {
  const statusLabel =
    completion.status === 'abgeschlossen'
      ? 'abgeschlossen'
      : completion.status === 'teilweise_abgeschlossen'
        ? 'teilweise abgeschlossen'
        : 'offen'
  const statusClass = completion.status === 'abgeschlossen' ? 'online' : ''

  return (
    <section className="panel closure-panel" aria-labelledby="closure-heading">
      <div className="library-heading">
        <p className="eyebrow">Closure Checklist</p>
        <h3 id="closure-heading">Nachbereitungsstatus: {statusLabel}</h3>
        <p>Pflichtdaten blockieren den Abschlussstatus; Progression, Baseline und Export bleiben klare Hinweise.</p>
      </div>
      <div className="sync-mini">
        <span className={`status-dot ${statusClass}`} aria-hidden />
        <strong>{completion.blockers.length === 0 ? 'Pflichtdaten geklaert' : `${completion.blockers.length} Pflichtpunkt(e) offen`}</strong>
        {completion.advisories.length > 0 ? <span>{completion.advisories.length} Hinweis(e)</span> : null}
      </div>
      {completion.blockers.length > 0 ? (
        <div className="closure-list">
          {completion.blockers.map((blocker) => (
            <div className="warning-note" key={blocker.kind}>
              <AlertTriangle className="nav-icon" aria-hidden />
              <span>
                <strong>{blocker.label}</strong>
                {blocker.playerNames.length > 0 ? ` ${blocker.playerNames.slice(0, 6).join(', ')}${blocker.playerNames.length > 6 ? ' ...' : ''}` : ''}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {completion.advisories.length > 0 ? (
        <div className="closure-list">
          {completion.advisories.map((advisory) => (
            <div className="sync-mini" key={advisory.kind}>
              <strong>{advisory.label}</strong>
              {advisory.playerNames.length > 0 ? <span>{advisory.playerNames.slice(0, 6).join(', ')}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function MissingValuesPanel({
  isMetricSavingDisabled,
  isPostSavingDisabled,
  items,
  onMetricParseError,
  onMetricSave,
  onNavigate,
  onPostSave,
  onProgressSave,
  onSessionSave,
  playersById,
}: {
  isMetricSavingDisabled: boolean
  isPostSavingDisabled: boolean
  items: MissingPostSessionValue[]
  onMetricParseError: (message: string | null) => void
  onMetricSave: MetricActions['savePlayerMetric']
  onNavigate: (tab: HubTab) => void
  onPostSave: PostSessionActions['savePlayerPostSession']
  onProgressSave: PostSessionActions['savePlayerProgress']
  onSessionSave: PostSessionActions['saveSessionPatch']
  playersById: Map<string, Player>
}) {
  if (items.length === 0) {
    return null
  }

  function saveMetric(player: Player, item: MissingPostSessionValue, rawValue: string) {
    if (!item.metricKey) {
      return
    }

    if (!rawValue) {
      onMetricParseError(null)
      return
    }

    const parsedValue = parseOptionalMetricValue(rawValue)
    if (parsedValue === null) {
      onMetricParseError('Metric-Wert muss eine Zahl sein.')
      return
    }

    onMetricParseError(null)
    void onMetricSave(player, {
      metricKey: item.metricKey,
      value: parsedValue,
      attempt: 1,
      bodySide: 'none',
      contextNote: '',
    })
  }

  function renderAction(item: MissingPostSessionValue) {
    if (item.kind === 'missing_duration') {
      return (
        <label className="inline-field compact-missing-input">
          <span>Minuten</span>
          <input
            disabled={isPostSavingDisabled}
            inputMode="numeric"
            placeholder="z. B. 75"
            onBlur={(event) => {
              const rawValue = event.currentTarget.value.trim()
              const parsedValue = rawValue ? Number(rawValue) : null
              if (parsedValue !== null && (!Number.isFinite(parsedValue) || parsedValue < 0)) {
                return
              }

              void onSessionSave({ durationMinutes: parsedValue })
            }}
          />
        </label>
      )
    }

    if (item.kind === 'backup_export') {
      return (
        <button className="secondary-action compact-action" type="button" onClick={() => onNavigate('export')}>
          Export
        </button>
      )
    }

    const player = item.playerId ? playersById.get(item.playerId) : undefined
    if (!player) {
      return null
    }

    if (item.kind === 'missing_srpe' || item.kind === 'missing_post_pain') {
      return (
        <div className="button-row compact pain-scale missing-value-scale">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <button
              className="number-chip"
              disabled={isPostSavingDisabled}
              key={value}
              type="button"
              onClick={() => {
                const patch = item.kind === 'missing_srpe' ? { sessionRpe: value } : { postPainScore: value }
                void onPostSave(player, patch)
              }}
            >
              {value}
            </button>
          ))}
        </div>
      )
    }

    if (item.kind === 'missing_e2') {
      return (
        <div className="button-row compact">
          {e2Options.map((option) => (
            <button
              className="segmented"
              disabled={isPostSavingDisabled}
              key={option.value}
              type="button"
              onClick={() => void onPostSave(player, { e2Decision: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      )
    }

    if (item.kind === 'missing_next_step') {
      return (
        <div className="button-row compact">
          {nextStepOptions.map((option) => (
            <button
              className="segmented"
              disabled={isPostSavingDisabled}
              key={option.value}
              type="button"
              onClick={() => void onProgressSave(player, { nextStep: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      )
    }

    if (item.kind === 'missing_progression') {
      return (
        <label className="inline-field compact-missing-input">
          <span>Hauptuebung</span>
          <input
            disabled={isPostSavingDisabled}
            placeholder="z. B. Trap Bar"
            onBlur={(event) => {
              const value = event.currentTarget.value.trim()
              if (value) {
                void onProgressSave(player, { mainExercise: value })
              }
            }}
          />
        </label>
      )
    }

    if (item.kind === 'missing_metric' && item.metricKey) {
      const definition = getMetricDefinition(item.metricKey)
      return (
        <label className="inline-field compact-missing-input">
          <span>{definition.unit}</span>
          <input
            disabled={isMetricSavingDisabled}
            inputMode="decimal"
            placeholder={definition.unit}
            onBlur={(event) => saveMetric(player, item, event.currentTarget.value.trim())}
          />
        </label>
      )
    }

    return null
  }

  return (
    <section className="panel missing-values-panel" aria-labelledby="missing-values-heading">
      <div className="library-heading">
        <p className="eyebrow">Nachzutragen</p>
        <h3 id="missing-values-heading">Offene Werte und Aufgaben</h3>
        <p>Fehlende Pflichtwerte zuerst erfassen; optionale Testwerte bleiben bewusst kein Abschlussblocker.</p>
      </div>

      <div className="missing-values-list">
        {items.map((item) => (
          <article className={`missing-value-row missing-value-${item.severity}`} key={item.id}>
            <div className="missing-value-copy">
              <span className="tag compact">
                {item.severity === 'required' ? 'Pflicht' : item.severity === 'expected' ? 'Erwartet' : 'Optional'}
              </span>
              <strong>{item.playerName ? `${item.playerName}: ${item.label}` : item.label}</strong>
              <p>{item.helperText}</p>
            </div>
            <div className="missing-value-action">{renderAction(item)}</div>
          </article>
        ))}
      </div>
    </section>
  )
}

function PostSessionPlayerRow({
  entry,
  isSavingDisabled,
  onPostSave,
  onProgressSave,
  player,
  progressEntry,
  sessionDuration,
  warning,
}: {
  entry: PlayerSessionEntry
  isSavingDisabled: boolean
  onPostSave: PostSessionActions['savePlayerPostSession']
  onProgressSave: PostSessionActions['savePlayerProgress']
  player: Player
  progressEntry: ProgressEntry | null
  sessionDuration: number | null
  warning: PlayerWarning | undefined
}) {
  const progress = progressPreview(player, progressEntry)
  const followUps = derivePostSessionFollowUps(entry, progressEntry)
  const suggestedNextStep = suggestNextStep(entry, progress)
  const isStop = entry.e2Decision === 'D' || entry.e2Decision === 'physio' || entry.nextStep === 'klaeren'

  function handleProgressBlur(field: keyof Pick<ProgressEntry, 'mainExercise' | 'load' | 'reps' | 'rpe' | 'powerOrSprint' | 'conditioning' | 'note'>) {
    return (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      void onProgressSave(player, { [field]: event.currentTarget.value })
    }
  }

  return (
    <article className={`checkin-row traffic-${entry.trafficLight ?? entry.trafficLightSuggestion ?? 'open'}`}>
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {entry.sessionLoad !== null ? <span className="tag compact">Load {entry.sessionLoad}</span> : null}
            {isStop ? <span className="tag danger compact">Follow-up</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${entry.syncStatus}`}>{syncStatusLabel(entry.syncStatus)}</span>
      </div>

      <WarningSummary warning={warning} />

      <div className="checkin-controls post-session-controls">
        <div className="control-group" aria-label={`sRPE ${player.name}`}>
          <span>sRPE</span>
          <div className="button-row compact pain-scale">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                className={entry.sessionRpe === value ? 'number-chip active' : 'number-chip'}
                disabled={isSavingDisabled}
                key={value}
                type="button"
                onClick={() =>
                  void onPostSave(player, {
                    sessionRpe: value,
                    durationMinutes: entry.durationMinutes ?? sessionDuration,
                  })
                }
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group" aria-label={`Pain nach Training ${player.name}`}>
          <span>Post-Pain</span>
          <div className="button-row compact pain-scale">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                className={entry.postPainScore === value ? 'number-chip active' : 'number-chip'}
                disabled={isSavingDisabled}
                key={value}
                type="button"
                onClick={() => void onPostSave(player, { postPainScore: value })}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Post-Pain Ort/Issue</span>
          <input
            defaultValue={entry.postPainLocation}
            disabled={isSavingDisabled}
            key={`${entry.id}-post-pain-location`}
            placeholder="z. B. Wade rechts"
            onBlur={(event) => void onPostSave(player, { postPainLocation: event.currentTarget.value })}
          />
        </label>

        <div className="control-group">
          <span>E2 naechste Einheit</span>
          <div className="button-row">
            {e2Options.map((option) => (
              <button
                className={entry.e2Decision === option.value ? 'segmented active' : 'segmented'}
                disabled={isSavingDisabled}
                key={option.value}
                type="button"
                onClick={() => void onPostSave(player, { e2Decision: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Hauptuebung</span>
          <input
            defaultValue={progress.mainExercise}
            disabled={isSavingDisabled}
            key={`${progress.id}-main`}
            placeholder="z. B. Trap Bar Deadlift"
            onBlur={handleProgressBlur('mainExercise')}
          />
        </label>

        <label className="inline-field">
          <span>Last</span>
          <input
            defaultValue={progress.load}
            disabled={isSavingDisabled}
            key={`${progress.id}-load`}
            placeholder="z. B. 90 kg"
            onBlur={handleProgressBlur('load')}
          />
        </label>

        <label className="inline-field">
          <span>Reps</span>
          <input
            defaultValue={progress.reps}
            disabled={isSavingDisabled}
            key={`${progress.id}-reps`}
            placeholder="z. B. 3x5"
            onBlur={handleProgressBlur('reps')}
          />
        </label>

        <label className="inline-field">
          <span>RPE</span>
          <input
            defaultValue={progress.rpe}
            disabled={isSavingDisabled}
            key={`${progress.id}-rpe`}
            placeholder="z. B. 7"
            onBlur={handleProgressBlur('rpe')}
          />
        </label>

        <label className="inline-field">
          <span>Power/Sprint</span>
          <input
            defaultValue={progress.powerOrSprint}
            disabled={isSavingDisabled}
            key={`${progress.id}-power`}
            placeholder="z. B. 4x10 m smooth"
            onBlur={handleProgressBlur('powerOrSprint')}
          />
        </label>

        <label className="inline-field">
          <span>Conditioning</span>
          <input
            defaultValue={progress.conditioning}
            disabled={isSavingDisabled}
            key={`${progress.id}-conditioning`}
            placeholder="erledigt / gekuerzt / gestrichen"
            onBlur={handleProgressBlur('conditioning')}
          />
        </label>

        <div className="control-group">
          <span>Naechster Schritt</span>
          <div className="button-row">
            {nextStepOptions.map((option) => (
              <button
                className={entry.nextStep === option.value ? 'segmented active' : 'segmented'}
                disabled={isSavingDisabled}
                key={option.value}
                type="button"
                onClick={() => void onProgressSave(player, { nextStep: option.value })}
              >
                {option.label}
              </button>
            ))}
            <button
              className="segmented"
              disabled={isSavingDisabled}
              type="button"
              onClick={() => void onProgressSave(player, { nextStep: suggestedNextStep })}
            >
              Vorschlag: {suggestedNextStep}
            </button>
          </div>
        </div>

        <label className="inline-field wide">
          <span>Progressionsnotiz, keine Diagnose</span>
          <textarea
            defaultValue={progress.note}
            disabled={isSavingDisabled}
            key={`${progress.id}-note`}
            rows={2}
            placeholder="z. B. Technik sauber, gleiche Last besser bewegen"
            onBlur={handleProgressBlur('note')}
          />
        </label>
      </div>

      {followUps.length > 0 ? (
        <div className="post-followups">
          {followUps.map((followUp) => (
            <span className="tag compact" key={followUp}>{followUp}</span>
          ))}
        </div>
      ) : null}

      {isStop ? (
        <div className="warning-note danger">
          <ShieldAlert className="nav-icon" aria-hidden />
          <span>Follow-up bedeutet Klaerung/Anpassung, keine medizinische Freigabe durch die App.</span>
        </div>
      ) : null}
    </article>
  )
}

function BaselinePlayerRow({
  baselineEntry,
  isSavingDisabled,
  onParseError,
  onSave,
  player,
}: {
  baselineEntry: BaselineEntry | null
  isSavingDisabled: boolean
  onParseError: (message: string | null) => void
  onSave: BaselineActions['savePlayerBaseline']
  player: Player
}) {
  const baseline = baselinePreview(player, baselineEntry)

  function handleNumberBlur(
    field: keyof Pick<BaselineEntryPatch, 'broadJumpCm' | 'medBallChestPassM' | 'medBallWeightKg' | 'sprint30m'>,
    label: string,
    currentValue: number | null,
  ) {
    return (event: FormEvent<HTMLInputElement>) => {
      try {
        const parsedValue = parseOptionalBaselineNumber(event.currentTarget.value, label)

        if (parsedValue === currentValue) {
          return
        }

        onParseError(null)
        void onSave(player, { [field]: parsedValue })
      } catch (caughtError) {
        onParseError(caughtError instanceof Error ? caughtError.message : 'Baseline-Wert ist ungueltig.')
      }
    }
  }

  function handleNoteBlur(event: FormEvent<HTMLTextAreaElement>) {
    const value = event.currentTarget.value.trim()

    if (value === baseline.note) {
      return
    }

    onParseError(null)
    void onSave(player, { note: value })
  }

  return (
    <article className="baseline-row">
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {hasBaselineContent(baseline) ? <span className="tag compact">Testwerte</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${baseline.syncStatus}`}>{syncStatusLabel(baseline.syncStatus)}</span>
      </div>

      <div className="baseline-fields">
        <label className="inline-field">
          <span>Broad Jump cm</span>
          <input
            defaultValue={formatOptionalBaselineNumber(baseline.broadJumpCm)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${baseline.id}-bj`}
            placeholder="z. B. 245"
            onBlur={handleNumberBlur('broadJumpCm', 'Broad Jump', baseline.broadJumpCm)}
          />
        </label>

        <label className="inline-field">
          <span>MB Chest Pass m</span>
          <input
            defaultValue={formatOptionalBaselineNumber(baseline.medBallChestPassM)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${baseline.id}-mb`}
            placeholder="z. B. 6,25"
            onBlur={handleNumberBlur('medBallChestPassM', 'Med-Ball Chest Pass', baseline.medBallChestPassM)}
          />
        </label>

        <label className="inline-field">
          <span>MB kg</span>
          <input
            defaultValue={formatOptionalBaselineNumber(baseline.medBallWeightKg)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${baseline.id}-mb-weight`}
            placeholder="z. B. 5"
            onBlur={handleNumberBlur('medBallWeightKg', 'Med-Ball-Gewicht', baseline.medBallWeightKg)}
          />
        </label>

        <label className="inline-field">
          <span>{sprint30mOptionalLabel}</span>
          <input
            defaultValue={formatOptionalBaselineNumber(baseline.sprint30m)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${baseline.id}-sprint`}
            placeholder="leer lassen"
            onBlur={handleNumberBlur('sprint30m', '30 m', baseline.sprint30m)}
          />
        </label>

        <label className="inline-field wide">
          <span>Notiz, kein Ranking und keine Diagnose</span>
          <textarea
            defaultValue={baseline.note}
            disabled={isSavingDisabled}
            key={`${baseline.id}-note`}
            rows={2}
            placeholder="z. B. ruhig gemessen, 2 gueltige Versuche"
            onBlur={handleNoteBlur}
          />
        </label>
      </div>
    </article>
  )
}

function formatMetricInput(result: MetricResult | null) {
  return result ? String(result.value).replace('.', ',') : ''
}

function MetricPlayerRow({
  getMetricForPlayer,
  isSavingDisabled,
  onParseError,
  onSave,
  player,
}: {
  getMetricForPlayer: MetricActions['getMetricForPlayer']
  isSavingDisabled: boolean
  onParseError: (message: string | null) => void
  onSave: MetricActions['savePlayerMetric']
  player: Player
}) {
  const playerMetrics = metricDefinitions.map((definition) => ({
    definition,
    result: getMetricForPlayer(player, definition.key),
  }))
  const hasMetrics = playerMetrics.some(({ result }) => result !== null)
  const rowStatus = playerMetrics.find(({ result }) => result?.syncStatus === 'error')?.result?.syncStatus
    ?? playerMetrics.find(({ result }) => result?.syncStatus === 'pending')?.result?.syncStatus
    ?? playerMetrics.find(({ result }) => result?.syncStatus === 'synced')?.result?.syncStatus
    ?? 'synced'

  function handleMetricBlur(metricKey: string, currentResult: MetricResult | null) {
    return (event: FormEvent<HTMLInputElement>) => {
      const rawValue = event.currentTarget.value.trim()
      if (!rawValue && !currentResult) {
        return
      }

      const parsedValue = parseOptionalMetricValue(rawValue)
      if (parsedValue === null && rawValue) {
        onParseError('Metric-Wert muss eine Zahl sein.')
        return
      }

      if (parsedValue === currentResult?.value) {
        return
      }

      onParseError(null)
      const patch: MetricResultPatch = {
        metricKey,
        value: parsedValue,
        attempt: currentResult?.attempt ?? 1,
        bodySide: currentResult?.bodySide ?? 'none',
        contextNote: currentResult?.contextNote ?? '',
      }
      void onSave(player, patch)
    }
  }

  function handleContextBlur(currentResult: MetricResult | null) {
    return (event: FormEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value.trim()
      if (!currentResult || value === currentResult.contextNote) {
        return
      }

      onParseError(null)
      void onSave(player, {
        metricKey: currentResult.metricKey,
        value: currentResult.value,
        attempt: currentResult.attempt,
        bodySide: currentResult.bodySide,
        contextNote: value,
      })
    }
  }

  return (
    <article className="baseline-row">
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {hasMetrics ? <span className="tag compact">Metrics</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${rowStatus}`}>{syncStatusLabel(rowStatus)}</span>
      </div>

      <div className="baseline-fields">
        {playerMetrics.map(({ definition, result }) => (
          <label className="inline-field" key={definition.key}>
            <span>{definition.name} {definition.unit}</span>
            <input
              defaultValue={formatMetricInput(result)}
              disabled={isSavingDisabled}
              inputMode="decimal"
              key={`${result?.id ?? player.id}-${definition.key}`}
              placeholder={definition.key === 'sprint_30m' ? 'optional' : definition.unit}
              onBlur={handleMetricBlur(definition.key, result)}
            />
          </label>
        ))}

        <label className="inline-field wide">
          <span>Kontext, z. B. Ballgewicht 5 kg</span>
          <input
            defaultValue={playerMetrics.find(({ definition }) => definition.key === 'med_ball_chest_pass')?.result?.contextNote ?? ''}
            disabled={isSavingDisabled}
            key={`${player.id}-med-ball-context-${playerMetrics.find(({ definition }) => definition.key === 'med_ball_chest_pass')?.result?.id ?? 'new'}`}
            placeholder="z. B. 5 kg, Handzeit, nasser Rasen"
            onBlur={handleContextBlur(playerMetrics.find(({ definition }) => definition.key === 'med_ball_chest_pass')?.result ?? null)}
          />
        </label>
      </div>

      {hasMetrics ? (
        <p className="micro-copy">
          {playerMetrics
            .filter(({ result }) => result)
            .map(({ result }) => formatMetricValue(result as MetricResult))
            .join(' · ')}
        </p>
      ) : null}
    </article>
  )
}

function exercisePreview(player: Player, exerciseKey: string, variant: ExerciseVariant, result: ExerciseResult | null): ExerciseResult {
  const definition = exerciseDefinitions.find((item) => item.key === exerciseKey) ?? exerciseDefinitions[0]

  return (
    result ?? {
      id: 'exercise-preview',
      userId: player.userId,
      playerId: player.id,
      sessionLogId: 'session-preview',
      exerciseKey: definition.key,
      variant,
      sets: null,
      reps: '',
      loadValue: null,
      loadUnit: definition.defaultUnit,
      rpe: null,
      rir: null,
      techniqueQuality: 'not_recorded',
      painResponse: 'unclear',
      notes: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
      clientUpdatedAt: '',
      syncStatus: 'synced',
      syncError: null,
    }
  )
}

function optionalNumberInput(value: number | null) {
  return value === null ? '' : String(value).replace('.', ',')
}

function ExercisePlayerRow({
  defaultExerciseKey,
  defaultVariant,
  exerciseResult,
  isSavingDisabled,
  onCopyPrevious,
  onSave,
  player,
  previousResult,
}: {
  defaultExerciseKey: string
  defaultVariant: ExerciseVariant
  exerciseResult: ExerciseResult | null
  isSavingDisabled: boolean
  onCopyPrevious: (player: Player, previousResult: ExerciseResult) => void
  onSave: ExerciseActions['savePlayerExerciseResult']
  player: Player
  previousResult: ExerciseResult | null
}) {
  const exercise = exercisePreview(player, defaultExerciseKey, defaultVariant, exerciseResult)
  const definition = exerciseDefinitions.find((item) => item.key === exercise.exerciseKey) ?? exerciseDefinitions[0]

  function savePatch(patch: Partial<ExerciseResultPatch>) {
    void onSave(player, {
      sourceResultId: exerciseResult?.id,
      exerciseKey: exercise.exerciseKey,
      variant: exercise.variant,
      sets: exercise.sets,
      reps: exercise.reps,
      loadValue: exercise.loadValue,
      loadUnit: exercise.loadUnit,
      rpe: exercise.rpe,
      rir: exercise.rir,
      techniqueQuality: exercise.techniqueQuality,
      painResponse: exercise.painResponse,
      notes: exercise.notes,
      ...patch,
    })
  }

  function handleTextBlur(field: keyof Pick<ExerciseResultPatch, 'sets' | 'reps' | 'loadValue' | 'rpe' | 'rir' | 'notes'>) {
    return (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      savePatch({ [field]: event.currentTarget.value })
    }
  }

  return (
    <article className="baseline-row">
      <div className="checkin-player-head">
        <div>
          <div className="player-name-line">
            <strong>{player.name}</strong>
            {exerciseResult ? <span className="tag compact">{formatExerciseResult(exerciseResult)}</span> : null}
          </div>
          <p>{player.position} · {player.cluster}</p>
        </div>
        <span className={`sync-pill ${exercise.syncStatus}`}>{syncStatusLabel(exercise.syncStatus)}</span>
      </div>

      <div className="baseline-fields">
        <label className="inline-field">
          <span>Uebung</span>
          <select
            defaultValue={exercise.exerciseKey}
            disabled={isSavingDisabled}
            key={`${exercise.id}-exercise-key`}
            onChange={(event) => savePatch({ exerciseKey: event.currentTarget.value })}
          >
            {exerciseDefinitions.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="control-group">
          <span>Variante</span>
          <div className="button-row compact">
            {exerciseVariants.map((variant) => (
              <button
                className={exercise.variant === variant ? 'segmented active' : 'segmented'}
                disabled={isSavingDisabled}
                key={variant}
                type="button"
                onClick={() => savePatch({ variant })}
              >
                {exerciseVariantLabels[variant]}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-field">
          <span>Sets</span>
          <input
            defaultValue={optionalNumberInput(exercise.sets)}
            disabled={isSavingDisabled}
            inputMode="numeric"
            key={`${exercise.id}-sets`}
            placeholder="3"
            onBlur={handleTextBlur('sets')}
          />
        </label>

        <label className="inline-field">
          <span>Reps</span>
          <input
            defaultValue={exercise.reps}
            disabled={isSavingDisabled}
            key={`${exercise.id}-reps`}
            placeholder="5"
            onBlur={handleTextBlur('reps')}
          />
        </label>

        <label className="inline-field">
          <span>Last {definition.defaultUnit}</span>
          <input
            defaultValue={optionalNumberInput(exercise.loadValue)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${exercise.id}-load`}
            placeholder={definition.defaultUnit}
            onBlur={handleTextBlur('loadValue')}
          />
        </label>

        <label className="inline-field">
          <span>RPE</span>
          <input
            defaultValue={optionalNumberInput(exercise.rpe)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${exercise.id}-rpe`}
            placeholder="7"
            onBlur={handleTextBlur('rpe')}
          />
        </label>

        <label className="inline-field">
          <span>RIR</span>
          <input
            defaultValue={optionalNumberInput(exercise.rir)}
            disabled={isSavingDisabled}
            inputMode="decimal"
            key={`${exercise.id}-rir`}
            placeholder="optional"
            onBlur={handleTextBlur('rir')}
          />
        </label>

        <label className="inline-field">
          <span>Technik</span>
          <select
            defaultValue={exercise.techniqueQuality}
            disabled={isSavingDisabled}
            key={`${exercise.id}-technique`}
            onChange={(event) => savePatch({ techniqueQuality: event.currentTarget.value })}
          >
            {exerciseTechniqueQualities.map((quality) => (
              <option key={quality} value={quality}>
                {quality}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-field">
          <span>Pain Response</span>
          <select
            defaultValue={exercise.painResponse}
            disabled={isSavingDisabled}
            key={`${exercise.id}-pain`}
            onChange={(event) => savePatch({ painResponse: event.currentTarget.value })}
          >
            {exercisePainResponses.map((response) => (
              <option key={response} value={response}>
                {response}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-field wide">
          <span>Exercise-Notiz, keine Diagnose</span>
          <textarea
            defaultValue={exercise.notes}
            disabled={isSavingDisabled}
            key={`${exercise.id}-notes`}
            rows={2}
            placeholder="z. B. sauber, gleiche Last naechste Einheit steigern"
            onBlur={handleTextBlur('notes')}
          />
        </label>

        <button
          className="secondary-action compact-action"
          disabled={isSavingDisabled || !previousResult}
          type="button"
          onClick={() => {
            if (previousResult) {
              onCopyPrevious(player, previousResult)
            }
          }}
        >
          Copy previous player
        </button>
      </div>
    </article>
  )
}

export function PostSessionView({
  authState,
  baselineActions,
  exposureActions,
  exposureBlockLogs,
  exerciseActions,
  lastExportAt,
  metricActions,
  onNavigate,
  onSessionChange,
  postSessionActions,
  returnerCaps,
  selectedSession,
  selectedSessionId,
  sessions,
}: PostSessionViewProps) {
  const [baselineFormError, setBaselineFormError] = useState<string | null>(null)
  const [exerciseDefaultKey, setExerciseDefaultKey] = useState<string>('trap_bar_deadlift')
  const [exerciseDefaultVariant, setExerciseDefaultVariant] = useState<ExerciseVariant>('A')
  const [exerciseDefaultVersion, setExerciseDefaultVersion] = useState(0)
  const [exerciseFormError, setExerciseFormError] = useState<string | null>(null)
  const [metricFormError, setMetricFormError] = useState<string | null>(null)
  const {
    activePlayers,
    entries,
    errorMessage,
    progressEntries,
    warnings,
    syncOverview,
    isLoading,
    sessionLog,
    runSync,
    savePlayerPostSession,
    savePlayerProgress,
    saveSessionPatch,
    getEntryForPlayer,
    getProgressForPlayer,
    clearError,
  } = postSessionActions
  const showSyncAttention = shouldShowSyncAttention(syncOverview)
  const showBaselineSyncAttention = shouldShowSyncAttention(baselineActions.syncOverview)
  const showExerciseSyncAttention = shouldShowSyncAttention(exerciseActions.syncOverview)
  const showExposureSyncAttention = shouldShowSyncAttention(exposureActions.syncOverview)
  const showMetricSyncAttention = shouldShowSyncAttention(metricActions.syncOverview)
  const baselineCompletedCount = baselineActions.entries.filter(
    (entry) => hasPlayerId(entry) && hasBaselineContent(entry),
  ).length
  const metricCompletedCount = new Set(metricActions.entries.filter(hasPlayerId).map((entry) => entry.playerId)).size
  const exerciseCompletedCount = new Set(exerciseActions.entries.filter(hasPlayerId).map((entry) => entry.playerId)).size
  const warningByPlayerId = new Map(warnings.filter(hasPlayerId).map((warning) => [warning.playerId, warning]))
  const presentPlayerIds = new Set(entries.filter((entry) => hasPlayerId(entry) && entry.present).map((entry) => entry.playerId))
  const orderedPlayers = [...activePlayers].sort((a, b) => {
    const aPresent = presentPlayerIds.has(a.id)
    const bPresent = presentPlayerIds.has(b.id)

    if (aPresent === bPresent) {
      return a.name.localeCompare(b.name, 'de-AT')
    }

    return aPresent ? -1 : 1
  })
  const completedCount = entries.filter(
    (entry) => hasPlayerId(entry) && (entry.sessionRpe !== null || entry.e2Decision !== null || entry.nextStep !== null),
  ).length
  const followUpCount = entries.filter(
    (entry) =>
      hasPlayerId(entry) &&
      ((entry.e2Decision !== null && entry.e2Decision !== 'normal') ||
        entry.nextStep === 'reduzieren' ||
        entry.nextStep === 'klaeren' ||
        (entry.postPainScore !== null && entry.postPainScore >= 3)),
  ).length
  const completion = derivePostSessionCompletion({
    activePlayers,
    sessionLog,
    sessionType: selectedSession.type,
    entries,
    progressEntries,
    baselineEntries: baselineActions.entries,
    lastExportAt,
  })
  const missingValues = deriveMissingPostSessionValues({
    activePlayers,
    sessionLog,
    sessionType: selectedSession.type,
    entries,
    progressEntries,
    metricResults: metricActions.entries,
    lastExportAt,
  })
  const playersById = new Map(activePlayers.map((player) => [player.id, player]))

  function handleSessionNumberBlur(field: 'durationMinutes' | 'groupSize') {
    return (event: FormEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value.trim()
      const parsed = value ? Number(value) : null

      if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
        return
      }

      void saveSessionPatch({ [field]: parsed })
    }
  }

  async function handleRunSync() {
    await runSync()
    await baselineActions.refreshBaselines()
    await metricActions.refreshMetrics()
    await exerciseActions.refreshExercises()
  }

  if (authState.status !== 'signed-in') {
    return (
      <div className="content-stack">
        <section className="placeholder" aria-labelledby="post-session-locked-heading">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <h2 id="post-session-locked-heading">Nachbereitung</h2>
          <p>Nachbereitungsdaten werden erst nach Coach-Login in Einstellungen lokal gespeichert und synchronisiert.</p>
        </section>
      </div>
    )
  }

  return (
    <section className="checkin-layout post-session-layout" aria-labelledby="post-session-heading">
      <div className="panel checkin-header">
        <div className="library-heading">
          <p className="eyebrow">Nach dem Training</p>
          <h3 id="post-session-heading">Nachbereitung</h3>
          <p>{selectedSession.title}: sRPE, Pain/Issue, E2, Progression und Follow-ups sichern.</p>
        </div>
        <div className="player-toolbar">
          <SessionPicker
            onSessionChange={onSessionChange}
            selectedSessionId={selectedSessionId}
            sessions={sessions}
          />
          {syncOverview.status === 'error' ||
          baselineActions.syncOverview.status === 'error' ||
          metricActions.syncOverview.status === 'error' ? (
            <button
              className="secondary-action"
              type="button"
              onClick={() => void handleRunSync()}
              disabled={isLoading || baselineActions.isLoading || metricActions.isLoading}
            >
              <RefreshCw className="nav-icon" aria-hidden />
              <span>{isLoading || baselineActions.isLoading || metricActions.isLoading ? 'Sync laeuft...' : 'Retry'}</span>
            </button>
          ) : null}
          <button className="secondary-action" type="button" onClick={() => onNavigate('training')}>
            <UserCheck className="nav-icon" aria-hidden />
            <span>Training</span>
          </button>
        </div>
      </div>

      <div className="metric-grid checkin-metrics">
        <div className="metric">
          <span>Spieler</span>
          <strong>{activePlayers.length}</strong>
        </div>
        <div className="metric">
          <span>Nachbereitet</span>
          <strong>{completedCount}</strong>
        </div>
        <div className="metric">
          <span>Follow-ups</span>
          <strong>{followUpCount}</strong>
        </div>
        <div className="metric">
          <span>Status</span>
          <strong>
            {completion.status === 'teilweise_abgeschlossen'
              ? 'teilweise'
              : completion.status === 'abgeschlossen'
                ? 'abgeschlossen'
                : 'offen'}
          </strong>
        </div>
      </div>

      <MissingValuesPanel
        isMetricSavingDisabled={metricActions.isLoading}
        isPostSavingDisabled={isLoading}
        items={missingValues}
        onMetricParseError={setMetricFormError}
        onMetricSave={metricActions.savePlayerMetric}
        onNavigate={onNavigate}
        onPostSave={savePlayerPostSession}
        onProgressSave={savePlayerProgress}
        onSessionSave={saveSessionPatch}
        playersById={playersById}
      />

      <ClosureChecklist completion={completion} />

      {errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Nachbereitung nicht vollstaendig synchronisiert</strong>
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
          <span>{pendingCountLabel(syncOverview.pendingCount, 'Nachbereitung/Check-in-Änderungen')}</span>
          {syncOverview.errorMessage ? <span>{syncOverview.errorMessage}</span> : null}
        </div>
      ) : null}

      {exposureActions.errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Exposures nicht vollstaendig gespeichert</strong>
          <span>{exposureActions.errorMessage}</span>
          <button className="secondary-action" type="button" onClick={exposureActions.clearError}>
            Schliessen
          </button>
        </div>
      ) : null}

      {showExposureSyncAttention ? (
        <div className="panel checkin-sync-strip">
          <span className={`status-dot ${exposureActions.syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
          <strong>{syncStatusLabel(exposureActions.syncOverview.status)}</strong>
          <span>{pendingCountLabel(exposureActions.syncOverview.pendingCount, 'Exposure-Aenderungen')}</span>
          {exposureActions.syncOverview.errorMessage ? <span>{exposureActions.syncOverview.errorMessage}</span> : null}
        </div>
      ) : null}

      <ExposureReviewPanel
        entries={entries}
        isSavingDisabled={isLoading || exposureActions.isLoading}
        onGenerate={() => {
          void exposureActions.generateExposureSummaries({
            sessionLog,
            blockLogs: exposureBlockLogs,
            entries,
            returnerCaps,
          })
        }}
        onManualOverride={(summary, type, override) => {
          void exposureActions.saveManualOverride(summary, type, override)
        }}
        players={activePlayers}
        sessionLog={sessionLog}
        summaries={exposureActions.summaries}
      />

      <section className="panel post-session-coach-panel" aria-label="Coach Review">
        <div className="training-coach-fields">
          <label className="inline-field">
            <span>Dauer Minuten</span>
            <input
              defaultValue={sessionLog?.durationMinutes ?? ''}
              disabled={isLoading}
              key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-duration`}
              inputMode="numeric"
              placeholder="z. B. 75"
              onBlur={handleSessionNumberBlur('durationMinutes')}
            />
          </label>
          <label className="inline-field">
            <span>Gruppengroesse</span>
            <input
              defaultValue={sessionLog?.groupSize ?? ''}
              disabled={isLoading}
              key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-group`}
              inputMode="numeric"
              placeholder="z. B. 14"
              onBlur={handleSessionNumberBlur('groupSize')}
            />
          </label>
          <label className="inline-field wide">
            <span>Coach Review</span>
            <textarea
              defaultValue={sessionLog?.coachReview ?? ''}
              disabled={isLoading}
              key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-review`}
              rows={3}
              placeholder="Follow-ups, gekuerzte Inhalte, organisatorische Probleme"
              onBlur={(event) => void saveSessionPatch({ coachReview: event.currentTarget.value.trim() })}
            />
          </label>
          <button
            className="primary-action"
            disabled={isLoading}
            type="button"
            onClick={() => void saveSessionPatch({ status: 'completed' })}
          >
            Einheit abschliessen
          </button>
        </div>
      </section>

      <section className="panel baseline-panel" aria-labelledby="metrics-heading">
        <div className="library-heading">
          <p className="eyebrow">Flexible Metrics</p>
          <h3 id="metrics-heading">Metric-Rechecks</h3>
          <p>Broad Jump, Med-Ball Chest Pass und 10 m Sprint erfassen, wenn Timing und Ablauf passen. 30 m bleibt optional/spaeter.</p>
        </div>

        {showMetricSyncAttention ? (
          <div className="panel checkin-sync-strip">
            <span className={`status-dot ${metricActions.syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
            <strong>{syncStatusLabel(metricActions.syncOverview.status)}</strong>
            <span>{pendingCountLabel(metricActions.syncOverview.pendingCount, 'Metric-Aenderungen')}</span>
            <span>{metricCompletedCount} Spieler mit Metrics in dieser Einheit</span>
            {metricActions.syncOverview.errorMessage ? <span>{metricActions.syncOverview.errorMessage}</span> : null}
          </div>
        ) : null}

        {metricFormError || metricActions.errorMessage ? (
          <div className="error-panel" role="alert">
            <strong>Metric nicht vollstaendig gespeichert</strong>
            <span>{metricFormError ?? metricActions.errorMessage}</span>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                setMetricFormError(null)
                metricActions.clearError()
              }}
            >
              Schliessen
            </button>
          </div>
        ) : null}

        <div className="baseline-list">
          {orderedPlayers.map((player) => (
            <MetricPlayerRow
              getMetricForPlayer={metricActions.getMetricForPlayer}
              isSavingDisabled={metricActions.isLoading}
              key={player.id}
              onParseError={setMetricFormError}
              onSave={metricActions.savePlayerMetric}
              player={player}
            />
          ))}
        </div>
      </section>

      <section className="panel baseline-panel" aria-labelledby="exercise-results-heading">
        <div className="library-heading">
          <p className="eyebrow">Structured Exercise Result</p>
          <h3 id="exercise-results-heading">Exercise-Progression</h3>
          <p>Ein Hauptresultat pro Spieler schnell erfassen. Legacy-Progression bleibt darunter sichtbar.</p>
        </div>

        <div className="training-coach-fields">
          <label className="inline-field">
            <span>Session-Default</span>
            <select value={exerciseDefaultKey} onChange={(event) => setExerciseDefaultKey(event.target.value)}>
              {exerciseDefinitions.map((definition) => (
                <option key={definition.key} value={definition.key}>
                  {definition.name}
                </option>
              ))}
            </select>
          </label>
          <div className="control-group">
            <span>Default-Variante</span>
            <div className="button-row compact">
              {exerciseVariants.map((variant) => (
                <button
                  className={exerciseDefaultVariant === variant ? 'segmented active' : 'segmented'}
                  key={variant}
                  type="button"
                  onClick={() => setExerciseDefaultVariant(variant)}
                >
                  {exerciseVariantLabels[variant]}
                </button>
              ))}
            </div>
          </div>
          <button
            className="secondary-action"
            type="button"
            onClick={() => setExerciseDefaultVersion((currentVersion) => currentVersion + 1)}
          >
            Apply to present
          </button>
        </div>

        {showExerciseSyncAttention ? (
          <div className="panel checkin-sync-strip">
            <span className={`status-dot ${exerciseActions.syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
            <strong>{syncStatusLabel(exerciseActions.syncOverview.status)}</strong>
            <span>{pendingCountLabel(exerciseActions.syncOverview.pendingCount, 'Exercise-Aenderungen')}</span>
            <span>{exerciseCompletedCount} Spieler mit Exercise-Result in dieser Einheit</span>
            {exerciseActions.syncOverview.errorMessage ? <span>{exerciseActions.syncOverview.errorMessage}</span> : null}
          </div>
        ) : null}

        {exerciseFormError || exerciseActions.errorMessage ? (
          <div className="error-panel" role="alert">
            <strong>Exercise-Result nicht vollstaendig gespeichert</strong>
            <span>{exerciseFormError ?? exerciseActions.errorMessage}</span>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                setExerciseFormError(null)
                exerciseActions.clearError()
              }}
            >
              Schliessen
            </button>
          </div>
        ) : null}

        <div className="baseline-list">
          {orderedPlayers.map((player, index) => {
            const result =
              exerciseActions.getExerciseResultForPlayer(player, exerciseDefaultKey) ??
              exerciseActions.entries.find((entry) => entry.playerId === player.id) ??
              null
            const previousPlayer = orderedPlayers[index - 1]
            const previousResult = previousPlayer
              ? exerciseActions.getExerciseResultForPlayer(previousPlayer, exerciseDefaultKey) ??
                exerciseActions.entries.find((entry) => entry.playerId === previousPlayer.id) ??
                null
              : null

            return (
              <ExercisePlayerRow
                defaultExerciseKey={exerciseDefaultKey}
                defaultVariant={exerciseDefaultVariant}
                exerciseResult={result}
                isSavingDisabled={exerciseActions.isLoading}
                key={`${player.id}-${exerciseDefaultVersion}`}
                onCopyPrevious={(selectedPlayer, previous) => {
                  void exerciseActions.savePlayerExerciseResult(selectedPlayer, {
                    exerciseKey: previous.exerciseKey,
                    variant: previous.variant,
                    sets: previous.sets,
                    reps: previous.reps,
                    loadValue: previous.loadValue,
                    loadUnit: previous.loadUnit,
                    rpe: previous.rpe,
                    rir: previous.rir,
                    techniqueQuality: previous.techniqueQuality,
                    painResponse: previous.painResponse,
                    notes: previous.notes,
                  }).catch((caughtError: unknown) => {
                    setExerciseFormError(
                      caughtError instanceof Error ? caughtError.message : 'Exercise-Result konnte nicht kopiert werden.',
                    )
                  })
                }}
                onSave={exerciseActions.savePlayerExerciseResult}
                player={player}
                previousResult={previousResult}
              />
            )
          })}
        </div>
      </section>

      <section className="panel baseline-panel" aria-labelledby="baseline-heading">
        <div className="library-heading">
          <p className="eyebrow">Optionaler Re-Check</p>
          <h3 id="baseline-heading">Mini-Baseline / Re-Check</h3>
          <p>Optional erfassen, wenn Gruppe und Ablauf ruhig sind. 30 m bleibt spaeter/optional und wird nicht erzwungen.</p>
        </div>

        {showBaselineSyncAttention ? (
          <div className="panel checkin-sync-strip">
            <span className={`status-dot ${baselineActions.syncOverview.status === 'synced' ? 'online' : ''}`} aria-hidden />
            <strong>{syncStatusLabel(baselineActions.syncOverview.status)}</strong>
            <span>{pendingCountLabel(baselineActions.syncOverview.pendingCount, 'Baseline-Aenderungen')}</span>
            <span>{baselineCompletedCount} Spieler mit Testwerten in dieser Einheit</span>
            {baselineActions.syncOverview.errorMessage ? <span>{baselineActions.syncOverview.errorMessage}</span> : null}
          </div>
        ) : null}

        {baselineFormError || baselineActions.errorMessage ? (
          <div className="error-panel" role="alert">
            <strong>Baseline nicht vollstaendig gespeichert</strong>
            <span>{baselineFormError ?? baselineActions.errorMessage}</span>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                setBaselineFormError(null)
                baselineActions.clearError()
              }}
            >
              Schliessen
            </button>
          </div>
        ) : null}

        <div className="baseline-list">
          {orderedPlayers.map((player) => (
            <BaselinePlayerRow
              baselineEntry={baselineActions.getBaselineForPlayer(player)}
              isSavingDisabled={baselineActions.isLoading}
              key={player.id}
              onParseError={setBaselineFormError}
              onSave={baselineActions.savePlayerBaseline}
              player={player}
            />
          ))}
        </div>
      </section>

      <div className="checkin-list">
        {orderedPlayers.map((player) => (
          <PostSessionPlayerRow
            entry={getEntryForPlayer(player)}
            isSavingDisabled={isLoading}
            key={player.id}
            onPostSave={savePlayerPostSession}
            onProgressSave={savePlayerProgress}
            player={player}
            progressEntry={getProgressForPlayer(player)}
            sessionDuration={sessionLog?.durationMinutes ?? null}
            warning={warningByPlayerId.get(player.id)}
          />
        ))}
      </div>

      {activePlayers.length === 0 ? (
        <section className="placeholder">
          <UserCheck className="placeholder-icon" aria-hidden />
          <h2>Noch keine aktiven Spieler</h2>
          <p>Lege zuerst Spieler im Spieler-Tab an. Danach erscheinen sie hier automatisch in der Nachbereitung.</p>
        </section>
      ) : null}
    </section>
  )
}
