import { LogIn, LogOut, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import type { AuthSessionState } from '../lib/auth'
import { authErrorMessage, signInWithEmailPassword, signOutCoach } from '../lib/auth'
import { BrandSurface } from './onfield'
import { PrimaryButton, SecondaryButton } from './ui'

type AuthPanelProps = {
  authState: AuthSessionState
  embedded?: boolean
}

export function AuthPanel({ authState, embedded = false }: AuthPanelProps) {
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

  let title: string
  let body: string
  let content: ReactNode

  if (authState.status === 'loading') {
    title = 'OnField Coach wird vorbereitet'
    body = 'Lokale Session und sichere Client-Konfiguration werden geprüft.'
    content = <p role="status" aria-live="polite">App-Status wird geladen…</p>
  } else if (authState.status === 'missing-config') {
    title = 'OnField Coach vorbereiten'
    body = 'Coach-Login ist noch nicht eingerichtet. Bitte Setup prüfen.'
    content = (
      <div className="status-line">
        <ShieldCheck className="nav-icon" aria-hidden />
        <p>Keine Service-Role-Keys, DB-Passwörter oder echten Spieler-/Gesundheitsdaten eintragen.</p>
      </div>
    )
  } else if (authState.status === 'signed-in') {
    title = 'Coach-Session'
    body = 'Deine Coach-Session ist aktiv. Check-in, Einheit und Nachbereitung bleiben lokal nutzbar und synchronisieren über den eingerichteten Client.'
    content = (
      <>
        <p>Eingeloggt als {authState.user.email ?? authState.user.id}.</p>
        <SecondaryButton icon={<LogOut className="nav-icon" aria-hidden />} isLoading={isSubmitting} loadingLabel="Logout läuft" onClick={handleLogout}>
          Logout
        </SecondaryButton>
        {error ? <p className="form-error">{error}</p> : null}
      </>
    )
  } else {
    title = 'Coach-Login'
    body = 'Melde dich an, damit OnField Spieler, Check-ins und offene Aufgaben zwischen iPhone und iPad synchron halten kann.'
    content = (
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
        <PrimaryButton icon={<LogIn className="nav-icon" aria-hidden />} isLoading={isSubmitting} loadingLabel="Login läuft" type="submit">
          Einloggen
        </PrimaryButton>
        {displayedError ? <p className="form-error">{displayedError}</p> : null}
      </form>
    )
  }

  if (embedded) {
    return (
      <section className="auth-panel auth-panel-embedded" aria-labelledby="welcome-auth-title">
        <div className="auth-panel-heading">
          <h2 id="welcome-auth-title">{title}</h2>
          <p>{body}</p>
        </div>
        {content}
      </section>
    )
  }

  return (
    <BrandSurface
      artwork={authState.status === 'signed-in' ? 'none' : 'hero'}
      body={body}
      className="auth-panel"
      title={title}
      variant={authState.status === 'signed-in' ? 'compact' : 'auth'}
    >
      {content}
    </BrandSurface>
  )
}
