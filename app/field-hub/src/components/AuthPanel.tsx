import { LogIn, LogOut, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { AuthSessionState } from '../lib/auth'
import { signInWithEmailPassword, signOutCoach } from '../lib/auth'

type AuthPanelProps = {
  authState: AuthSessionState
}

export function AuthPanel({ authState }: AuthPanelProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await signInWithEmailPassword(email, password)
      setPassword('')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Login fehlgeschlagen.')
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
      setError(caughtError instanceof Error ? caughtError.message : 'Logout fehlgeschlagen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authState.status === 'missing-config') {
    return (
      <section className="panel auth-panel" aria-label="Supabase Setup">
        <div className="status-line">
          <ShieldCheck className="nav-icon" aria-hidden />
          <h3>Supabase Setup</h3>
        </div>
        <p>
          Lege zuerst ein Supabase-Projekt an und setze lokal in <code>app/field-hub/.env</code> nur
          <code> VITE_SUPABASE_URL</code> und <code> VITE_SUPABASE_PUBLISHABLE_KEY</code>.
        </p>
        <p>Keine Service-Role-Keys, DB-Passwoerter oder echten Spieler-/Gesundheitsdaten eintragen.</p>
      </section>
    )
  }

  if (authState.status === 'signed-in') {
    return (
      <section className="panel auth-panel" aria-label="Coach Login">
        <div className="status-line">
          <ShieldCheck className="nav-icon" aria-hidden />
          <h3>Coach-Session</h3>
        </div>
        <p>Eingeloggt als {authState.user.email ?? authState.user.id}.</p>
        <button className="secondary-action" type="button" onClick={handleLogout} disabled={isSubmitting}>
          <LogOut className="nav-icon" aria-hidden />
          <span>Logout</span>
        </button>
        {error ? <p className="form-error">{error}</p> : null}
      </section>
    )
  }

  return (
    <section className="panel auth-panel" aria-label="Coach Login">
      <div className="status-line">
        <LogIn className="nav-icon" aria-hidden />
        <h3>Coach-Login</h3>
      </div>
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
        <button className="primary-action" type="submit" disabled={isSubmitting}>
          <LogIn className="nav-icon" aria-hidden />
          <span>{isSubmitting ? 'Login laeuft...' : 'Einloggen'}</span>
        </button>
        {authState.error || error ? <p className="form-error">{error ?? authState.error}</p> : null}
      </form>
    </section>
  )
}

