import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import type { SessionBlockExercise, SessionDefinition } from '../content/types'
import {
  getDefaultLiveSessionStep,
  getLiveSessionStep,
  getNextLiveSessionStep,
  getPreviousLiveSessionStep,
} from '../domain/liveSession'
import { getExerciseDefinition } from '../domain/exercises'
import { getMetricDefinition } from '../domain/metrics'
import type { Player } from '../domain/players'
import {
  isReasonRequiredForStatus,
  sessionBlockReasonLabels,
  sessionBlockReasons,
  sessionBlockStatusLabels,
  sessionBlockStatuses,
  validateSessionBlockStatusReason,
  type SessionBlockLog,
  type SessionBlockReason,
  type SessionBlockStatus,
} from '../domain/sessionBlocks'
import type { useExercises } from '../hooks/useExercises'
import type { useMetrics } from '../hooks/useMetrics'
import { syncStatusLabel } from '../lib/syncLabels'

const selectableBlockReasons = sessionBlockReasons.filter((reason) => reason !== 'none')

type MetricActions = ReturnType<typeof useMetrics>
type ExerciseActions = ReturnType<typeof useExercises>

function normalizeTargetName(value: string) {
  return value
    .toLocaleLowerCase('de-AT')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function normalizeTargetTokens(value: string) {
  return value
    .toLocaleLowerCase('de-AT')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function playerMatchesTargetName(playerName: string, targetName: string) {
  const normalizedTarget = normalizeTargetName(targetName)
  if (!normalizedTarget) {
    return false
  }

  const playerFullName = normalizeTargetName(playerName)
  const targetTokens = normalizeTargetTokens(targetName)

  return (
    playerFullName === normalizedTarget ||
    normalizeTargetTokens(playerName).includes(normalizedTarget) ||
    (targetTokens.length > 1 && playerFullName.endsWith(normalizedTarget))
  )
}

const targetingLabels: Record<SessionBlockExercise['targeting'], string> = {
  all: 'Alle Spieler',
  cluster: 'Cluster',
  named: 'Gezielte Spieler',
  optional: 'Optional',
  returner: 'Returner',
}

type LiveSessionStepperProps = {
  blockLogs: SessionBlockLog[]
  currentBlockKey: string | null
  exerciseActions?: ExerciseActions
  isSavingDisabled: boolean
  metricActions?: MetricActions
  onCurrentBlockKeyChange: (blockKey: string | null) => void
  onSaveBlockLog: (
    blockKey: string,
    patch: { status: SessionBlockStatus; reason: SessionBlockReason; coachNote: string },
  ) => void
  players?: Player[]
  session: SessionDefinition
}

function targetPlayersForExercise(exercise: SessionBlockExercise, players: Player[]) {
  if (exercise.targeting === 'named') {
    return exercise.playerNames?.length
      ? players.filter((player) => exercise.playerNames?.some((name) => playerMatchesTargetName(player.name, name)))
      : []
  }

  if (exercise.targeting === 'cluster') {
    return exercise.clusters?.length ? players.filter((player) => exercise.clusters?.includes(player.cluster)) : []
  }

  if (exercise.targeting === 'returner') {
    return players.filter((player) => player.returnerStatus === 'ja')
  }

  return players
}

function ExerciseDetailCard({
  exercise,
  exerciseActions,
  isSavingDisabled,
  metricActions,
  players,
}: {
  exercise: SessionBlockExercise
  exerciseActions?: ExerciseActions
  isSavingDisabled: boolean
  metricActions?: MetricActions
  players: Player[]
}) {
  const targetPlayers = targetPlayersForExercise(exercise, players)
  const [selectedPlayerId, setSelectedPlayerId] = useState(targetPlayers[0]?.id ?? '')
  const selectedPlayer = targetPlayers.find((player) => player.id === selectedPlayerId) ?? targetPlayers[0] ?? null
  const metricResult = selectedPlayer && exercise.metricKey ? metricActions?.getMetricForPlayer(selectedPlayer, exercise.metricKey) : null
  const exerciseResult =
    selectedPlayer && exercise.exerciseKey ? exerciseActions?.getExerciseResultForPlayer(selectedPlayer, exercise.exerciseKey) : null
  const metricDefinition = exercise.metricKey ? getMetricDefinition(exercise.metricKey) : null
  const exerciseDefinition = exercise.exerciseKey ? getExerciseDefinition(exercise.exerciseKey) : null

  function handleMetricBlur(event: FormEvent<HTMLInputElement>) {
    if (!selectedPlayer || !exercise.metricKey || !metricActions) {
      return
    }

    void metricActions.savePlayerMetric(selectedPlayer, {
      metricKey: exercise.metricKey,
      value: event.currentTarget.value,
      contextNote: exercise.name,
    })
  }

  function handleExerciseBlur(event: FormEvent<HTMLFormElement>) {
    if (!selectedPlayer || !exercise.exerciseKey || !exerciseActions) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const sets = formData.get('sets')?.toString() ?? ''
    const reps = formData.get('reps')?.toString() ?? ''
    const loadValue = formData.get('loadValue')?.toString() ?? ''
    const rpe = formData.get('rpe')?.toString() ?? ''

    if (![sets, reps, loadValue, rpe].some((value) => value.trim().length > 0)) {
      return
    }

    void exerciseActions.savePlayerExerciseResult(selectedPlayer, {
      exerciseKey: exercise.exerciseKey,
      sets,
      reps,
      loadValue,
      rpe,
      notes: exercise.name,
    })
  }

  return (
    <article className="session-exercise-card">
      <div className="checkin-player-head">
        <div>
          <strong>{exercise.name}</strong>
          <p>{exercise.prescription}</p>
        </div>
        <span className="tag compact">{targetingLabels[exercise.targeting]}</span>
      </div>
      <div className="tag-row">
        {exercise.coachingCues.map((cue) => (
          <span className="tag compact" key={cue}>
            {cue}
          </span>
        ))}
      </div>
      {exercise.setup ? <p><strong>Setup:</strong> {exercise.setup}</p> : null}
      {exercise.regression ? <p><strong>Regression:</strong> {exercise.regression}</p> : null}
      {exercise.safety ? <p className="action-feedback visible"><strong>Safety:</strong> {exercise.safety}</p> : null}

      {exercise.recording === 'metric' && metricActions && metricDefinition ? (
        <div className="training-coach-fields live-capture">
          <label className="inline-field">
            <span>Spieler</span>
            <select
              value={selectedPlayer?.id ?? ''}
              disabled={isSavingDisabled || targetPlayers.length === 0}
              onChange={(event) => setSelectedPlayerId(event.target.value)}
            >
              {targetPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-field">
            <span>{metricDefinition.name} ({metricDefinition.unit})</span>
            <input
              defaultValue={metricResult?.value ?? ''}
              disabled={isSavingDisabled || !selectedPlayer}
              inputMode="decimal"
              key={`${selectedPlayer?.id ?? 'none'}-${exercise.metricKey}-metric`}
              onBlur={handleMetricBlur}
            />
          </label>
        </div>
      ) : null}

      {exercise.recording === 'exercise' && exerciseActions && exerciseDefinition ? (
        <form className="training-coach-fields live-capture" onBlur={handleExerciseBlur}>
          <label className="inline-field">
            <span>Spieler</span>
            <select
              value={selectedPlayer?.id ?? ''}
              disabled={isSavingDisabled || targetPlayers.length === 0}
              onChange={(event) => setSelectedPlayerId(event.target.value)}
            >
              {targetPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-field">
            <span>Sets</span>
            <input
              defaultValue={exerciseResult?.sets ?? ''}
              disabled={isSavingDisabled || !selectedPlayer}
              inputMode="numeric"
              key={`${selectedPlayer?.id ?? 'none'}-${exercise.exerciseKey}-sets`}
              name="sets"
            />
          </label>
          <label className="inline-field">
            <span>Reps</span>
            <input
              defaultValue={exerciseResult?.reps ?? ''}
              disabled={isSavingDisabled || !selectedPlayer}
              key={`${selectedPlayer?.id ?? 'none'}-${exercise.exerciseKey}-reps`}
              name="reps"
            />
          </label>
          <label className="inline-field">
            <span>Last ({exerciseDefinition.defaultUnit})</span>
            <input
              defaultValue={exerciseResult?.loadValue ?? ''}
              disabled={isSavingDisabled || !selectedPlayer}
              inputMode="decimal"
              key={`${selectedPlayer?.id ?? 'none'}-${exercise.exerciseKey}-loadValue`}
              name="loadValue"
            />
          </label>
          <label className="inline-field">
            <span>RPE</span>
            <input
              defaultValue={exerciseResult?.rpe ?? ''}
              disabled={isSavingDisabled || !selectedPlayer}
              inputMode="decimal"
              key={`${selectedPlayer?.id ?? 'none'}-${exercise.exerciseKey}-rpe`}
              name="rpe"
            />
          </label>
        </form>
      ) : null}
    </article>
  )
}

function StepStatusControls({
  blockTitle,
  blockKey,
  isSavingDisabled,
  log,
  onSave,
}: {
  blockTitle: string
  blockKey: string
  isSavingDisabled: boolean
  log: SessionBlockLog | null
  onSave: (patch: { status: SessionBlockStatus; reason: SessionBlockReason; coachNote: string }) => void
}) {
  const [draftStatus, setDraftStatus] = useState<SessionBlockStatus>(log?.status ?? 'planned')
  const [draftReason, setDraftReason] = useState<SessionBlockReason>(log?.reason ?? 'none')
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const noteValue = log?.coachNote ?? ''

  function persist(status: SessionBlockStatus, reason: SessionBlockReason, coachNote: string) {
    if (!log && status === 'planned' && reason === 'none' && coachNote.trim() === '') {
      setValidationMessage(null)
      return
    }

    const validation = validateSessionBlockStatusReason(status, reason)
    if (!validation.valid) {
      setValidationMessage(validation.error)
      return
    }

    setValidationMessage(null)
    onSave({ status, reason, coachNote })
  }

  function handleStatusClick(status: SessionBlockStatus) {
    setDraftStatus(status)

    if (isReasonRequiredForStatus(status)) {
      setDraftReason(log?.reason && log.reason !== 'none' ? log.reason : 'none')
      setValidationMessage(null)
      return
    }

    setDraftReason('none')
    persist(status, 'none', noteValue)
  }

  function handleReasonChange(reason: SessionBlockReason) {
    setDraftReason(reason)
    persist(draftStatus, reason, noteValue)
  }

  function handleNoteBlur(event: FormEvent<HTMLTextAreaElement>) {
    persist(draftStatus, draftReason, event.currentTarget.value)
  }

  const showReason = isReasonRequiredForStatus(draftStatus)

  return (
    <div className="session-block-controls live-step-controls">
      <div className="button-row training-actions" aria-label="Status aktuelle Phase">
        {sessionBlockStatuses.map((status) => (
          <button
            className={draftStatus === status ? 'segmented active' : 'segmented'}
            disabled={isSavingDisabled}
            key={status}
            type="button"
            onClick={() => handleStatusClick(status)}
          >
            {sessionBlockStatusLabels[status]}
          </button>
        ))}
      </div>
      {showReason ? (
        <label className="inline-field">
          <span>Grund</span>
          <select
            aria-label={`Grund ${blockTitle}`}
            disabled={isSavingDisabled}
            value={draftReason}
            onChange={(event) => handleReasonChange(event.target.value as SessionBlockReason)}
          >
            <option value="none">Grund waehlen</option>
            {selectableBlockReasons.map((reason) => (
              <option key={reason} value={reason}>
                {sessionBlockReasonLabels[reason]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="inline-field wide">
        <span>Notiz</span>
        <textarea
          aria-label={`Blocknotiz ${blockTitle}`}
          defaultValue={noteValue}
          disabled={isSavingDisabled}
          key={`${blockKey}-${log?.id ?? 'new'}-note`}
          rows={2}
          placeholder="optional"
          onBlur={handleNoteBlur}
        />
      </label>
      {log ? <span className={`sync-pill ${log.syncStatus}`}>{syncStatusLabel(log.syncStatus)}</span> : null}
      {validationMessage ? <p className="action-feedback visible">{validationMessage}</p> : null}
    </div>
  )
}

export function LiveSessionStepper({
  blockLogs,
  currentBlockKey,
  exerciseActions,
  isSavingDisabled,
  metricActions,
  onCurrentBlockKeyChange,
  onSaveBlockLog,
  players = [],
  session,
}: LiveSessionStepperProps) {
  const currentStep = useMemo(
    () => getLiveSessionStep(session, blockLogs, currentBlockKey),
    [blockLogs, currentBlockKey, session],
  )
  const defaultStep = useMemo(() => getDefaultLiveSessionStep(session, blockLogs), [blockLogs, session])
  const step = currentStep ?? defaultStep

  if (!step) {
    return null
  }

  const previousStep = getPreviousLiveSessionStep(session, blockLogs, step.block.key)
  const nextStep = getNextLiveSessionStep(session, blockLogs, step.block.key)
  const isFirst = step.index === 0
  const isLast = step.index === step.total - 1

  function goToPreviousStep() {
    if (previousStep) {
      onCurrentBlockKeyChange(previousStep.block.key)
    }
  }

  function goToNextStep() {
    if (nextStep) {
      onCurrentBlockKeyChange(nextStep.block.key)
    }
  }

  return (
    <section className="panel live-session-stepper" aria-labelledby="live-session-step-heading">
      <div className="live-step-heading">
        <div>
          <p className="eyebrow">Aktuelle Phase</p>
          <h3 id="live-session-step-heading">{step.block.title}</h3>
          <p>
            Schritt {step.index + 1} von {step.total} · Status {sessionBlockStatusLabels[step.status]}
          </p>
        </div>
        <span className="tag compact">{step.block.time}</span>
      </div>

      <div className="live-step-work">
        <Play className="nav-icon" aria-hidden />
        <p>{step.block.work}</p>
      </div>

      <div className="tag-row">
        {step.block.dose ? <span className="tag compact">{step.block.dose}</span> : null}
        {step.block.note ? <span className="tag compact">{step.block.note}</span> : null}
      </div>

      {step.block.exercises && step.block.exercises.length > 0 ? (
        <div className="session-exercise-list" aria-label={`Uebungen ${step.block.title}`}>
          {step.block.exercises.map((exercise) => (
            <ExerciseDetailCard
              exercise={exercise}
              exerciseActions={exerciseActions}
              isSavingDisabled={isSavingDisabled}
              key={exercise.key}
              metricActions={metricActions}
              players={players}
            />
          ))}
        </div>
      ) : null}

      {session.safetyNotes.length > 0 ? (
        <div className="live-step-safety" aria-label="Safety-Hinweise der Session">
          {session.safetyNotes.map((note) => (
            <span className="tag warning compact" key={note}>
              {note}
            </span>
          ))}
        </div>
      ) : null}

      <StepStatusControls
        blockTitle={step.block.title}
        blockKey={step.block.key}
        isSavingDisabled={isSavingDisabled}
        key={`${step.block.key}-${step.log?.clientUpdatedAt ?? 'new'}`}
        log={step.log}
        onSave={(patch) => onSaveBlockLog(step.block.key, patch)}
      />

      <div className="live-step-navigation">
        <button className="secondary-action" disabled={isFirst} type="button" onClick={goToPreviousStep}>
          <ChevronLeft className="nav-icon" aria-hidden />
          <span>Previous</span>
        </button>
        <button className="secondary-action" disabled={isLast} type="button" onClick={goToNextStep}>
          <span>Next</span>
          <ChevronRight className="nav-icon" aria-hidden />
        </button>
      </div>
    </section>
  )
}
