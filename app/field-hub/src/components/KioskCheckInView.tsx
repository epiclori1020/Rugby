import { ClipboardCheck, LogOut } from 'lucide-react'
import type { SessionDefinition } from '../content/types'
import { SelfCheckInFlow, type SelfCheckInPlayerOption, type SelfCheckInSubmissionInput } from './SelfCheckInFlow'

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

  function handleExitClick() {
    if (window.confirm('Kiosk beenden und zur Coach-Ansicht zurückkehren?')) {
      void onExit()
    }
  }

  return (
    <main className="kiosk-checkin-page">
      <section className="kiosk-checkin-panel" aria-labelledby="kiosk-checkin-heading">
        <div className="status-line">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <div>
            <h1 id="kiosk-checkin-heading">Training Check-in</h1>
            <p>
              {formatSessionDate(selectedSession.date)} · {sessionDetail(selectedSession.title)}
            </p>
          </div>
        </div>
        <SelfCheckInFlow
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
        onClick={handleExitClick}
      >
        <LogOut className="nav-icon" aria-hidden />
        <span>Kiosk beenden</span>
      </button>
    </main>
  )
}
