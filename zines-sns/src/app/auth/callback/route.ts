import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/'
  const type = requestUrl.searchParams.get('type') // For password recovery

  // Handle OAuth errors
  if (error) {
    const errorMessage = errorDescription || error
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Enhanced cookie options for security
            const enhancedOptions = {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              path: '/',
            }
            cookieStore.set({ name, value, ...enhancedOptions })
          },
          remove(name: string, options: any) {
            // Ensure proper cookie removal
            const enhancedOptions = {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              path: '/',
            }
            cookieStore.set({ name, value: '', ...enhancedOptions, maxAge: 0 })
          }
        }
      }
    )
    
    try {
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError)
        throw sessionError
      }

      // Get the session to verify it was created
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession()
      
      if (getSessionError || !session) {
        throw new Error('Failed to establish session')
      }

      // Handle password recovery flow
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', request.url))
      }

      // Create response with security headers
      const response = NextResponse.redirect(new URL(redirectTo, request.url))
      
      // Set security headers
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      
      return response
    } catch (error) {
      console.error('Auth callback error:', error)
      
      // Determine error message
      let errorMessage = 'Authentication failed. Please try again.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Redirect to sign in with error message
      return NextResponse.redirect(
        new URL(`/auth/sign-in?error=${encodeURIComponent(errorMessage)}`, request.url)
      )
    }
  }

  // No code provided - redirect to sign in
  return NextResponse.redirect(new URL('/auth/sign-in', request.url))
}