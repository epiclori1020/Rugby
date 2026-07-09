import { LogIn, LogOut, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { AuthSessionState } from '../lib/auth'
import { authErrorMessage, signInWithEmailPassword, signOutCoach } from '../lib/auth'
import { BrandSurface } from './onfield'
import { PrimaryButton, SecondaryButton } from './ui'

type AuthPanelProps = {
  authState: AuthSessionState
}

export function AuthPanel({ authState }: AuthPanelProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const displayedError = error ?? (authState.error ? authErrorMessage(new Error(authState.error)) : null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await signInWithEmailPassword(email, password)
      setPassword('')
    } catch (caughtError) {
      setError(authErrorMessage(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    setError(null)
    setIsSubmitting(true)

    try {
      await signOutCoach()
    } catch (caughtError) {
      setError(authErrorMessage(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authState.status === 'missing-config') {
    return (
      <BrandSurface
        body="Coach-Login ist noch nicht eingerichtet. Bitte Setup prüfen."
        className="auth-panel"
        meta={
          <p>
            Login bleibt gesperrt, bis die browser-sichere Konfiguration lokal vorhanden ist.
          </p>
        }
        title="OnField Coach vorbereiten"
        variant="auth"
      >
        <div className="status-line">
          <ShieldCheck className="nav-icon" aria-hidden />
          <p>Keine Service-Role-Keys, DB-Passwoerter oder echten Spieler-/Gesundheitsdaten eintragen.</p>
        </div>
      </BrandSurface>
    )
  }

  if (authState.status === 'signed-in') {
    return (
      <BrandSurface
        body="Deine Coach-Session ist aktiv. Check-in, Einheit und Nachbereitung bleiben lokal nutzbar und synchronisieren über den eingerichteten Client."
        className="auth-panel"
        title="Coach-Session"
        variant="compact"
      >
        <p>Eingeloggt als {authState.user.email ?? authState.user.id}.</p>
        <SecondaryButton icon={<LogOut className="nav-icon" aria-hidden />} isLoading={isSubmitting} loadingLabel="Logout laeuft" onClick={handleLogout}>
          Logout
        </SecondaryButton>
        {error ? <p className="form-error">{error}</p> : null}
      </BrandSurface>
    )
  }

  return (
    <BrandSurface
      body="Melde dich an, damit OnField Spieler, Check-ins und offene Aufgaben zwischen iPhone und iPad synchron halten kann."
      className="auth-panel"
      title="Coach-Login"
      variant="auth"
    >
      <form className="field-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          <span>Passwort</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <PrimaryButton icon={<LogIn className="nav-icon" aria-hidden />} isLoading={isSubmitting} loadingLabel="Login laeuft" type="submit">
          Einloggen
        </PrimaryButton>
        {displayedError ? <p className="form-error">{displayedError}</p> : null}
      </form>
    </BrandSurface>
  )
}
