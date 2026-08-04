'use server'


import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'

export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = await createClient()

  // Same fallback as the metadataBase in src/app/layout.tsx — without it, an
  // unset NEXT_PUBLIC_SITE_URL in production silently falls back to
  // whatever .env.local has (usually http://localhost:3000), bouncing
  // users back to localhost after they sign in with Google.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://redefai.app'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // Points back to the route handler we just created
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    redirect('/auth/error')
  }

  // Redirect the user to the provider's login interface
  if (data.url) {
    redirect(data.url)
  }
}
