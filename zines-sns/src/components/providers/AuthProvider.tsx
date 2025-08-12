'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ 
  children,
  initialSession 
}: { 
  children: React.ReactNode
  initialSession?: Session | null 
}) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession ?? null)
  const [loading, setLoading] = useState(!initialSession)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session if not provided
    if (!initialSession) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
    }

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event)
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle specific auth events
      switch (event) {
        case 'SIGNED_IN':
          router.refresh()
          break
        case 'SIGNED_OUT':
          router.push('/auth/sign-in')
          break
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed successfully')
          break
        case 'USER_UPDATED':
          router.refresh()
          break
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, initialSession])

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}