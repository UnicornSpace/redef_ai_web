import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    // An empty string still passes createBrowserClient without throwing, but
    // every request it makes then fails server-side with the cryptic
    // "No API key found in request" — fail loudly here instead, at the
    // actual misconfiguration, in whichever environment is missing them.
    throw new Error(
      'Supabase client misconfigured: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing or empty in this environment.',
    )
  }
  return createBrowserClient(url, anonKey)
}
