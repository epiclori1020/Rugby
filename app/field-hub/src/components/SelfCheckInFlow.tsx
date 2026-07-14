import { CheckCircle2, Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  joinCheckInTextList,
  splitCheckInTextList,
  toggleCheckInTextListValue,
  type SessionReaction,
} from '../domain/checkIn'

export type SelfCheckInPlayerOption = {
  id: string
  displayName: string
}

export type SelfCheckInSubmissionInput = {
  playerId: string
  readiness: number
  lifeFlag: string
  painScore: number
  painLocation: string
  sessionReaction: SessionReaction
  playerNote: string
}

type SelfCheckInMode = 'kiosk' | 'public'

export type SelfCheckInStep = 'player' | 'readiness' | 'life' | 'pain' | 'reaction' | 'review' | 'complete'

type SelfCheckInFlowProps = {
  autoResetAfterSubmitMs?: number | null
  completionBody?: string
  completionTitle?: string
  disabled?: boolean
  disabledReason?: string
  helperText?: string
  mode?: SelfCheckInMode
  onSubmit: (input: SelfCheckInSubmissionInput) => Promise<void>
  onStepChange?: (step: SelfCheckInStep) => void
  players: SelfCheckInPlayerOption[]
  resetActionLabel?: string
  submitLabel?: string
  submittingLabel?: string
}

const sessionReactionOptions: Array<{ value: SessionReaction; label: string }> = [
  { value: 'none', label: 'Nein' },
  { value: 'new_or_worse', label: 'Ja, neu/schlechter' },
  { value: 'unsure', label: 'Unsicher' },
]

const lifeFlagOptions = ['Unauffällig', 'Schlecht geschlafen', 'Stress', 'Muskelkater', 'Müde']

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

const orderedSteps: SelfCheckInStep[] = ['player', 'readiness', 'life', 'pain', 'reaction', 'review']

const stepLabels: Record<SelfCheckInStep, string> = {
  player: 'Name',
  readiness: 'Readiness',
  life: 'Alltag',
  pain: 'Schmerz',
  reaction: 'Veränderung',
  review: 'Review',
  complete: 'Abschluss',
}

function normalizeLifeFlag(value: string) {
  return value === 'Unauffällig' ? '' : value
}

function reactionLabel(value: SessionReaction | null) {
  return sessionReactionOptions.find((option) => option.value === value)?.label ?? 'Noch offen'
}

function selectedLifeLabel(values: string[], note: string) {
  const normalizedNote = note.trim()

  if (values.length === 0 && !normalizedNote) {
    return 'Unauffällig'
  }

  return joinCheckInTextList([...values, ...splitCheckInTextList(normalizedNote)])
}

