import { ClipboardCheck, LogOut } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { SessionDefinition } from '../content/types'
import { SelfCheckInFlow, type SelfCheckInPlayerOption, type SelfCheckInSubmissionInput } from './SelfCheckInFlow'

const kioskExitHoldMs = 2000

type KioskCheckInViewProps = {
  errorMessage: string | null
  onExit: () => void | Promise<void>
  onSubmitKioskEntry: (input: SelfCheckInSubmissionInput) => Promise<void>
  players: SelfCheckInPlayerOption[]
  selectedSession: SessionDefinition
}

export function KioskCheckInView({
  errorMessage,
  onExit,
  onSubmitKioskEntry,
  players,
  selectedSession,
}: KioskCheckInViewProps) {
  const [exitHint, setExitHint] = useState('Gedrückt halten zum Abmelden')
  const exitTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current !== null) {
        window.clearTimeout(exitTimeoutRef.current)
      }
    }
  }, [])

  function clearExitHold() {
    if (exitTimeoutRef.current !== null) {
      window.clearTimeout(exitTimeoutRef.current)
      exitTimeoutRef.current = null
    }
    setExitHint('Gedrückt halten zum Abmelden')
  }

  function startExitHold() {
    if (exitTimeoutRef.current !== null) {
      return
    }

    setExitHint('Weiter halten...')
    exitTimeoutRef.current = window.setTimeout(() => {
      exitTimeoutRef.current = null
      void onExit()
    }, kioskExitHoldMs)
  }

  function handleExitKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    startExitHold()
  }

  function handleExitKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      clearExitHold()
    }
  }

  return (
    <main className="kiosk-checkin-page">
      <section className="kiosk-checkin-panel" aria-labelledby="kiosk-checkin-heading">
        <div className="status-line">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <div>
            <p className="eyebrow">Kiosk-Modus</p>
            <h1 id="kiosk-checkin-heading">Training Check-in</h1>
            <p>{selectedSession.title} · {selectedSession.date}</p>
          </div>
        </div>
        <SelfCheckInFlow
          confirmLabelForPlayer={(displayName) => `Ich bin ${displayName}.`}
          helperText="Wähle deinen Namen, fülle den kurzen Check-in aus und gib das Gerät weiter."
          onSubmit={onSubmitKioskEntry}
          players={players}
          submitLabel="Speichern und weitergeben"
          submittingLabel="Speichert..."
        />
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      </section>
      <button
        className="kiosk-exit-button"
        type="button"
        onPointerDown={startExitHold}
        onPointerLeave={clearExitHold}
        onPointerCancel={clearExitHold}
        onPointerUp={clearExitHold}
        onKeyDown={handleExitKeyDown}
        onKeyUp={handleExitKeyUp}
      >
        <LogOut className="nav-icon" aria-hidden />
        <span>{exitHint}</span>
      </button>
    </main>
  )
}
