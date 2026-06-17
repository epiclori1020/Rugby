import { Send } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import type { ReturnerFlag, SessionReaction } from '../domain/checkIn'

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
  confirmLabelForPlayer?: (displayName: string) => string
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
  'Leiste/Adduktor',
  'Hamstring/Glute',
  'Wade/Achilles',
  'Knie',
  'Sprunggelenk',
  'Schulter/Handgelenk',
  'Kopf/Nacken',
]

function normalizeLifeFlag(value: string) {
  return value === 'Unauffällig' ? '' : value
}

export function SelfCheckInFlow({
  confirmLabelForPlayer = (displayName) => `Ich checke als ${displayName} ein.`,
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
  const [painScore, setPainScore] = useState<number | null>(null)
  const [painLocation, setPainLocation] = useState('')
  const [returnerFlag, setReturnerFlag] = useState<ReturnerFlag>('offen')
  const [sessionReaction, setSessionReaction] = useState<SessionReaction>('none')
  const [playerNote, setPlayerNote] = useState('')
  const [confirmedName, setConfirmedName] = useState(false)
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
  const canSubmit =
    !disabled &&
    !isSubmitting &&
    Boolean(selectedPlayer) &&
    confirmedName &&
    readiness !== null &&
    painScore !== null &&
    (!needsPainLocation || painLocation.trim().length > 0)

  function resetForm() {
    setSelectedPlayerId('')
    setSearchTerm('')
    setReadiness(null)
    setLifeFlag('')
    setPainScore(null)
    setPainLocation('')
    setReturnerFlag('offen')
    setSessionReaction('none')
    setPlayerNote('')
    setConfirmedName(false)
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
        lifeFlag,
        painScore,
        painLocation: needsPainLocation ? painLocation.trim() : '',
        returnerFlag,
        sessionReaction,
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
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
        />
      </label>

      <label className="inline-field wide">
        <span>Dein Name</span>
        <select
          value={selectedPlayerId}
          disabled={disabled || isSubmitting}
          onChange={(event) => {
            setSelectedPlayerId(event.currentTarget.value)
            setConfirmedName(false)
          }}
        >
          <option value="">Bitte auswählen</option>
          {filteredPlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {player.displayName}
            </option>
          ))}
        </select>
      </label>

      {selectedPlayer ? (
        <label className="toggle-row checkin-toggle">
          <input
            type="checkbox"
            checked={confirmedName}
            disabled={disabled || isSubmitting}
            onChange={(event) => setConfirmedName(event.currentTarget.checked)}
          />
          <span>{confirmLabelForPlayer(selectedPlayer.displayName)}</span>
        </label>
      ) : null}

      <div className="control-group">
        <span>Readiness · 1 = schlecht, 5 = bereit</span>
        <div className="button-row compact">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              className={readiness === value ? 'number-chip active' : 'number-chip'}
              key={value}
              type="button"
              disabled={disabled || isSubmitting}
              onClick={() => setReadiness(value)}
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
              className={lifeFlag === normalizeLifeFlag(option) ? 'segmented active' : 'segmented'}
              key={option}
              type="button"
              disabled={disabled || isSubmitting}
              onClick={() => setLifeFlag(normalizeLifeFlag(option))}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <label className="inline-field wide">
        <span>Andere Alltagsnotiz</span>
        <input
          value={lifeFlag}
          disabled={disabled || isSubmitting}
          placeholder="leer lassen, wenn unauffällig"
          onChange={(event) => setLifeFlag(event.currentTarget.value)}
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
              onClick={() => {
                setPainScore(value)
                if (value === 0) {
                  setPainLocation('')
                }
              }}
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
                  className={painLocation === option ? 'segmented active' : 'segmented'}
                  key={option}
                  type="button"
                  disabled={disabled || isSubmitting}
                  onClick={() => setPainLocation(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <label className="inline-field wide">
            <span>Anderer Schmerzort</span>
            <input
              value={painLocation}
              disabled={disabled || isSubmitting}
              placeholder="z. B. Wade rechts"
              onChange={(event) => setPainLocation(event.currentTarget.value)}
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
              onClick={() => setSessionReaction(option.value)}
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
              onClick={() => setReturnerFlag(option.value)}
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
