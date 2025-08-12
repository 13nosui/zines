import { serverAuthGuard } from '@/lib/auth/guards'
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This is your personal profile page. Only you can access this page.
          </p>
          
          <div className="space-y-6">
            {/* User Authentication Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Authentication Details
              </h2>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{session.user.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID:</dt>
                  <dd className="text-sm text-gray-900 dark:text-white font-mono">{session.user.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Provider:</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{session.user.app_metadata?.provider || 'email'}</dd>
                </div>
              </dl>
            </div>

            {/* Profile Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Profile Information
              </h2>
              {profile ? (
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Username:</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{profile.username || 'Not set'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Display Name:</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{profile.display_name || 'Not set'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since:</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No profile information found. You may need to complete your profile setup.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Edit Profile
              </button>
              <button className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Account Settings
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Protected Route Information
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            This page is protected by authentication. If you weren't logged in, you would have been 
            redirected to the sign-in page with a returnTo parameter pointing back to /me.
          </p>
        </div>
      </div>
    </div>
  )
}