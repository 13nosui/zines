import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'

/**
 * Server-side auth guard for protecting routes in server components
 * @param options Configuration options for the guard
 * @returns The authenticated session or redirects if not authenticated
 */
export async function serverAuthGuard(options?: {
  redirectTo?: string
  returnTo?: string
}) {
  const supabase = createServerClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    const redirectTo = options?.redirectTo || '/auth/sign-in'
    const returnTo = options?.returnTo || null
    
    const url = new URL(redirectTo, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    if (returnTo) {
      url.searchParams.set('returnTo', returnTo)
    }
    
    redirect(url.toString())
  }

  return session
}

/**
 * Client-side auth guard hook for protecting routes in client components
 * @returns Auth state and helper functions
 */
export function useClientAuthGuard() {
  const supabase = createBrowserClient()
  
  const checkAuth = async (options?: {
    redirectTo?: string
    returnTo?: string
  }) => {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      const redirectTo = options?.redirectTo || '/auth/sign-in'
      const returnTo = options?.returnTo || window.location.pathname
      
      const url = new URL(redirectTo, window.location.origin)
      if (returnTo && returnTo !== '/') {
        url.searchParams.set('returnTo', returnTo)
      }
      
      window.location.href = url.toString()
      return null
    }
    
    return session
  }
  
  const isAuthenticated = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  }
  
  const redirectIfAuthenticated = async (redirectTo: string = '/') => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // Check for returnTo param in URL
      const params = new URLSearchParams(window.location.search)
      const returnTo = params.get('returnTo')
      
      window.location.href = returnTo || redirectTo
    }
  }
  
  return {
    checkAuth,
    isAuthenticated,
    redirectIfAuthenticated
  }
}