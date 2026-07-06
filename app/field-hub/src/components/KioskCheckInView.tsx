import { ClipboardCheck, LogOut } from 'lucide-react'
import { activeSportConfig } from '../config/labels'
import type { SessionDefinition } from '../content/types'
import { BrandSurface } from './onfield'
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
      <BrandSurface
        body={`${formatSessionDate(selectedSession.date)} · ${sessionDetail(selectedSession.title)}`}
        className="kiosk-checkin-panel"
        claim="Know squad status before the whistle."
        meta={<span>{activeSportConfig.productLabel} Kiosk</span>}
        title="Training Check-in"
        variant="kiosk"
      >
        <div className="status-line">
          <ClipboardCheck className="placeholder-icon" aria-hidden />
          <p>Wähle deinen Namen, fülle den kurzen Check-in aus und gib das Gerät weiter.</p>
        </div>
      </BrandSurface>

      <section className="self-checkin-panel kiosk-flow-panel" aria-label="Kiosk Check-in">
        <SelfCheckInFlow
          autoResetAfterSubmitMs={3000}
          completionBody="Check-in ist gespeichert. Gib das Gerät jetzt weiter."
          completionTitle="Gespeichert"
          helperText="Wähle deinen Namen, fülle den kurzen Check-in aus und gib das Gerät weiter."
          mode="kiosk"
          onSubmit={onSubmitKioskEntry}
          players={players}
          resetActionLabel="Nächsten Check-in starten"
          submitLabel="Speichern und weitergeben"
          submittingLabel="Speichert..."
        />
        {errorMessage ? <p className="form-error" role="alert">{errorMessage}</p> : null}
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
