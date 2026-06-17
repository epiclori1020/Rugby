import { ClipboardCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  loadPublicCheckInForm,
  submitPublicCheckIn,
  type PublicCheckInFormData,
} from '../lib/publicCheckInRepository'
import { publicSubmissionErrorMessage } from '../lib/publicCheckInErrors'
import { SelfCheckInFlow, type SelfCheckInSubmissionInput } from './SelfCheckInFlow'

type PublicCheckInViewProps = {
  token: string
}

export function PublicCheckInView({ token }: PublicCheckInViewProps) {
  const [formData, setFormData] = useState<PublicCheckInFormData | null>(null)
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

  const isSubmitting = status === 'submitting'
  const isFormVisible = status === 'ready' || isSubmitting

  async function handleSubmit(input: SelfCheckInSubmissionInput) {
    if (!formData || status !== 'ready') {
      return
    }

    setStatus('submitting')
    setMessage(null)

    try {
      await submitPublicCheckIn(token, {
        linkId: formData.link.id,
        linkPlayerId: input.playerId,
        readiness: input.readiness,
        lifeFlag: input.lifeFlag,
        painScore: input.painScore,
        painLocation: input.painLocation,
        returnerFlag: input.returnerFlag,
        sessionReaction: input.sessionReaction,
        playerNote: input.playerNote,
      })
      window.localStorage.setItem(`fieldHub:publicCheckInSubmitted:${formData.link.id}`, input.playerId)
      setStatus('submitted')
      setMessage('Check-in abgeschickt. Wenn du versehentlich den falschen Namen gewaehlt hast, sag Arwin bitte direkt Bescheid.')
    } catch (caughtError) {
      setStatus('ready')
      const friendlyMessage = publicSubmissionErrorMessage(caughtError)
      setMessage(friendlyMessage)
      throw new Error(friendlyMessage, { cause: caughtError })
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
          <>
            <SelfCheckInFlow
              disabled={isSubmitting}
              helperText="Deine Angaben gehen nur an Rugby Donau S&C fuer diese Trainingseinheit. Wenn du den falschen Namen waehlst oder etwas Sensibles hast, sag Arwin bitte direkt Bescheid."
              onSubmit={handleSubmit}
              players={formData?.linkPlayers.map((player) => ({ id: player.id, displayName: player.displayName })) ?? []}
            />
            {message && status === 'ready' ? <p className="form-error">{message}</p> : null}
          </>
        ) : null}
      </section>
    </main>
  )
}
