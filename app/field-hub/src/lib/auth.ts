import type { Session, User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from './supabaseClient'

export type AuthSessionState =
  | { status: 'missing-config'; session: null; user: null; error: null }
  | { status: 'loading'; session: null; user: null; error: null }
  | { status: 'signed-out'; session: null; user: null; error: string | null }
  | { status: 'signed-in'; session: Session; user: User; error: string | null }

export async function loadCurrentSession(): Promise<AuthSessionState> {
  if (!hasSupabaseConfig || !supabase) {
    return { status: 'missing-config', session: null, user: null, error: null }
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return { status: 'signed-out', session: null, user: null, error: error.message }
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
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(error.message)
  }
}

export async function signOutCoach() {
  if (!supabase) {
    return
  }

  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}

