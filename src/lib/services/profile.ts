import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export async function getProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateProfile(
  userId: string, 
  updates: ProfileUpdate
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function checkUsernameAvailability(
  username: string, 
  currentUserId?: string
): Promise<{ available: boolean; error: Error | null }> {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
    
    // If checking for current user, exclude their own username
    if (currentUserId) {
      query = query.neq('id', currentUserId)
    }
    
    const { data, error } = await query
    
    if (error) {
      return { available: false, error }
    }
    
    return { available: !data || data.length === 0, error: null }
  } catch (error) {
    return { available: false, error: error as Error }
  }
}