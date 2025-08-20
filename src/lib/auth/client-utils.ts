'use client'

import { createClient } from '@/lib/supabase/client'
import { AuthError } from '@supabase/supabase-js'

// Error message mapping to translation keys
const ERROR_MESSAGE_KEYS: Record<string, string> = {
  'Invalid login credentials': 'auth.errors.invalidCredentials',
  'User already registered': 'auth.errors.userAlreadyExists',
  'Email not confirmed': 'auth.errors.emailNotConfirmed',
  'Password should be at least 6 characters': 'auth.validation.passwordMinLength',
  'Password should be at least 8 characters': 'auth.validation.passwordMinLength',
  'Invalid email': 'auth.validation.emailInvalid',
  'User not found': 'auth.errors.userNotFound',
  'Invalid refresh token': 'auth.errors.sessionExpired',
  'OAuth error': 'auth.errors.oauthError',
}

export function getAuthErrorKey(error: AuthError | Error | unknown): string {
  if (error instanceof AuthError) {
    return ERROR_MESSAGE_KEYS[error.message] || error.message || 'auth.errors.unexpected'
  }
  
  if (error instanceof Error) {
    return ERROR_MESSAGE_KEYS[error.message] || error.message || 'auth.errors.unexpected'
  }
  
  return 'auth.errors.unexpected'
}

// Client-side auth functions
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'auth.errors.unexpected' }
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: getAuthErrorKey(error) }
  }
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'auth.errors.unexpected' }
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
    return { data: null, error: getAuthErrorKey(error) }
  }
}

export async function signInWithOAuth(provider: 'google' | 'github', returnTo?: string) {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'auth.errors.unexpected' }
  }
  
  try {
    // Build the callback URL with returnTo parameter if provided
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
    if (returnTo) {
      callbackUrl.searchParams.set('returnTo', returnTo)
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: getAuthErrorKey(error) }
  }
}

export async function signOut() {
  const supabase = createClient()
  
  if (!supabase) {
    return { error: 'auth.errors.unexpected' }
  }
  
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    return { error: null }
  } catch (error) {
    return { error: getAuthErrorKey(error) }
  }
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'auth.errors.unexpected' }
  }
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: getAuthErrorKey(error) }
  }
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'auth.errors.unexpected' }
  }
  
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: getAuthErrorKey(error) }
  }
}

export async function resendVerificationEmail(email: string) {
  const supabase = createClient()
  
  if (!supabase) {
    return { data: null, error: 'auth.errors.unexpected' }
  }
  
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: getAuthErrorKey(error) }
  }
}