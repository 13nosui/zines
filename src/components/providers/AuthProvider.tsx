'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (!supabase) return

    // Get initial session if not provided
    if (!initialSession && isInitialMount.current) {
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
      
      // Update local state
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle specific auth events without causing reload loops
      switch (event) {
        case 'SIGNED_IN':
          // Only refresh if it's not the initial mount
          if (!isInitialMount.current) {
            console.log('User signed in, refreshing data')
            // Remove router.refresh() to prevent reload loops
            // The auth state change will naturally update the UI
          }
          break
        case 'SIGNED_OUT':
          console.log('User signed out, redirecting to home')
          router.push('/')
          // Remove router.refresh() to prevent reload loops
          break
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed successfully')
          // No need to refresh the page on token refresh
          break
        case 'USER_UPDATED':
          console.log('User data updated')
          // Only refresh if specific user data changed that affects the UI
          // Avoid automatic refresh to prevent loops
          break
        case 'PASSWORD_RECOVERY':
          console.log('Password recovery initiated')
          break
      }
    })

    // Mark that initial mount is complete
    isInitialMount.current = false

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

  // Don't render children until initial auth state is established
  if (loading && isInitialMount.current) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}