export function SelfCheckInFlow({
  autoResetAfterSubmitMs = null,
  completionBody = 'Deine Angaben sind angekommen.',
  completionTitle = 'Check-in gespeichert',
  disabled = false,
  disabledReason,
  helperText,
  mode = 'public',
  onSubmit,
  onStepChange,
  players,
  resetActionLabel = 'Weiteren Check-in erfassen',
  submitLabel = 'Check-in absenden',
  submittingLabel = 'Sendet...',
}: SelfCheckInFlowProps) {
  const [step, setStep] = useState<SelfCheckInStep>('player')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [readiness, setReadiness] = useState<number | null>(null)
  const [lifeFlag, setLifeFlag] = useState('')
  const [lifeFlagNote, setLifeFlagNote] = useState('')
  const [painScore, setPainScore] = useState<number | null>(null)
  const [painLocation, setPainLocation] = useState('')
  const [painLocationNote, setPainLocationNote] = useState('')
  const [sessionReaction, setSessionReaction] = useState<SessionReaction | null>(null)
  const [playerNote, setPlayerNote] = useState('')
  const [completedPlayerName, setCompletedPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    onStepChange?.(step)
  }, [onStepChange, step])
  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('de-AT')

    if (!normalizedSearch) {
      return players
    }

    return players.filter((player) => player.displayName.toLocaleLowerCase('de-AT').includes(normalizedSearch))
  }, [players, searchTerm])
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null
  const needsPainLocation = painScore !== null && painScore > 0
  const lifeFlagValues = splitCheckInTextList(lifeFlag)
  const painLocationValues = splitCheckInTextList(painLocation)
  const submittedLifeFlag = joinCheckInTextList([...lifeFlagValues, ...splitCheckInTextList(lifeFlagNote)])
  const submittedPainLocation = joinCheckInTextList([...painLocationValues, ...splitCheckInTextList(painLocationNote)])
  const currentStepIndex = Math.max(0, orderedSteps.indexOf(step))
  const progressValue = step === 'complete' ? 100 : ((currentStepIndex + 1) / orderedSteps.length) * 100
  const canSubmit =
    !disabled &&
    !isSubmitting &&
    Boolean(selectedPlayer) &&
    readiness !== null &&
    painScore !== null &&
    sessionReaction !== null &&
    (!needsPainLocation || submittedPainLocation.length > 0)

  const resetEntryFields = useCallback(() => {
    setSelectedPlayerId('')
    setSearchTerm('')
    setReadiness(null)
    setLifeFlag('')
    setLifeFlagNote('')
    setPainScore(null)
    setPainLocation('')
    setPainLocationNote('')
    setSessionReaction(null)
    setPlayerNote('')
  }, [])

  const resetForm = useCallback(() => {
    resetEntryFields()
    setCompletedPlayerName('')
    setMessage(null)
    setStep('player')
  }, [resetEntryFields])

  useEffect(() => {
    if (step !== 'complete' || !autoResetAfterSubmitMs || autoResetAfterSubmitMs <= 0) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      resetForm()
    }, autoResetAfterSubmitMs)

    return () => window.clearTimeout(timeoutId)
  }, [autoResetAfterSubmitMs, resetForm, step])

  function goToNextStep() {
    const nextStep = orderedSteps[currentStepIndex + 1]

    if (nextStep) {
      setMessage(null)
      setStep(nextStep)
    }
  }

  function goToPreviousStep() {
    const previousStep = orderedSteps[currentStepIndex - 1]

    if (previousStep) {
      setMessage(null)
      setStep(previousStep)
    }
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value)
    if (selectedPlayerId) {
      setSelectedPlayerId('')
    }
  }

  function selectPlayer(player: SelfCheckInPlayerOption) {
    setSelectedPlayerId(player.id)
    setSearchTerm(player.displayName)
  }

  function toggleReadiness(value: number) {
    setReadiness((currentValue) => (currentValue === value ? null : value))
  }

  function togglePainScore(value: number) {
    setPainScore((currentValue) => {
      if (currentValue === value) {
        setPainLocation('')
        setPainLocationNote('')
        return null
      }

      if (value === 0) {
        setPainLocation('')
        setPainLocationNote('')
      }

      return value
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedPlayer || !canSubmit || readiness === null || painScore === null || sessionReaction === null) {
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      await onSubmit({
        playerId: selectedPlayer.id,
        readiness,
        lifeFlag: submittedLifeFlag,
        painScore,
        painLocation: needsPainLocation ? submittedPainLocation : '',
        sessionReaction,
        playerNote,
      })
      setCompletedPlayerName(selectedPlayer.displayName)
      resetEntryFields()
      setStep('complete')
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : 'Check-in konnte nicht gespeichert werden.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const lifeStepIsValid = true
  const painStepIsValid = painScore !== null && (!needsPainLocation || submittedPainLocation.length > 0)
  const reactionStepIsValid = sessionReaction !== null
  const effectiveHelperText =
    helperText ??
    (mode === 'kiosk' ? 'Nur Angaben für die heutige Einheit. Coach-Bereiche bleiben gesperrt.' : undefined)
  const unavailableReason = disabled
    ? disabledReason ?? 'Check-in ist gerade nicht verfügbar.'
    : isSubmitting
      ? 'Check-in wird gerade gesendet.'
      : null
  const playerNextDisabledReason =
    unavailableReason ?? (!selectedPlayer ? 'Name auswählen, dann weiter.' : null)
  const readinessNextDisabledReason =
    unavailableReason ?? (readiness === null ? 'Readiness auswählen, dann weiter.' : null)
  const lifeNextDisabledReason = unavailableReason ?? (!lifeStepIsValid ? 'Angabe prüfen, dann weiter.' : null)
  const painNextDisabledReason =
    unavailableReason ??
    (!painStepIsValid
      ? painScore === null
        ? 'Schmerz-Skala auswählen, dann weiter.'
        : 'Körperregion auswählen oder kurz notieren.'
      : null)
  const reactionNextDisabledReason =
    unavailableReason ?? (!reactionStepIsValid ? 'Auswahl treffen, dann weiter.' : null)
  const submitDisabledReason =
    unavailableReason ??
    (!canSubmit ? 'Offene Angaben prüfen, dann absenden.' : null)

  return (
    <form
      className={`self-checkin-flow public-checkin-form self-checkin-flow-${mode}`}
      data-mode={mode}
      onSubmit={handleSubmit}
    >
      {step !== 'complete' ? (
        <div className="self-checkin-progress" aria-label={`Schritt ${currentStepIndex + 1} von ${orderedSteps.length}`}>
          <div className="self-checkin-progress-copy">
            <span>Schritt {currentStepIndex + 1} von {orderedSteps.length}</span>
            <strong>{stepLabels[step]}</strong>
          </div>
          <div className="self-checkin-progress-track" aria-hidden>
            <span style={{ width: `${progressValue}%` }} />
          </div>
        </div>
      ) : null}

      {effectiveHelperText && step !== 'complete' ? <p className="privacy-note">{effectiveHelperText}</p> : null}

      {step === 'player' ? (
        <section className="self-checkin-step" aria-labelledby="self-checkin-player-title">
          <div className="self-checkin-step-header">
            <h3 id="self-checkin-player-title">Dein Name</h3>
            <p className="privacy-note">Suche dich in der Liste und bestätige danach den Check-in.</p>
          </div>

          <label className="inline-field wide">
            <span>Name suchen</span>
            <input
              value={searchTerm}
              placeholder="2-3 Buchstaben tippen"
              disabled={disabled || isSubmitting}
              autoComplete="off"
              onChange={(event) => handleSearchChange(event.currentTarget.value)}
            />
          </label>

          {!selectedPlayer ? (
            <div className="control-group" role="group" aria-labelledby="self-checkin-player-options">
              <span id="self-checkin-player-options">Name auswählen</span>
              <div className="button-row">
                {filteredPlayers.map((player) => (
                  <button
                    className="segmented"
                    key={player.id}
                    type="button"
                    disabled={disabled || isSubmitting}
                    onClick={() => selectPlayer(player)}
                  >
                    {player.displayName}
                  </button>
                ))}
              </div>
              {searchTerm.trim() && filteredPlayers.length === 0 ? <p className="privacy-note">Kein Treffer</p> : null}
            </div>
          ) : (
            <div className="control-group" role="status" aria-live="polite">
              <span>Ausgewählt: {selectedPlayer.displayName}</span>
              <div className="button-row">
                <button
                  className="segmented"
                  type="button"
                  disabled={disabled || isSubmitting}
                  onClick={() => {
                    setSelectedPlayerId('')
                    setSearchTerm('')
                  }}
                >
                  ändern
                </button>
              </div>
            </div>
          )}

          <div className="self-checkin-step-actions">
            <button
              aria-describedby={playerNextDisabledReason ? 'self-checkin-player-disabled-reason' : undefined}
              className="primary-action self-checkin-next"
              type="button"
              disabled={Boolean(playerNextDisabledReason)}
              onClick={goToNextStep}
            >
              Weiter
            </button>
          </div>
          {playerNextDisabledReason ? (
            <p className="disabled-action-reason" id="self-checkin-player-disabled-reason">
              {playerNextDisabledReason}
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 'readiness' ? (
        <section className="self-checkin-step" aria-labelledby="self-checkin-readiness-title">
          <div className="self-checkin-step-header">
            <h3 id="self-checkin-readiness-title">Wie belastbar fühlst du dich heute?</h3>
            <p className="privacy-note">1 gar nicht bereit · 2 schlecht · 3 mittel · 4 gut · 5 voll bereit</p>
          </div>
          <div className="button-row compact">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-pressed={readiness === value}
                className={readiness === value ? 'number-chip active' : 'number-chip'}
                key={value}
                type="button"
                disabled={disabled || isSubmitting}
                onClick={() => toggleReadiness(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="self-checkin-step-actions">
            <button className="secondary-action" type="button" disabled={disabled || isSubmitting} onClick={goToPreviousStep}>
              Zurück
            </button>
            <button
              aria-describedby={readinessNextDisabledReason ? 'self-checkin-readiness-disabled-reason' : undefined}
              className="primary-action self-checkin-next"
              type="button"
              disabled={Boolean(readinessNextDisabledReason)}
              onClick={goToNextStep}
            >
              Weiter
            </button>
          </div>
          {readinessNextDisabledReason ? (
            <p className="disabled-action-reason" id="self-checkin-readiness-disabled-reason">
              {readinessNextDisabledReason}
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 'life' ? (
        <section className="self-checkin-step" aria-labelledby="self-checkin-life-title">
          <div className="self-checkin-step-header">
            <h3 id="self-checkin-life-title">Was beeinflusst dich heute?</h3>
            <p className="privacy-note">Wähle alles, was für den Coach vor der Einheit wichtig ist.</p>
          </div>
          <div className="button-row">
            {lifeFlagOptions.map((option) => {
              const optionValue = normalizeLifeFlag(option)
              const isActive =
                option === 'Unauffällig'
                  ? lifeFlagValues.length === 0 && !lifeFlagNote.trim()
                  : lifeFlagValues.includes(optionValue)

              return (
                <button
                  aria-pressed={isActive}
                  className={isActive ? 'segmented active' : 'segmented'}
                  key={option}
                  type="button"
                  disabled={disabled || isSubmitting}
                  onClick={() => {
                    if (!optionValue) {
                      setLifeFlag('')
                      setLifeFlagNote('')
                      return
                    }
                    setLifeFlag((currentValue) => toggleCheckInTextListValue(currentValue, optionValue))
                  }}
                >
                  {option}
                </button>
              )
            })}
          </div>
          <label className="inline-field wide">
            <span>Andere Alltagsnotiz</span>
            <input
              value={lifeFlagNote}
              disabled={disabled || isSubmitting}
              placeholder="leer lassen, wenn unauffällig"
              onChange={(event) => setLifeFlagNote(event.currentTarget.value)}
            />
          </label>
          <div className="self-checkin-step-actions">
            <button className="secondary-action" type="button" disabled={disabled || isSubmitting} onClick={goToPreviousStep}>
              Zurück
            </button>
            <button
              aria-describedby={lifeNextDisabledReason ? 'self-checkin-life-disabled-reason' : undefined}
              className="primary-action self-checkin-next"
              type="button"
              disabled={Boolean(lifeNextDisabledReason)}
              onClick={goToNextStep}
            >
              Weiter
            </button>
          </div>
          {lifeNextDisabledReason ? (
            <p className="disabled-action-reason" id="self-checkin-life-disabled-reason">
              {lifeNextDisabledReason}
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 'pain' ? (
        <section className="self-checkin-step" aria-labelledby="self-checkin-pain-title">
          <div className="self-checkin-step-header">
            <h3 id="self-checkin-pain-title">Schmerz/Beschwerden heute</h3>
            <p className="privacy-note">0 kein Schmerz · 1-2 leicht · 3-4 merkbar · 5+ bitte Coach sagen</p>
          </div>
          <div className="button-row compact pain-scale">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                aria-pressed={painScore === value}
                className={painScore === value ? 'number-chip active' : 'number-chip'}
                key={value}
                type="button"
                disabled={disabled || isSubmitting}
                onClick={() => togglePainScore(value)}
              >
                {value}
              </button>
            ))}
          </div>

          {needsPainLocation ? (
            <>
              <div className="control-group">
                <span>Schmerzort / Körperregion</span>
                <div className="button-row">
                  {painLocationOptions.map((option) => (
                    <button
                      aria-pressed={painLocationValues.includes(option)}
                      className={painLocationValues.includes(option) ? 'segmented active' : 'segmented'}
                      key={option}
                      type="button"
                      disabled={disabled || isSubmitting}
                      onClick={() => setPainLocation((currentValue) => toggleCheckInTextListValue(currentValue, option))}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <label className="inline-field wide">
                <span>Anderer Schmerzort</span>
                <input
                  value={painLocationNote}
                  disabled={disabled || isSubmitting}
                  placeholder="z. B. Wade rechts"
                  onChange={(event) => setPainLocationNote(event.currentTarget.value)}
                />
              </label>
            </>
          ) : null}

          <div className="self-checkin-step-actions">
            <button className="secondary-action" type="button" disabled={disabled || isSubmitting} onClick={goToPreviousStep}>
              Zurück
            </button>
            <button
              aria-describedby={painNextDisabledReason ? 'self-checkin-pain-disabled-reason' : undefined}
              className="primary-action self-checkin-next"
              type="button"
              disabled={Boolean(painNextDisabledReason)}
              onClick={goToNextStep}
            >
              Weiter
            </button>
          </div>
          {painNextDisabledReason ? (
            <p className="disabled-action-reason" id="self-checkin-pain-disabled-reason">
              {painNextDisabledReason}
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 'reaction' ? (
        <section className="self-checkin-step" aria-labelledby="self-checkin-reaction-title">
          <div className="self-checkin-step-header">
            <h3 id="self-checkin-reaction-title">Seit dem letzten Training: etwas neu oder schlechter?</h3>
            <p className="privacy-note">Diese Angabe hilft dem Coach, die Einheit passend zu steuern.</p>
          </div>
          <div className="button-row">
            {sessionReactionOptions.map((option) => (
              <button
                aria-pressed={sessionReaction === option.value}
                className={sessionReaction === option.value ? 'segmented active' : 'segmented'}
                key={option.value}
                type="button"
                disabled={disabled || isSubmitting}
                onClick={() => setSessionReaction((currentValue) => (currentValue === option.value ? null : option.value))}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="inline-field wide">
            <span>Bemerkung optional</span>
            <textarea
              value={playerNote}
              rows={2}
              disabled={disabled || isSubmitting}
              placeholder="z. B. komme später, müde Beine"
              onChange={(event) => setPlayerNote(event.currentTarget.value)}
            />
          </label>
          <div className="self-checkin-step-actions">
            <button className="secondary-action" type="button" disabled={disabled || isSubmitting} onClick={goToPreviousStep}>
              Zurück
            </button>
            <button
              aria-describedby={reactionNextDisabledReason ? 'self-checkin-reaction-disabled-reason' : undefined}
              className="primary-action self-checkin-next"
              type="button"
              disabled={Boolean(reactionNextDisabledReason)}
              onClick={goToNextStep}
            >
              Weiter
            </button>
          </div>
          {reactionNextDisabledReason ? (
            <p className="disabled-action-reason" id="self-checkin-reaction-disabled-reason">
              {reactionNextDisabledReason}
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 'review' ? (
        <section className="self-checkin-step" aria-labelledby="self-checkin-review-title">
          <div className="self-checkin-step-header">
            <h3 id="self-checkin-review-title">Kurz prüfen und absenden</h3>
            <p className="privacy-note">Wenn etwas nicht stimmt, gehe zurück und ändere es vor dem Absenden.</p>
          </div>
          <dl className="self-checkin-review">
            <div className="self-checkin-review-row">
              <dt>Name</dt>
              <dd>{selectedPlayer?.displayName ?? 'Noch offen'}</dd>
            </div>
            <div className="self-checkin-review-row">
              <dt>Readiness</dt>
              <dd>{readiness ?? 'Noch offen'}</dd>
            </div>
            <div className="self-checkin-review-row">
              <dt>Alltag</dt>
              <dd>{selectedLifeLabel(lifeFlagValues, lifeFlagNote)}</dd>
            </div>
            <div className="self-checkin-review-row">
              <dt>Schmerz</dt>
              <dd>{painScore === null ? 'Noch offen' : `${painScore}${needsPainLocation ? ` · ${submittedPainLocation}` : ''}`}</dd>
            </div>
            <div className="self-checkin-review-row">
              <dt>Veränderung</dt>
              <dd>{reactionLabel(sessionReaction)}</dd>
            </div>
            {playerNote.trim() ? (
              <div className="self-checkin-review-row">
                <dt>Bemerkung</dt>
                <dd>{playerNote.trim()}</dd>
              </div>
            ) : null}
          </dl>

          {message ? <p className="form-error" role="alert">{message}</p> : null}

          <div className="self-checkin-step-actions">
            <button className="secondary-action" type="button" disabled={disabled || isSubmitting} onClick={goToPreviousStep}>
              Zurück
            </button>
            <button
              aria-describedby={submitDisabledReason ? 'self-checkin-submit-disabled-reason' : undefined}
              className="primary-action self-checkin-submit"
              type="submit"
              disabled={Boolean(submitDisabledReason)}
              aria-busy={isSubmitting}
            >
              <Send className="nav-icon" aria-hidden />
              <span>{isSubmitting ? submittingLabel : submitLabel}</span>
            </button>
          </div>
          {submitDisabledReason ? (
            <p className="disabled-action-reason" id="self-checkin-submit-disabled-reason">
              {submitDisabledReason}
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 'complete' ? (
        <section className="self-checkin-complete" role="status" aria-live="polite" aria-labelledby="self-checkin-complete-title">
          <CheckCircle2 className="self-checkin-complete-icon" aria-hidden />
          <h3 id="self-checkin-complete-title">{completionTitle}</h3>
          <p>
            {completedPlayerName ? `${completedPlayerName}: ${completionBody}` : completionBody}
          </p>
          <button className="secondary-action self-checkin-reset-action" type="button" onClick={resetForm}>
            {resetActionLabel}
          </button>
        </section>
      ) : null}
    </form>
  )
}
