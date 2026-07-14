import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AuthSessionState } from '../lib/auth'
import { AuthPanel } from './AuthPanel'

const signedOutAuthState: AuthSessionState = {
  status: 'signed-out',
  session: null,
  user: null,
  error: null,
}

const missingConfigAuthState: AuthSessionState = {
  status: 'missing-config',
  session: null,
  user: null,
  error: null,
}

describe('AuthPanel', () => {
  it('uses the OnField brand surface for coach login', () => {
    const markup = renderToStaticMarkup(<AuthPanel authState={signedOutAuthState} />)

    expect(markup).toContain('brand-surface-auth')
    expect(markup).toContain('Coach-Login')
    expect(markup).toContain('brand-surface-artwork-hero')
    expect(markup).toContain('Einloggen')
  })

  it('can join the welcome composition without nesting a second brand surface', () => {
    const markup = renderToStaticMarkup(<AuthPanel authState={signedOutAuthState} embedded />)

    expect(markup).toContain('auth-panel-embedded')
    expect(markup).toContain('Coach-Login')
    expect(markup).not.toContain('brand-surface')
    expect((markup.match(/of-button-primary/g) ?? []).length).toBe(1)
  })

  it('renders branded startup feedback without exposing an active login form', () => {
    const markup = renderToStaticMarkup(
      <AuthPanel authState={{ status: 'loading', session: null, user: null, error: null }} />,
    )

    expect(markup).toContain('OnField Coach wird vorbereitet')
    expect(markup).toContain('role="status"')
    expect(markup).not.toContain('current-password')
  })

  it('keeps setup copy limited to publishable client configuration', () => {
    const markup = renderToStaticMarkup(<AuthPanel authState={missingConfigAuthState} />)

    expect(markup).toContain('OnField Coach vorbereiten')
    expect(markup).toContain('Coach-Login ist noch nicht eingerichtet. Bitte Setup prüfen.')
    expect(markup).not.toContain('VITE_SUPABASE_URL')
    expect(markup).not.toContain('VITE_SUPABASE_PUBLISHABLE_KEY')
    expect(markup).not.toContain('.env')
    expect(markup).toContain('Keine Service-Role-Keys')
  })

  it('maps raw auth errors to safe coach-facing copy', () => {
    const markup = renderToStaticMarkup(
      <AuthPanel authState={{ ...signedOutAuthState, error: 'Invalid login credentials' }} />,
    )

    expect(markup).toContain('Login nicht möglich. Email oder Passwort prüfen.')
    expect(markup).not.toContain('Invalid login credentials')
  })

  it('distinguishes a network failure from invalid credentials', () => {
    const markup = renderToStaticMarkup(
      <AuthPanel authState={{ ...signedOutAuthState, error: 'Failed to fetch' }} />,
    )

    expect(markup).toContain('Keine Netzwerkverbindung')
    expect(markup).not.toContain('Email oder Passwort prüfen')
  })

  it('keeps controlled beta auth login-only', () => {
    const markup = renderToStaticMarkup(<AuthPanel authState={signedOutAuthState} />)

    expect(markup).toContain('Coach-Login')
    expect(markup).toContain('Einloggen')
    expect(markup).toContain('current-password')
    expect(markup).not.toMatch(/signup|sign up|registrieren|konto erstellen|account erstellen|create account/i)
    expect(markup).not.toContain('new-password')
  })
})
