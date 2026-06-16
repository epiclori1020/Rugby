import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
export const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

export const hasSupabaseConfig = supabaseUrl.length > 0 && supabasePublishableKey.length > 0

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: 'public',
      },
    })
  : null

export function createPublicCheckInClient(token: string) {
  if (!hasSupabaseConfig) {
    return null
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: `public-checkin-${token.slice(0, 12)}-${crypto.randomUUID()}`,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-checkin-token': token,
      },
    },
  })
}
