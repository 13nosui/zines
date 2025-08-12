'use client'

import { createClient } from '@/lib/supabase/client'
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

// Client-side auth functions
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'Authentication service unavailable' }
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: getAuthErrorMessage(error) }
  }
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'Authentication service unavailable' }
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: getAuthErrorMessage(error) }
  }
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'Authentication service unavailable' }
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: getAuthErrorMessage(error) }
  }
}

export async function signOut() {
  const supabase = createClient()
  
  if (!supabase) {
    return { error: 'Authentication service unavailable' }
  }
  
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    return { error: null }
  } catch (error) {
    return { error: getAuthErrorMessage(error) }
  }
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'Authentication service unavailable' }
  }
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: getAuthErrorMessage(error) }
  }
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'Authentication service unavailable' }
  }
  
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: getAuthErrorMessage(error) }
  }
}