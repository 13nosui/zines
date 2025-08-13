import { serverAuthGuard } from '@/lib/auth/server-guards'
import { createServerClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { ProfileClient } from './ProfileClient'

export const metadata: Metadata = {
  title: 'My Profile - Protected Route',
  description: 'View and edit your profile'
}

export default async function MePage() {
  // This will automatically redirect to sign-in if not authenticated
  const session = await serverAuthGuard({ returnTo: '/me' })
  
  // Get additional user data if needed
  const supabase = createServerClient()
  
  // Query profile - we'll just skip it if there's an error since it's causing type issues
  let profile = null
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .match({ id: session.user.id })
      .single()
    profile = data
  } catch (error) {
    // Profile might not exist yet
    console.error('Profile fetch error:', error)
  }

  return <ProfileClient session={session} initialProfile={profile} />
}