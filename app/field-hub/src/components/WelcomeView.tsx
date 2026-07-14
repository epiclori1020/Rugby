import type { AuthSessionState } from '../lib/auth'
import { AuthPanel } from './AuthPanel'
import { BrandSurface } from './onfield'

type WelcomeViewProps = {
  authState: AuthSessionState
}

export function WelcomeView({ authState }: WelcomeViewProps) {
  const isSignedOut = authState.status === 'signed-out'
  const title = authState.status === 'loading'
    ? 'OnField Coach wird vorbereitet'
    : authState.status === 'missing-config'
      ? 'OnField Coach vorbereiten'
      : 'Trainingstag vorbereiten'
  const body = authState.status === 'loading'
    ? 'Lokale Session und sichere Client-Konfiguration werden geprüft.'
    : authState.status === 'missing-config'
      ? 'Der Coach-Login benötigt eine browser-sichere Client-Konfiguration.'
      : 'Der ruhige Einstieg in Spielerstatus, Check-in und Trainingstag – auf iPhone und iPad mit demselben Funktionsumfang.'

  return (
    <main className="welcome-page">
      <BrandSurface
        artwork="hero"
        body={body}
        className="welcome-brand-surface"
        claim={isSignedOut ? 'Know squad status before the whistle.' : undefined}
        meta={isSignedOut ? (
          <ol className="welcome-steps" aria-label="Erste Schritte">
            <li className="is-current" aria-current="step"><strong>1. Login</strong><span>Coach-Session sicher öffnen</span></li>
            <li><strong>2. Spieler anlegen</strong><span>Aktiven Squad vorbereiten</span></li>
            <li><strong>3. Check-in öffnen</strong><span>Trainingstag starten</span></li>
          </ol>
        ) : undefined}
        title={title}
        variant="welcome"
      >
        <AuthPanel authState={authState} embedded />
      </BrandSurface>
    </main>
  )
}
