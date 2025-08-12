import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

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