import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server' // Path to your server-side client config

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // "next" is an optional parameter containing the path to redirect to after successful login
  const next = searchParams.get('next') ?? '/app/talk'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Google OAuth re-auths that requested the calendar scope (see
      // src/actions/google-calendar.ts:connectGoogleCalendar) come back
      // with provider tokens on the session — capture them here since this
      // is the only moment Supabase hands them to us. A plain sign-in
      // won't have these, so this is a no-op for the normal login flow.
      const providerToken = data.session?.provider_token
      const providerRefreshToken = data.session?.provider_refresh_token
      if (providerToken && data.user) {
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
        const update: {
          user_id: string
          access_token: string
          expires_at: string
          refresh_token?: string
        } = {
          user_id: data.user.id,
          access_token: providerToken,
          expires_at: expiresAt,
        }
        // Google only returns a refresh_token on the first consent — don't
        // clobber a previously-stored one with null on a re-auth that
        // didn't get a fresh one.
        if (providerRefreshToken) update.refresh_token = providerRefreshToken
        await supabase
          .from('google_calendar_connections')
          .upsert(update, { onConflict: 'user_id' })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    // The exchange can fail simply because this code was already consumed
    // by an earlier request for the same sign-in (e.g. a duplicate/raced
    // request) — if we're actually already signed in, that's not a real
    // failure, so don't send an already-authenticated user to an error page.
    const { data: existing } = await supabase.auth.getUser()
    if (existing.user) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    // This used to redirect to /auth/error with no query string at all, so
    // the error page always showed "An unspecified error occurred" no
    // matter what actually went wrong — completely useless for figuring
    // out why a sign-in failed. Passing the real Supabase error message
    // through is what makes that page tell you anything at all.
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`,
    )
  }

  // Reached with no "code" param at all — e.g. someone hit this URL
  // directly, or the provider redirected without one.
  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent('No sign-in code was returned. Try signing in again.')}`,
  )
}
