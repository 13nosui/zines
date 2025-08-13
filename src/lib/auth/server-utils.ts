import { createServerActionClient } from '@/lib/supabase/server'
import { AuthError } from '@supabase/supabase-js'

// Error message mapping for user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Invalid email or password. Please try again.',
  'User already registered': 'An account with this email already exists.',
  'Email not confirmed': 'Please check your email to confirm your account.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
  'Invalid email': 'Please enter a valid email address.',
  'User not found': 'No account found with this email address.',
  'Invalid refresh token': 'Your session has expired. Please sign in again.',
  'OAuth error': 'There was an error signing in with this provider. Please try again.',
}

export function getAuthErrorMessage(error: AuthError | Error | unknown): string {
  if (error instanceof AuthError) {
    return ERROR_MESSAGES[error.message] || error.message || 'An authentication error occurred.'
  }
  
  if (error instanceof Error) {
    return ERROR_MESSAGES[error.message] || error.message || 'An unexpected error occurred.'
  }
  
  return 'An unexpected error occurred. Please try again.'
}

// Server-side auth functions
export async function getSession() {
  const supabase = await createServerActionClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) throw error
    
    return { session, error: null }
  } catch (error) {
    return { session: null, error: getAuthErrorMessage(error) }
  }
}

export async function getUser() {
  const supabase = await createServerActionClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    
    return { user, error: null }
  } catch (error) {
    return { user: null, error: getAuthErrorMessage(error) }
  }
}