import type { Session, User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from './supabaseClient'

export type AuthSessionState =
  | { status: 'missing-config'; session: null; user: null; error: null }
  | { status: 'loading'; session: null; user: null; error: null }
  | { status: 'signed-out'; session: null; user: null; error: string | null }
  | { status: 'signed-in'; session: Session; user: User; error: string | null }

export function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const normalized = message.toLocaleLowerCase('de-AT')

  if (
    normalized.includes('invalid login') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('email not confirmed') ||
    normalized.includes('invalid_grant')
  ) {
    return 'Login nicht möglich. Email oder Passwort prüfen.'
  }

  if (normalized.includes('not configured') || normalized.includes('supabase ist noch nicht konfiguriert')) {
    return 'Coach-Login ist noch nicht eingerichtet. Bitte Setup prüfen.'
  }

  if (normalized.includes('session') || normalized.includes('jwt') || normalized.includes('refresh')) {
    return 'Coach-Session konnte nicht geladen werden. Bitte erneut anmelden.'
  }

  return 'Aktion konnte nicht abgeschlossen werden. Bitte erneut versuchen.'
}

export async function loadCurrentSession(): Promise<AuthSessionState> {
  if (!hasSupabaseConfig || !supabase) {
    return { status: 'missing-config', session: null, user: null, error: null }
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return { status: 'signed-out', session: null, user: null, error: authErrorMessage(error) }
  }

  if (!data.session) {
    return { status: 'signed-out', session: null, user: null, error: null }
  }

  return {
    status: 'signed-in',
    session: data.session,
    user: data.session.user,
    error: null,
  }
}

export async function signInWithEmailPassword(email: string, password: string) {
  if (!supabase) {
    throw new Error('Coach-Login ist noch nicht eingerichtet. Bitte Setup prüfen.')
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(authErrorMessage(error))
  }
}

export async function signOutCoach() {
  if (!supabase) {
    return
  }

  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error('Logout nicht abgeschlossen. Bitte erneut versuchen.')
  }
}
