'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      
      if (!supabase) {
        setError(t('auth.errors.unexpected'))
        setIsPolling(false)
        return
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session check error:', sessionError)
          setError(sessionError.message)
          setIsPolling(false)
          return
        }

        if (session) {
          // Session found - stop polling and redirect
          setIsPolling(false)
          
          // Check if user has a profile/username
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single()

          // Get redirect URL from search params or default
          const returnTo = searchParams.get('returnTo') || '/'
          
          if (!profile?.username) {
            router.push('/onboarding')
          } else {
            router.push(returnTo)
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
        setError(t('auth.errors.unexpected'))
        setIsPolling(false)
      }
    }

    // Check for error in URL params first
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (errorParam) {
      setError(errorDescription || errorParam)
      setIsPolling(false)
      return
    }

    // Initial session check
    checkSession()

    // Set up polling interval if still polling
    let intervalId: NodeJS.Timeout | null = null
    
    if (isPolling) {
      intervalId = setInterval(() => {
        checkSession()
      }, 1000) // Poll every 1 second
    }

    // Cleanup interval on unmount or when polling stops
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [router, searchParams, t, isPolling])

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <div className="mt-4">
              <a
                href="/auth/sign-in"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('auth.backToSignIn')}
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state with spinner
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mb-8">
            {/* Spinner */}
            <div className="inline-flex items-center justify-center">
              <svg 
                className="animate-spin h-12 w-12 text-indigo-600 dark:text-indigo-400" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('auth.pleaseWait')}
          </p>
        </div>
      </div>
    </div>
  )
}


