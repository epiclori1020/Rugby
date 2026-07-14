import { ClipboardCheck, LogOut, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { activeSportConfig } from '../config/labels'
import type { SessionDefinition } from '../content/types'
import { KIOSK_EXIT_HOLD_MS } from '../lib/kioskLock'
import { triggerHapticFeedback } from '../lib/interactionFeedback'
import { BrandSurface } from './onfield'
import { SelfCheckInFlow, type SelfCheckInPlayerOption, type SelfCheckInStep, type SelfCheckInSubmissionInput } from './SelfCheckInFlow'

type KioskCheckInViewProps = {
  disabledReason?: string
  errorMessage: string | null
  isCheckInDisabled?: boolean
  onExit: () => void | Promise<void>
  onSubmitKioskEntry: (input: SelfCheckInSubmissionInput) => Promise<void>
  players: SelfCheckInPlayerOption[]
  selectedSession: SessionDefinition
}

export function KioskCheckInView({
  disabledReason,
  errorMessage,
  isCheckInDisabled = false,
  onExit,
  onSubmitKioskEntry,
  players,
  selectedSession,
}: KioskCheckInViewProps) {
  const [exitPanelOpen, setExitPanelOpen] = useState(false)
  const [isHoldingExit, setIsHoldingExit] = useState(false)
  const [flowStep, setFlowStep] = useState<SelfCheckInStep>('player')
  const holdTimerRef = useRef<number | null>(null)
  const holdButtonStyle = {
    '--kiosk-exit-hold-duration': `${KIOSK_EXIT_HOLD_MS}ms`,
  } as CSSProperties

  const cancelHoldExit = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    setIsHoldingExit(false)
  }, [])

  const completeHoldExit = useCallback(() => {
    holdTimerRef.current = null
    setIsHoldingExit(false)
    triggerHapticFeedback('success')
    void onExit()
  }, [onExit])

  const startHoldExit = useCallback(() => {
    if (holdTimerRef.current !== null) {
      return
    }

    triggerHapticFeedback('selection')
    setIsHoldingExit(true)
    holdTimerRef.current = window.setTimeout(completeHoldExit, KIOSK_EXIT_HOLD_MS)
  }, [completeHoldExit])

  useEffect(() => cancelHoldExit, [cancelHoldExit])

  function formatSessionDate(date: string) {
    return new Intl.DateTimeFormat('de-AT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${date}T12:00:00`))
  }

  function sessionDetail(title: string) {
    const [, detail] = title.split(/:\s+/, 2)
    return detail?.trim() || title
  }

  function handleExitKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') {
      cancelHoldExit()
      setExitPanelOpen(false)
      return
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      startHoldExit()
    }
  }

  function handleExitKeyUp(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      cancelHoldExit()
    }
  }

  return (
    <main className="kiosk-checkin-page">
      {flowStep === 'player' ? <BrandSurface
        artwork="texture"
        body={`${formatSessionDate(selectedSession.date)} · ${sessionDetail(selectedSession.title)}`}
        className="kiosk-checkin-panel"
        claim="Know squad status before the whistle."
        meta={<span>{activeSportConfig.productLabel} Kiosk</span>}
        title="Training Check-in"
        variant="kiosk"
      >
        <div className="status-line">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <p>Nur Angaben für die heutige Einheit. Wähle deinen Namen, fülle den kurzen Check-in aus und gib das Gerät weiter.</p>
        </div>
      </BrandSurface> : null}

      <section className="self-checkin-panel kiosk-flow-panel" aria-label="Kiosk Check-in">
        <SelfCheckInFlow
          autoResetAfterSubmitMs={3000}
          completionBody="Check-in ist gespeichert. Gib das Gerät jetzt weiter."
          completionTitle="Gespeichert"
          disabled={isCheckInDisabled}
          disabledReason={disabledReason}
          helperText="Nur Angaben für die heutige Einheit. Coach-Bereiche bleiben gesperrt."
          mode="kiosk"
          onSubmit={onSubmitKioskEntry}
          onStepChange={setFlowStep}
          players={players}
          resetActionLabel="Nächsten Check-in starten"
          submitLabel="Speichern und weitergeben"
          submittingLabel="Speichert..."
        />
        {errorMessage ? <p className="form-error" role="alert">{errorMessage}</p> : null}
      </section>
      <div className="kiosk-exit-lock" aria-label="Coach-Modus">
        {exitPanelOpen ? (
          <div className="kiosk-exit-panel">
            <div className="status-line">
              <ShieldCheck className="nav-icon" aria-hidden />
              <span>
                <strong>Coach-Modus</strong>
                <small>Zum Beenden lange halten. Loslassen bricht ab.</small>
              </span>
            </div>
            <button
              aria-describedby="kiosk-exit-hold-help"
              aria-pressed={isHoldingExit}
              className={`kiosk-hold-exit-button${isHoldingExit ? ' is-holding' : ''}`}
              style={holdButtonStyle}
              type="button"
              onBlur={cancelHoldExit}
              onKeyDown={handleExitKeyDown}
              onKeyUp={handleExitKeyUp}
              onPointerCancel={cancelHoldExit}
              onPointerDown={startHoldExit}
              onPointerLeave={cancelHoldExit}
              onPointerUp={cancelHoldExit}
            >
              <span className="kiosk-hold-progress" aria-hidden />
              <LogOut className="nav-icon" aria-hidden />
              <span>Zum Coach-Modus halten</span>
            </button>
            <p className="privacy-note" id="kiosk-exit-hold-help">
              {Math.round(KIOSK_EXIT_HOLD_MS / 1000)} Sekunden halten. Der Coach-Modus öffnet erst danach.
            </p>
          </div>
        ) : (
          <button
            className="kiosk-exit-button kiosk-exit-trigger"
            type="button"
            onClick={() => setExitPanelOpen(true)}
          >
            <ShieldCheck className="nav-icon" aria-hidden />
            <span>Coach-Modus</span>
          </button>
        )}
      </div>
    </main>
  )
}
