'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Client-side auth guard hook for protecting routes in client components
 * @returns Auth state and helper functions
 */
export function useClientAuthGuard() {
  const supabase = createClient()
  
  const checkAuth = async (options?: {
    redirectTo?: string
    returnTo?: string
  }) => {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return null
    }
    
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
    if (!supabase) return false
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  }
  
  const redirectIfAuthenticated = async (redirectTo: string = '/') => {
    if (!supabase) return
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