import { ClipboardCheck, Send } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { ReturnerFlag } from '../domain/checkIn'
import {
  loadPublicCheckInForm,
  submitPublicCheckIn,
  type PublicCheckInFormData,
} from '../lib/publicCheckInRepository'
import { publicSubmissionErrorMessage } from '../lib/publicCheckInErrors'

type PublicCheckInViewProps = {
  token: string
}

const returnerOptions: Array<{ value: ReturnerFlag; label: string }> = [
  { value: 'nein', label: 'Nein' },
  { value: 'ja', label: 'Ja' },
  { value: 'offen', label: 'Offen' },
]

export function PublicCheckInView({ token }: PublicCheckInViewProps) {
  const [formData, setFormData] = useState<PublicCheckInFormData | null>(null)
  const [selectedLinkPlayerId, setSelectedLinkPlayerId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [readiness, setReadiness] = useState<number | null>(null)
  const [lifeFlag, setLifeFlag] = useState('')
  const [painScore, setPainScore] = useState<number | null>(null)
  const [painLocation, setPainLocation] = useState('')
  const [returnerFlag, setReturnerFlag] = useState<ReturnerFlag>('offen')
  const [playerNote, setPlayerNote] = useState('')
  const [confirmedName, setConfirmedName] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'submitted' | 'error'>('loading')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    loadPublicCheckInForm(token)
      .then((loadedFormData) => {
        setFormData(loadedFormData)
        setStatus('ready')
      })
      .catch((caughtError) => {
        setMessage(caughtError instanceof Error ? caughtError.message : 'Check-in-Link konnte nicht geladen werden.')
        setStatus('error')
      })
  }, [token])

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('de-AT')
    const players = formData?.linkPlayers ?? []

    if (!normalizedSearch) {
      return players
    }

    return players.filter((player) => player.displayName.toLocaleLowerCase('de-AT').includes(normalizedSearch))
  }, [formData, searchTerm])
  const selectedPlayer = formData?.linkPlayers.find((player) => player.id === selectedLinkPlayerId) ?? null
  const isSubmitting = status === 'submitting'
  const isFormVisible = status === 'ready' || isSubmitting
  const canSubmit =
    status === 'ready' &&
    Boolean(formData) &&
    Boolean(selectedPlayer) &&
    confirmedName &&
    readiness !== null &&
    painScore !== null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!formData || !selectedPlayer || !canSubmit) {
      return
    }

    setStatus('submitting')
    setMessage(null)

    try {
      await submitPublicCheckIn(token, {
        linkId: formData.link.id,
        linkPlayerId: selectedPlayer.id,
        readiness,
        lifeFlag,
        painScore,
        painLocation,
        returnerFlag,
        playerNote,
      })
      window.localStorage.setItem(`fieldHub:publicCheckInSubmitted:${formData.link.id}`, selectedPlayer.id)
      setStatus('submitted')
      setMessage('Check-in abgeschickt. Wenn du versehentlich den falschen Namen gewaehlt hast, sag Arwin bitte direkt Bescheid.')
    } catch (caughtError) {
      setStatus('ready')
      setMessage(publicSubmissionErrorMessage(caughtError))
    }
  }

  return (
    <main className="public-checkin-page">
      <section className="public-checkin-panel" aria-labelledby="public-checkin-heading">
        <div className="status-line">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <div>
            <p className="eyebrow">Rugby Donau S&amp;C</p>
            <h1 id="public-checkin-heading">Training Check-in</h1>
            <p>
              {formData
                ? `${formData.link.sessionTitle} · ${formData.link.sessionDate}`
                : 'Link wird geprueft.'}
            </p>
          </div>
        </div>

        {status === 'loading' ? <p>Check-in wird geladen...</p> : null}
        {status === 'error' ? <p className="form-error">{message}</p> : null}
        {status === 'submitted' ? <p className="success-note">{message}</p> : null}

        {isFormVisible ? (
          <form className="public-checkin-form" onSubmit={handleSubmit}>
            <p className="privacy-note">
              Deine Angaben gehen nur an Rugby Donau S&amp;C fuer diese Trainingseinheit. Wenn du den falschen Namen
              waehlst oder etwas Sensibles hast, sag Arwin bitte direkt Bescheid.
            </p>

            <label className="inline-field wide">
              <span>Name suchen</span>
              <input
                value={searchTerm}
                placeholder="2-3 Buchstaben tippen"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="inline-field wide">
              <span>Dein Name</span>
              <select
                value={selectedLinkPlayerId}
                onChange={(event) => {
                  setSelectedLinkPlayerId(event.target.value)
                  setConfirmedName(false)
                }}
              >
                <option value="">Bitte auswaehlen</option>
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
                  onChange={(event) => setConfirmedName(event.target.checked)}
                />
                <span>Ich checke als {selectedPlayer.displayName} ein.</span>
              </label>
            ) : null}

            <div className="control-group">
              <span>Readiness</span>
              <div className="button-row compact">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    className={readiness === value ? 'number-chip active' : 'number-chip'}
                    key={value}
                    type="button"
                    onClick={() => setReadiness(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <label className="inline-field wide">
              <span>Schlaf, Stress, Muskelkater</span>
              <input
                value={lifeFlag}
                placeholder="leer lassen, wenn unauffaellig"
                onChange={(event) => setLifeFlag(event.target.value)}
              />
            </label>

            <div className="control-group">
              <span>Schmerz</span>
              <div className="button-row compact pain-scale">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    className={painScore === value ? 'number-chip active' : 'number-chip'}
                    key={value}
                    type="button"
                    onClick={() => setPainScore(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <label className="inline-field wide">
              <span>Schmerzort</span>
              <input
                value={painLocation}
                placeholder="z. B. Wade rechts"
                onChange={(event) => setPainLocation(event.target.value)}
              />
            </label>

            <div className="control-group">
              <span>Returner/offen</span>
              <div className="button-row">
                {returnerOptions.map((option) => (
                  <button
                    className={returnerFlag === option.value ? 'segmented active' : 'segmented'}
                    key={option.value}
                    type="button"
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
                placeholder="z. B. komme spaeter, muede Beine"
                onChange={(event) => setPlayerNote(event.target.value)}
              />
            </label>

            {message ? <p className="form-error">{message}</p> : null}

            <button className="primary-action" type="submit" disabled={!canSubmit || isSubmitting}>
              <Send className="nav-icon" aria-hidden />
              <span>{isSubmitting ? 'Sendet...' : 'Check-in absenden'}</span>
            </button>
          </form>
        ) : null}
      </section>
    </main>
  )
}
