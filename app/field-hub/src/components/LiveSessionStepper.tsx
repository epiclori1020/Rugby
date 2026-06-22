import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import type { SessionDefinition } from '../content/types'
import {
  getDefaultLiveSessionStep,
  getLiveSessionStep,
  getNextLiveSessionStep,
  getPreviousLiveSessionStep,
} from '../domain/liveSession'
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
import { syncStatusLabel } from '../lib/syncLabels'

const selectableBlockReasons = sessionBlockReasons.filter((reason) => reason !== 'none')

type LiveSessionStepperProps = {
  blockLogs: SessionBlockLog[]
  isSavingDisabled: boolean
  onSaveBlockLog: (
    blockKey: string,
    patch: { status: SessionBlockStatus; reason: SessionBlockReason; coachNote: string },
  ) => void
  session: SessionDefinition
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
  isSavingDisabled,
  onSaveBlockLog,
  session,
}: LiveSessionStepperProps) {
  const [stepState, setStepState] = useState<{ sessionId: string; currentBlockKey: string | null }>({
    sessionId: session.id,
    currentBlockKey: null,
  })
  const currentBlockKey = stepState.sessionId === session.id ? stepState.currentBlockKey : null
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
      setStepState({ sessionId: session.id, currentBlockKey: previousStep.block.key })
    }
  }

  function goToNextStep() {
    if (nextStep) {
      setStepState({ sessionId: session.id, currentBlockKey: nextStep.block.key })
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
