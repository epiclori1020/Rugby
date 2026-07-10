import { AlertTriangle, ClipboardCheck, RefreshCw, ShieldAlert, UserCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { routes, type AppRoute } from '../navigation'
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
import { derivePostSessionCompletion } from '../domain/postSessionCompletion'
import { deriveMissingPostSessionValues, type MissingPostSessionValue } from '../domain/postSessionMissingValues'
import type { Player } from '../domain/players'
import type { ReturnerCapSummary } from '../domain/returners'
import type { SessionBlockLog } from '../domain/sessionBlocks'
import type { useBaselines } from '../hooks/useBaselines'
import type { useExposures } from '../hooks/useExposures'
import type { useExercises } from '../hooks/useExercises'
import type { useMetrics } from '../hooks/useMetrics'
import type { usePostSession } from '../hooks/usePostSession'
import { useActionFeedback } from '../hooks/useActionFeedback'
import type { AuthSessionState } from '../lib/auth'
import { hasPlayerId } from '../lib/playerId'
import { pendingCountLabel, shouldShowSyncAttention, syncStatusLabel } from '../lib/syncLabels'
import { TaskQueueRow } from './onfield'
import { ExposureReviewPanel } from './ExposureReviewPanel'
import { SessionPicker } from './SessionPicker'
import { ActionFeedback } from './ui/ActionFeedback'
import { PainScale, PrimaryButton, SecondaryButton } from './ui'

type PostSessionActions = ReturnType<typeof usePostSession>
type BaselineActions = ReturnType<typeof useBaselines>
type ExposureActions = ReturnType<typeof useExposures>
type ExerciseActions = ReturnType<typeof useExercises>
type MetricActions = ReturnType<typeof useMetrics>
type SaveSyncStatus = 'synced' | 'pending' | 'error'

type PostSessionViewProps = {
  authState: AuthSessionState
  baselineActions: BaselineActions
  exposureActions: ExposureActions
  exposureBlockLogs: SessionBlockLog[]
  exerciseActions: ExerciseActions
  lastExportAt: string | null
  metricActions: MetricActions
  onNavigate: (route: AppRoute) => void
  onSessionChange: (sessionId: string) => void
  postSessionActions: PostSessionActions
  returnerCaps: ReturnerCapSummary[]
  selectedSession: SessionDefinition
  selectedSessionId: string
  sessions: SessionDefinition[]
  showSessionPicker?: boolean
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

function syncStatusFromSaveResult(result: unknown): SaveSyncStatus | undefined {
  if (!result || typeof result !== 'object') {
    return undefined
  }

  if ('syncStatus' in result && typeof result.syncStatus === 'string') {
    return result.syncStatus as SaveSyncStatus
  }

  if ('entry' in result && result.entry && typeof result.entry === 'object' && 'syncStatus' in result.entry) {
    const syncStatus = result.entry.syncStatus
    return typeof syncStatus === 'string' ? (syncStatus as SaveSyncStatus) : undefined
  }

  if ('value' in result && result.value && typeof result.value === 'object' && 'syncStatus' in result.value) {
    const syncStatus = result.value.syncStatus
    return typeof syncStatus === 'string' ? (syncStatus as SaveSyncStatus) : undefined
  }

  return undefined
}

function errorMessageFromSaveResult(result: unknown) {
  if (!result || typeof result !== 'object') {
    return undefined
  }

  if ('errorMessage' in result && typeof result.errorMessage === 'string') {
    return result.errorMessage
  }

  if ('error' in result && typeof result.error === 'string') {
    return result.error
  }

  return undefined
}

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
    warning.postPainScore !== null ? `Beschwerden nach Training ${warning.postPainScore}/10` : null,
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

function MissingValuesPanel({
  isMetricSavingDisabled,
  isPostSavingDisabled,
  items,
  onMetricParseError,
  onMetricSave,
  onNavigate,
  onPostSave,
  onProgressSave,
  playersById,
}: {
  isMetricSavingDisabled: boolean
  isPostSavingDisabled: boolean
  items: MissingPostSessionValue[]
  onMetricParseError: (message: string | null) => void
  onMetricSave: MetricActions['savePlayerMetric']
  onNavigate: (route: AppRoute) => void
  onPostSave: PostSessionActions['savePlayerPostSession']
  onProgressSave: PostSessionActions['savePlayerProgress']
  playersById: Map<string, Player>
}) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const activeTask = items.find((item) => item.id === activeTaskId) ?? items[0] ?? null

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

  function focusDurationInput() {
    if (typeof document === 'undefined') {
      return
    }

    document.getElementById('post-session-duration-input')?.focus()
  }

  function severityLabel(item: MissingPostSessionValue) {
    if (item.severity === 'required') {
      return 'Pflicht'
    }

    if (item.severity === 'expected') {
      return 'Erwartet'
    }

    return 'Optional'
  }

  function targetLabel(item: MissingPostSessionValue) {
    if (item.kind === 'session_status') {
      return 'Abschluss'
    }

    if (item.target === 'session') {
      return 'Einheit'
    }

    if (item.target === 'post_session') {
      return 'Spielerwert'
    }

    if (item.target === 'progression') {
      return 'Progression'
    }

    if (item.target === 'metric') {
      return 'Metric'
    }

    return 'Backup'
  }

  function taskTone(item: MissingPostSessionValue) {
    if (item.severity === 'required') {
      return 'danger' as const
    }

    if (item.severity === 'expected') {
      return 'warning' as const
    }

    return 'neutral' as const
  }

  function renderAction(item: MissingPostSessionValue) {
    if (item.kind === 'missing_duration') {
      return (
        <SecondaryButton compact disabled={isPostSavingDisabled} disabledReason={isPostSavingDisabled ? 'Speichern laeuft gerade.' : undefined} onClick={focusDurationInput}>
          Dauerfeld fokussieren
        </SecondaryButton>
      )
    }

    if (item.kind === 'backup_export') {
      return (
        <SecondaryButton compact onClick={() => onNavigate(routes.moreExport)}>
          Export
        </SecondaryButton>
      )
    }

    const player = item.playerId ? playersById.get(item.playerId) : undefined
    if (!player) {
      return null
    }

    if (item.kind === 'missing_srpe' || item.kind === 'missing_post_pain') {
      return (
        <PainScale
          label={`${item.label} ${player.name}`}
          value={null}
          onChange={(value) => {
            if (isPostSavingDisabled) {
              return
            }

            const patch = item.kind === 'missing_srpe' ? { sessionRpe: value } : { postPainScore: value }
            void onPostSave(player, patch)
          }}
        />
      )
    }

    if (item.kind === 'missing_e2') {
      return (
        <div className="button-row compact">
          {e2Options.map((option) => (
            <SecondaryButton
              compact
              disabled={isPostSavingDisabled}
              key={option.value}
              onClick={() => void onPostSave(player, { e2Decision: option.value })}
            >
              {option.label}
            </SecondaryButton>
          ))}
        </div>
      )
    }

    if (item.kind === 'missing_next_step') {
      return (
        <div className="button-row compact">
          {nextStepOptions.map((option) => (
            <SecondaryButton
              compact
              disabled={isPostSavingDisabled}
              key={option.value}
              onClick={() => void onProgressSave(player, { nextStep: option.value })}
            >
              {option.label}
            </SecondaryButton>
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
        <p className="eyebrow">Nachbereitung</p>
        <h3 id="missing-values-heading">Nachbereitungsqueue</h3>
        <p>Pflichtaufgaben zuerst; erwartete und optionale Werte blockieren den Abschluss nicht.</p>
      </div>

      {items.length === 0 ? (
        <TaskQueueRow
          title="Keine offenen Pflichtaufgaben"
          detail="Die Nachbereitung ist fachlich abgeschlossen; optionale Details kannst du unten nachtragen."
          meta={['Fertig']}
          tone="success"
        />
      ) : (
        <div className="post-session-queue-workflow">
          <div className="post-session-queue-list" aria-label="Nachbereitungsqueue">
            {items.map((item) => {
              const isActive = activeTask?.id === item.id
              return (
                <TaskQueueRow
                  action={
                    <SecondaryButton compact onClick={() => setActiveTaskId(item.id)}>
                      {isActive ? 'Aktiv' : 'Oeffnen'}
                    </SecondaryButton>
                  }
                  ariaCurrent={isActive ? 'step' : undefined}
                  className={isActive ? 'post-session-queue-row-active' : undefined}
                  detail={item.helperText}
                  key={item.id}
                  meta={[
                    severityLabel(item),
                    targetLabel(item),
                    item.playerName ?? 'Einheit',
                    ...(isActive ? ['Aktiv'] : []),
                  ]}
                  title={item.playerName ? `${item.playerName}: ${item.label}` : item.label}
                  tone={taskTone(item)}
                />
              )
            })}
          </div>

          {activeTask ? (
            <div className="post-session-active-task" aria-labelledby="active-post-session-task-heading">
              <p className="eyebrow">Aktiver Schritt</p>
              <h3 id="active-post-session-task-heading">
                {activeTask.playerName ? `${activeTask.playerName}: ${activeTask.label}` : activeTask.label}
              </h3>
              <p>{activeTask.helperText}</p>
              <div className="post-session-task-meta">
                <span>{severityLabel(activeTask)}</span>
                <span>{targetLabel(activeTask)}</span>
                {activeTask.playerName ? <span>{activeTask.playerName}</span> : null}
              </div>
              <div className="post-session-task-actions">{renderAction(activeTask)}</div>
            </div>
          ) : null}
        </div>
      )}

      <details className="post-session-secondary-section">
        <summary>Optional nachtragen</summary>
        <p>Flexible Metrics, Exercise-Result, Mini-Baseline und alle Spielerdetails liegen unten als sekundäre Bereiche.</p>
      </details>
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
  const savingReasonId = `${entry.id}-post-session-saving-reason`

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

      {isSavingDisabled ? (
        <p className="disabled-action-reason" id={savingReasonId}>
          Speichern laeuft gerade.
        </p>
      ) : null}

      <div
        aria-busy={isSavingDisabled || undefined}
        aria-describedby={isSavingDisabled ? savingReasonId : undefined}
        className="checkin-controls post-session-controls"
      >
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

        <div className="control-group" aria-label={`Beschwerden nach Training ${player.name}`}>
          <span>Beschwerden nach Training</span>
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
          <span>Ort/Issue nach Training</span>
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
          <span>Follow-up bedeutet coachseitige Klaerung oder Anpassung; medizinische Entscheidungen bleiben extern.</span>
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
          <span>Beschwerden-Reaktion</span>
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
          Vorheriges Resultat kopieren
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
  showSessionPicker = true,
}: PostSessionViewProps) {
  const [baselineFormError, setBaselineFormError] = useState<string | null>(null)
  const [exerciseDefaultKey, setExerciseDefaultKey] = useState<string>('trap_bar_deadlift')
  const [exerciseDefaultVariant, setExerciseDefaultVariant] = useState<ExerciseVariant>('A')
  const [exerciseDefaultVersion, setExerciseDefaultVersion] = useState(0)
  const [exerciseFormError, setExerciseFormError] = useState<string | null>(null)
  const [metricFormError, setMetricFormError] = useState<string | null>(null)
  const actionFeedback = useActionFeedback()
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
  const closeoutBlockers = completion.blockers.filter((blocker) => blocker.kind !== 'session_status')
  const firstCloseoutBlocker = closeoutBlockers[0] ?? null
  const isSessionCompleted = sessionLog?.status === 'completed'
  const closeoutDisabled = isLoading || !sessionLog || isSessionCompleted || closeoutBlockers.length > 0
  const closeoutDisabledReason = isLoading
    ? 'Speichern läuft gerade.'
    : !sessionLog
      ? 'Noch keine lokale Einheit für den Abschluss vorhanden.'
      : firstCloseoutBlocker?.label

  function handleSessionNumberBlur(field: 'durationMinutes' | 'groupSize') {
    return (event: FormEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value.trim()
      const parsed = value ? Number(value) : null

      if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
        return
      }

      void saveWithFeedback(() => saveSessionPatch({ [field]: parsed }))
    }
  }

  function applySaveFeedback(result: unknown) {
    if (result && typeof result === 'object' && 'ok' in result && result.ok === false) {
      actionFeedback.showError(errorMessageFromSaveResult(result))
      return
    }

    actionFeedback.showSaved(syncStatusFromSaveResult(result))
  }

  async function saveWithFeedback<T>(saveOperation: () => Promise<T>) {
    try {
      const result = await saveOperation()
      applySaveFeedback(result)
      return result
    } catch (caughtError) {
      actionFeedback.showError(caughtError instanceof Error ? caughtError.message : undefined)
      throw caughtError
    }
  }

  const savePlayerPostSessionWithFeedback: PostSessionActions['savePlayerPostSession'] = (player, patch) =>
    saveWithFeedback(() => savePlayerPostSession(player, patch))

  const savePlayerProgressWithFeedback: PostSessionActions['savePlayerProgress'] = (player, patch) =>
    saveWithFeedback(() => savePlayerProgress(player, patch))

  const saveSessionPatchWithFeedback: PostSessionActions['saveSessionPatch'] = (patch) =>
    saveWithFeedback(() => saveSessionPatch(patch))

  const savePlayerBaselineWithFeedback: BaselineActions['savePlayerBaseline'] = (player, patch) =>
    saveWithFeedback(() => baselineActions.savePlayerBaseline(player, patch))

  const savePlayerMetricWithFeedback: MetricActions['savePlayerMetric'] = (player, patch) =>
    saveWithFeedback(() => metricActions.savePlayerMetric(player, patch))

  const savePlayerExerciseResultWithFeedback: ExerciseActions['savePlayerExerciseResult'] = (player, patch) =>
    saveWithFeedback(() => exerciseActions.savePlayerExerciseResult(player, patch))

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
          <p>{selectedSession.title}: sRPE, Beschwerden/Issue, E2, Progression und Follow-ups sichern.</p>
        </div>
        <div className="player-toolbar">
          {showSessionPicker ? (
            <SessionPicker
              onSessionChange={onSessionChange}
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
          ) : null}
          {syncOverview.status === 'error' ||
          baselineActions.syncOverview.status === 'error' ||
          metricActions.syncOverview.status === 'error' ? (
            <SecondaryButton
              icon={<RefreshCw className="nav-icon" aria-hidden />}
              isLoading={isLoading || baselineActions.isLoading || metricActions.isLoading}
              loadingLabel="Sync laeuft"
              onClick={() => void handleRunSync()}
            >
              Erneut synchronisieren
            </SecondaryButton>
          ) : null}
          <button className="secondary-action" type="button" onClick={() => onNavigate(routes.unitTraining)}>
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

      <section className="panel post-session-duration-strip" aria-label="Session-Dauer">
        <div className="library-heading">
          <p className="eyebrow">Einheit</p>
          <h3>Dauer Minuten</h3>
          <p>Einmal oben erfassen; daraus bleiben Session Load und Abschlussstatus ableitbar.</p>
        </div>
        <label className="inline-field">
          <span>Dauer Minuten</span>
          <input
            defaultValue={sessionLog?.durationMinutes ?? ''}
            disabled={isLoading}
            id="post-session-duration-input"
            key={`${selectedSessionId}-${sessionLog?.id ?? 'new'}-duration`}
            inputMode="numeric"
            placeholder="z. B. 75"
            onBlur={handleSessionNumberBlur('durationMinutes')}
          />
        </label>
        <div className="sync-mini">
          <span className={`status-dot ${completion.blockers.length === 0 ? 'online' : ''}`} aria-hidden />
          <strong>
            {completion.blockers.length === 0
              ? 'Pflichtwerte geklaert'
              : `${completion.blockers.length} Pflichtaufgabe(n) offen`}
          </strong>
          {completion.advisories.length > 0 ? <span>{completion.advisories.length} optionale Hinweise</span> : null}
        </div>
      </section>

      <MissingValuesPanel
        isMetricSavingDisabled={metricActions.isLoading}
        isPostSavingDisabled={isLoading}
        items={missingValues}
        onMetricParseError={setMetricFormError}
        onMetricSave={savePlayerMetricWithFeedback}
        onNavigate={onNavigate}
        onPostSave={savePlayerPostSessionWithFeedback}
        onProgressSave={savePlayerProgressWithFeedback}
        playersById={playersById}
      />

      <section className="post-session-sticky-closeout" aria-label="Einheit Abschluss">
        <div>
          <p className="eyebrow">Nächster Pflichtschritt</p>
          <strong>{isSessionCompleted ? 'Einheit abgeschlossen' : firstCloseoutBlocker?.label ?? 'Pflichtwerte geklärt'}</strong>
          {!isSessionCompleted && firstCloseoutBlocker ? <span>{firstCloseoutBlocker.playerNames.join(', ')}</span> : null}
        </div>
        <PrimaryButton
          disabled={closeoutDisabled}
          disabledReason={closeoutDisabled ? closeoutDisabledReason : undefined}
          isLoading={isLoading}
          loadingLabel="Einheit wird abgeschlossen"
          onClick={() => void saveSessionPatchWithFeedback({ status: 'completed' })}
        >
          {isSessionCompleted ? 'Einheit abgeschlossen' : 'Einheit abschliessen'}
        </PrimaryButton>
      </section>

      {errorMessage ? (
        <div className="panel error-panel" role="alert">
          <strong>Nachbereitung nicht vollstaendig synchronisiert</strong>
          <span>{errorMessage}</span>
          <button className="secondary-action" type="button" onClick={clearError}>
            Schliessen
          </button>
        </div>
      ) : null}

      <ActionFeedback feedback={actionFeedback.feedback} />

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

      <details className="panel post-session-secondary-section">
        <summary>Exposures</summary>
        <ExposureReviewPanel
          entries={entries}
          isSavingDisabled={isLoading || exposureActions.isLoading}
          onGenerate={() => {
            void saveWithFeedback(() =>
              exposureActions.generateExposureSummaries({
                sessionLog,
                blockLogs: exposureBlockLogs,
                entries,
                returnerCaps,
              }),
            )
          }}
          onManualOverride={(summary, type, override) => {
            void saveWithFeedback(() => exposureActions.saveManualOverride(summary, type, override))
          }}
          players={activePlayers}
          sessionLog={sessionLog}
          summaries={exposureActions.summaries}
        />
      </details>

      <details className="panel post-session-secondary-section post-session-coach-panel">
        <summary>Coach Review</summary>
        <div className="training-coach-fields">
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
              onBlur={(event) => void saveSessionPatchWithFeedback({ coachReview: event.currentTarget.value.trim() })}
            />
          </label>
        </div>
      </details>

      <details className="panel baseline-panel post-session-secondary-section" aria-labelledby="metrics-heading">
        <summary>Flexible Metrics</summary>
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
              onSave={savePlayerMetricWithFeedback}
              player={player}
            />
          ))}
        </div>
      </details>

      <details className="panel baseline-panel post-session-secondary-section" aria-labelledby="exercise-results-heading">
        <summary>Exercise-Resultate</summary>
        <div className="library-heading">
          <p className="eyebrow">Exercise-Resultate</p>
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
            Auf Anwesende anwenden
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
                  void savePlayerExerciseResultWithFeedback(selectedPlayer, {
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
                onSave={savePlayerExerciseResultWithFeedback}
                player={player}
                previousResult={previousResult}
              />
            )
          })}
        </div>
      </details>

      <details className="panel baseline-panel post-session-secondary-section" aria-labelledby="baseline-heading">
        <summary>Mini-Baseline / Re-Check</summary>
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
              onSave={savePlayerBaselineWithFeedback}
              player={player}
            />
          ))}
        </div>
      </details>

      <details className="panel post-session-secondary-section">
        <summary>Alle Spielerdetails</summary>
        <div className="checkin-list">
          {orderedPlayers.map((player) => (
            <PostSessionPlayerRow
              entry={getEntryForPlayer(player)}
              isSavingDisabled={isLoading}
              key={player.id}
              onPostSave={savePlayerPostSessionWithFeedback}
              onProgressSave={savePlayerProgressWithFeedback}
              player={player}
              progressEntry={getProgressForPlayer(player)}
              sessionDuration={sessionLog?.durationMinutes ?? null}
              warning={warningByPlayerId.get(player.id)}
            />
          ))}
        </div>
      </details>

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
