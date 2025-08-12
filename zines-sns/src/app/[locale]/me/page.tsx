import { serverAuthGuard } from '@/lib/auth/server-guards'
import { createServerClient } from '@/lib/supabase/server'
import { Metadata } from 'next'

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            My Profile
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              This page is protected by the server-side auth guard.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
            <h2 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Authentication Status
            </h2>
            <p className="text-sm text-green-700 dark:text-green-300">
              ✓ You are authenticated
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-green-700 dark:text-green-300">
                Email: {session.user.email}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                User ID: {session.user.id}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Session expires: {new Date(session.expires_at || '').toLocaleString()}
              </p>
            </div>
          </div>

          {profile && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6">
              <h2 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Profile Data
              </h2>
              <div className="space-y-1">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Username: {(profile as any).username || 'Not set'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Created: {new Date((profile as any).created_at).toLocaleString()}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Updated: {new Date((profile as any).updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Server-Side Auth Guard Features
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
              <li>Runs before the page component renders</li>
              <li>Automatic redirect to sign-in if not authenticated</li>
              <li>Preserves the current URL as returnTo parameter</li>
              <li>Returns the authenticated session for use in the component</li>
              <li>Zero client-side JavaScript needed for protection</li>
              <li>SEO-friendly as the redirect happens server-side</li>
            </ul>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Raw Session Data
            </h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-xs">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}