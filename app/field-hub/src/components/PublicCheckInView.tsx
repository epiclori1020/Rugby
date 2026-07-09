import { ClipboardCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { activeSportConfig } from '../config/labels'
import {
  loadPublicCheckInForm,
  submitPublicCheckIn,
  type PublicCheckInFormData,
} from '../lib/publicCheckInRepository'
import { publicSubmissionErrorMessage } from '../lib/publicCheckInErrors'
import { BrandSurface } from './onfield'
import { SelfCheckInFlow, type SelfCheckInSubmissionInput } from './SelfCheckInFlow'

type PublicCheckInViewProps = {
  token: string
}

export function PublicCheckInView({ token }: PublicCheckInViewProps) {
  const [formData, setFormData] = useState<PublicCheckInFormData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'error'>('loading')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    loadPublicCheckInForm(token)
      .then((loadedFormData) => {
        setFormData(loadedFormData)
        setStatus('ready')
      })
      .catch((caughtError) => {
        setMessage(publicSubmissionErrorMessage(caughtError))
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
        sessionReaction: input.sessionReaction,
        playerNote: input.playerNote,
      })
      setStatus('ready')
    } catch (caughtError) {
      setStatus('ready')
      const friendlyMessage = publicSubmissionErrorMessage(caughtError)
      setMessage(friendlyMessage)
      throw new Error(friendlyMessage, { cause: caughtError })
    }
  }

  return (
    <main className="public-checkin-page">
      <BrandSurface
        body={
          formData
            ? `${formData.link.sessionTitle} · ${formData.link.sessionDate}`
            : 'Link wird geprueft.'
        }
        className="public-checkin-panel"
        claim="Know squad status before the whistle."
        meta={<span>{activeSportConfig.productLabel} Public Check-in</span>}
        title="Training Check-in"
        variant="public"
      >
        <div className="status-line">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <p>Kurzer Status vor der Einheit. Das Formular bleibt direkt erreichbar.</p>
        </div>

        {status === 'loading' ? <p>Check-in wird geladen...</p> : null}
        {status === 'error' ? <p className="form-error">{message}</p> : null}
      </BrandSurface>

      {isFormVisible ? (
        <section className="self-checkin-panel public-flow-panel" aria-label="Public Check-in">
          <SelfCheckInFlow
            completionBody="Deine Angaben sind angekommen. Wenn du versehentlich den falschen Namen gewählt hast, sag dem Coach direkt Bescheid."
            completionTitle="Check-in gespeichert"
            disabled={isSubmitting}
            helperText={activeSportConfig.safetyCopy.publicCheckInPrivacy}
            mode="public"
            onSubmit={handleSubmit}
            players={formData?.linkPlayers.map((player) => ({ id: player.id, displayName: player.displayName })) ?? []}
            resetActionLabel="Weiteren Check-in erfassen"
          />
          {message && status === 'ready' ? <p className="form-error">{message}</p> : null}
        </section>
      ) : null}
    </main>
  )
}
