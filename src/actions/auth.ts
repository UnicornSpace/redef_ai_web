'use server'


import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'

export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // Points back to the route handler we just created
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    redirect('/auth/auth-error')
  }

  // Redirect the user to the provider's login interface
  if (data.url) {
    redirect(data.url)
  }
}
