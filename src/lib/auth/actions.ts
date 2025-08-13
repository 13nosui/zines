'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signOutAction() {
  const supabase = await createServerActionClient()
  
  await supabase.auth.signOut()
  
  // Clear all cookies
  const cookieStore = cookies()
  cookieStore.getAll().forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.delete(cookie.name)
    }
  })
  
  redirect('/auth/sign-in')
}

export async function getSessionAction() {
  const supabase = await createServerActionClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  
  return session
}