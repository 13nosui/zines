'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
  initialSession?: Session | null
}

export function AuthProvider({ children, initialSession = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [loading, setLoading] = useState(!initialSession)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) return

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
      if (event === 'SIGNED_IN') {
        router.refresh()
      } else if (event === 'SIGNED_OUT') {
        router.push('/')
        router.refresh()
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      } else if (event === 'USER_UPDATED') {
        // Refresh the page to get updated user data
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, initialSession, supabase])

  const signOut = async () => {
    if (!supabase) return
    
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
    setLoading(false)
  }

  const refreshSession = async () => {
    if (!supabase) return
    
    const { data: { session }, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Error refreshing session:', error)
    } else if (session) {
      setSession(session)
      setUser(session.user)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}