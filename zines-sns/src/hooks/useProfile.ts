'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getProfile } from '@/lib/services/profile'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

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

  return { profile, loading, error, refetch }
}