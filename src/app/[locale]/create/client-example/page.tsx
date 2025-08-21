'use client'

import { useClientAuthGuard } from '@/lib/auth/client-guards'
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'

export default function ClientExamplePage() {
  const { checkAuth, isAuthenticated } = useClientAuthGuard()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      // Check authentication and redirect if not authenticated
      const userSession = await checkAuth({ returnTo: '/create/client-example' })
      setSession(userSession)
      setLoading(false)
    }

    verifyAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // This will only render if the user is authenticated
  // Otherwise, they'll be redirected to sign-in
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This page demonstrates the client-side auth guard using the useClientAuthGuard hook.
          </p>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
            <p className="text-sm text-green-700 dark:text-green-300">
              ✓ You are authenticated
            </p>
            {session && (
              <>
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                  Email: {session.user?.email}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  User ID: {session.user?.id}
                </p>
              </>
            )}
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
              <li>Automatic redirect to sign-in if not authenticated</li>
              <li>Preserves the current URL as returnTo parameter</li>
              <li>Provides isAuthenticated() helper function</li>
              <li>Provides redirectIfAuthenticated() for auth pages</li>
              <li>Works seamlessly with client components</li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={async () => {
                const authenticated = await isAuthenticated()
                alert(`Authentication status: ${authenticated ? 'Authenticated' : 'Not authenticated'}`)
              }}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Check Auth Status
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}