'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getProfile, updateProfile as updateProfileService } from '@/lib/services/profile'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      const { data, error } = await getProfile(user.id)
      
      if (error) {
        setError(error)
        setProfile(null)
      } else {
        setProfile(data)
        setError(null)
      }
      
      setLoading(false)
    }

    fetchProfile()
  }, [user])

  const refetch = async () => {
    if (!user) return
    
    setLoading(true)
    const { data, error } = await getProfile(user.id)
    
    if (error) {
      setError(error)
      setProfile(null)
    } else {
      setProfile(data)
      setError(null)
    }
    
    setLoading(false)
  }

  const updateProfile = useCallback(async (
    updates: ProfileUpdate,
    options?: { optimistic?: boolean }
  ): Promise<{ data: Profile | null; error: Error | null }> => {
    if (!user || !profile) {
      return { data: null, error: new Error('User not authenticated') }
    }

    setIsUpdating(true)
    setError(null)

    // Optimistic update
    if (options?.optimistic) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }

    try {
      const { data, error } = await updateProfileService(user.id, updates)
      
      if (error) {
        // Revert optimistic update on error
        if (options?.optimistic) {
          await refetch()
        }
        setError(error)
        setIsUpdating(false)
        return { data: null, error }
      }
      
      // Update with server response
      setProfile(data)
      setError(null)
      setIsUpdating(false)
      return { data, error: null }
    } catch (error) {
      // Revert optimistic update on error
      if (options?.optimistic) {
        await refetch()
      }
      const err = error as Error
      setError(err)
      setIsUpdating(false)
      return { data: null, error: err }
    }
  }, [user, profile, refetch])

  return { 
    profile, 
    loading, 
    error, 
    isUpdating,
    refetch,
    updateProfile
  }
}