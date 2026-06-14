import { useEffect, useState } from 'react'
import { type AuthSessionState, loadCurrentSession } from '../lib/auth'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'

const initialAuthState: AuthSessionState = hasSupabaseConfig
  ? { status: 'loading', session: null, user: null, error: null }
  : { status: 'missing-config', session: null, user: null, error: null }

export function useAuthSession() {
  const [authState, setAuthState] = useState<AuthSessionState>(initialAuthState)

  useEffect(() => {
    let isMounted = true

    Promise.resolve()
      .then(loadCurrentSession)
      .then((sessionState) => {
        if (isMounted) {
          setAuthState(sessionState)
        }
      })
      .catch((caughtError) => {
        if (isMounted) {
          setAuthState({
            status: 'signed-out',
            session: null,
            user: null,
            error: caughtError instanceof Error ? caughtError.message : 'Auth-Status konnte nicht geladen werden.',
          })
        }
      })

    if (!supabase) {
      return () => {
        isMounted = false
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return
      }

      if (!session) {
        setAuthState({ status: 'signed-out', session: null, user: null, error: null })
        return
      }

      setAuthState({ status: 'signed-in', session, user: session.user, error: null })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return authState
}
