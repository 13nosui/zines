'use client'

import { Avatar } from '@heroui/avatar'
import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { useRouter, usePathname } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { getAvatarUrl } from '@/lib/supabase/storage'
import { Session } from '@supabase/supabase-js'

interface ProfileClientProps {
  session: Session
  initialProfile?: any
}

export function ProfileClient({ session, initialProfile }: ProfileClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { profile } = useProfile()
  const currentProfile = profile || initialProfile
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">My Profile</h1>
              <Button
                variant="flat"
                onPress={() => router.push(`/${currentLocale}/settings`)}
                startContent={
                  <span className="material-symbols-rounded">
                    settings
                  </span>
                }
              >
                Edit Profile
              </Button>
            </div>
            
            <div className="flex items-center gap-6 mb-8">
              <Avatar
                src={getAvatarUrl(currentProfile?.avatar_url) || undefined}
                name={currentProfile?.username || session.user.email}
                className="w-24 h-24 text-large"
                isBordered
              />
              <div>
                <h2 className="text-xl font-semibold">
                  {currentProfile?.username || 'No username set'}
                </h2>
                <p className="text-default-500">{session.user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="bg-green-50 dark:bg-green-900/20">
                <CardBody>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                    Authentication Status
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ You are authenticated
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      User ID: {session.user.id}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Session expires: {new Date(session.expires_at || '').toLocaleString()}
                    </p>
                  </div>
                </CardBody>
              </Card>

              {currentProfile && (
                <Card className="bg-blue-50 dark:bg-blue-900/20">
                  <CardBody>
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Profile Data
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Username: {currentProfile.username}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Avatar: {currentProfile.avatar_url ? 'Set' : 'Not set'}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Created: {new Date(currentProfile.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Updated: {new Date(currentProfile.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}