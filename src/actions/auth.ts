'use server'

import { createClient } from '@/lib/server'
import { currentOrigin } from '@/lib/request-origin'

/**
 * Returns the provider's consent-screen URL (or an error) rather than
 * calling next/navigation's redirect() itself. redirect() works by
 * throwing a special signal that Next.js's framework code has to catch —
 * reliable when a Server Action is used as a <form action>, flakier when
 * it's invoked imperatively from a plain onClick with no error handling
 * around it (exactly how this was being called), because there's nothing
 * to tell a genuine failure apart from that signal. Returning data and
 * having the client do `window.location.href = url` — the same pattern
 * already used by connectGoogleCalendar — sidesteps that entirely and
 * means a real failure can actually reach the user instead of the button
 * just doing nothing.
 */
export async function signInWithOAuth(
  provider: 'google' | 'github',
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const origin = await currentOrigin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  if (!data.url) return { error: 'No sign-in URL returned — try again in a moment.' }
  return { url: data.url }
}
