import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server' // Path to your server-side client config

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // "next" is an optional parameter containing the path to redirect to after successful login
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}/app/talk`)
    }
  }

  // Return the user to an error page if the exchange fails
  return NextResponse.redirect(`${origin}/auth/auth-error`)
}
