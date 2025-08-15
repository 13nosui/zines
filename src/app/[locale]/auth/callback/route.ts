import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const type = requestUrl.searchParams.get('type')
  const returnTo = requestUrl.searchParams.get('returnTo') || '/'

  // Handle OAuth errors
  if (error) {
    console.error('OAuth callback error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const supabase = createServerClient()

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(exchangeError.message)}`
        )
      }

      // Successful authentication
      if (data?.session) {
        // Check if this is a password recovery flow
        if (type === 'recovery') {
          return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password`)
        }

        // For new users, we might want to redirect to onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.session.user.id)
          .single()

        // If no profile exists or username is not set, redirect to onboarding
        if (!profile?.username) {
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
        }

        // Otherwise redirect to the returnTo URL or home
        return NextResponse.redirect(`${requestUrl.origin}${returnTo}`)
      }
    } catch (error) {
      console.error('Callback processing error:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent('Authentication failed')}`
      )
    }
  }

  // No code present, redirect to sign in
  return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in`)
}