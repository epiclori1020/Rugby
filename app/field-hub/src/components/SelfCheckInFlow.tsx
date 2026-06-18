import { Send } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import {
  joinCheckInTextList,
  splitCheckInTextList,
  toggleCheckInTextListValue,
  type ReturnerFlag,
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
  returnerFlag: ReturnerFlag
  sessionReaction: SessionReaction
  playerNote: string
}

type SelfCheckInFlowProps = {
  disabled?: boolean
  helperText?: string
  onSubmit: (input: SelfCheckInSubmissionInput) => Promise<void>
  players: SelfCheckInPlayerOption[]
  submitLabel?: string
  submittingLabel?: string
}

const returnerOptions: Array<{ value: ReturnerFlag; label: string }> = [
  { value: 'nein', label: 'Nein' },
  { value: 'ja', label: 'Ja' },
  { value: 'offen', label: 'Offen' },
]

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

function normalizeLifeFlag(value: string) {
  return value === 'Unauffällig' ? '' : value
}

export function SelfCheckInFlow({
  disabled = false,
  helperText,
  onSubmit,
  players,
  submitLabel = 'Check-in absenden',
  submittingLabel = 'Sendet...',
}: SelfCheckInFlowProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [readiness, setReadiness] = useState<number | null>(null)
  const [lifeFlag, setLifeFlag] = useState('')
  const [lifeFlagNote, setLifeFlagNote] = useState('')
  const [painScore, setPainScore] = useState<number | null>(null)
  const [painLocation, setPainLocation] = useState('')
  const [painLocationNote, setPainLocationNote] = useState('')
  const [returnerFlag, setReturnerFlag] = useState<ReturnerFlag | null>(null)
  const [sessionReaction, setSessionReaction] = useState<SessionReaction | null>(null)
  const [playerNote, setPlayerNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
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
  const canSubmit =
    !disabled &&
    !isSubmitting &&
    Boolean(selectedPlayer) &&
    readiness !== null &&
    painScore !== null &&
    (!needsPainLocation || submittedPainLocation.length > 0)

  function resetForm() {
    setSelectedPlayerId('')
    setSearchTerm('')
    setReadiness(null)
    setLifeFlag('')
    setLifeFlagNote('')
    setPainScore(null)
    setPainLocation('')
    setPainLocationNote('')
    setReturnerFlag(null)
    setSessionReaction(null)
    setPlayerNote('')
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

    if (!selectedPlayer || !canSubmit || readiness === null || painScore === null) {
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
        returnerFlag: returnerFlag ?? 'offen',
        sessionReaction: sessionReaction ?? 'none',
        playerNote,
      })
      setMessage('Check-in gespeichert.')
      resetForm()
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : 'Check-in konnte nicht gespeichert werden.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="self-checkin-flow public-checkin-form" onSubmit={handleSubmit}>
      {helperText ? <p className="privacy-note">{helperText}</p> : null}

      <label className="inline-field wide">
        <span>Name suchen</span>
        <input
          value={searchTerm}
          placeholder="2-3 Buchstaben tippen"
          disabled={disabled || isSubmitting}
          onChange={(event) => handleSearchChange(event.currentTarget.value)}
        />
      </label>

      {!selectedPlayer ? (
        <div className="control-group" role="group" aria-labelledby="self-checkin-player-options">
          <span id="self-checkin-player-options">Dein Name</span>
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

      <div className="control-group">
        <span>Readiness · 1 = schlecht, 5 = bereit</span>
        <div className="button-row compact">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
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
      </div>

      <div className="control-group">
        <span>Schlaf / Stress / Muskelkater</span>
        <div className="button-row">
          {lifeFlagOptions.map((option) => (
            <button
              className={
                option === 'Unauffällig'
                  ? lifeFlagValues.length === 0
                    && !lifeFlagNote.trim()
                    ? 'segmented active'
                    : 'segmented'
                  : lifeFlagValues.includes(normalizeLifeFlag(option))
                    ? 'segmented active'
                    : 'segmented'
              }
              key={option}
              type="button"
              disabled={disabled || isSubmitting}
              onClick={() => {
                const optionValue = normalizeLifeFlag(option)
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
          ))}
        </div>
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

      <div className="control-group">
        <span>Schmerz heute</span>
        <div className="button-row compact pain-scale">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <button
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
      </div>

      {needsPainLocation ? (
        <>
          <div className="control-group">
            <span>Schmerzort / Körperregion</span>
            <div className="button-row">
              {painLocationOptions.map((option) => (
                <button
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

      <div className="control-group">
        <span>Seit letzter Einheit neu oder schlechter?</span>
        <div className="button-row">
          {sessionReactionOptions.map((option) => (
            <button
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
      </div>

      <div className="control-group">
        <span>Returner-Status</span>
        <div className="button-row">
          {returnerOptions.map((option) => (
            <button
              className={returnerFlag === option.value ? 'segmented active' : 'segmented'}
              key={option.value}
              type="button"
              disabled={disabled || isSubmitting}
              onClick={() => setReturnerFlag((currentValue) => (currentValue === option.value ? null : option.value))}
            >
              {option.label}
            </button>
          ))}
        </div>
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

      {message ? <p className={message === 'Check-in gespeichert.' ? 'success-note' : 'form-error'}>{message}</p> : null}

      <button className="primary-action" type="submit" disabled={!canSubmit}>
        <Send className="nav-icon" aria-hidden />
        <span>{isSubmitting ? submittingLabel : submitLabel}</span>
      </button>
    </form>
  )
}
