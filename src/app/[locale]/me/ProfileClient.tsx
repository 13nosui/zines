'use client'

import { Avatar } from '@heroui/avatar'
import { Button } from '@heroui/button'
import { Divider } from '@heroui/divider'
import { useRouter, usePathname } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { getAvatarUrl } from '@/lib/supabase/storage'
import { Session } from '@supabase/supabase-js'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useAuth } from '@/components/providers/AuthProvider'

interface ProfileClientProps {
  session: Session
  initialProfile?: any
}

interface ProfileItemProps {
  label?: string
  value?: string
  icon?: string
  onClick: () => void
  variant?: 'default' | 'danger'
  showArrow?: boolean
}

function ProfileItem({ label, value, icon, onClick, variant = 'default', showArrow = true }: ProfileItemProps) {
  return (
    <Button
      className={`w-full h-[56px] px-4 py-2 justify-between rounded-none ${
        variant === 'danger' ? 'text-danger' : ''
      }`}
      variant="light"
      onPress={onClick}
      startContent={
        icon && (
          <span className={`material-symbols-rounded ${
            variant === 'danger' ? 'text-danger' : 'text-default-500'
          }`}>
            {icon}
          </span>
        )
      }
      endContent={
        showArrow && (
          <span className="material-symbols-rounded text-default-400">
            chevron_right
          </span>
        )
      }
    >
      <div className="flex-1 text-left">
        {label && value ? (
          <div className="flex flex-col items-start">
            <span className="text-xs text-default-500">{label}</span>
            <span className="text-sm font-medium">{value}</span>
          </div>
        ) : (
          <span className="text-sm font-medium">{label || value}</span>
        )}
      </div>
    </Button>
  )
}

export function ProfileClient({ session, initialProfile }: ProfileClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { profile } = useProfile()
  const currentProfile = profile || initialProfile
  const { theme } = useTheme()
  const t = useTranslations()
  const { signOut } = useAuth()
  
  // Navigation handlers
  const navigateToAvatarEdit = () => router.push(`/${currentLocale}/me/avatar`)
  const navigateToUsernameEdit = () => router.push(`/${currentLocale}/me/username`)
  const navigateToEmailEdit = () => router.push(`/${currentLocale}/me/email`)
  const navigateToLikes = () => router.push(`/${currentLocale}/me/likes`)
  const navigateToFollowing = () => router.push(`/${currentLocale}/me/following`)
  const navigateToFollowers = () => router.push(`/${currentLocale}/me/followers`)
  const navigateToColorMode = () => router.push(`/${currentLocale}/me/color-mode`)
  const navigateToPrivacyPolicy = () => router.push(`/${currentLocale}/privacy-policy`)
  const navigateToTermsOfService = () => router.push(`/${currentLocale}/terms-of-service`)
  const navigateToLogOutConfirm = () => router.push(`/${currentLocale}/me/logout`)
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-content1">
          <h1 className="text-xl font-semibold">{t('common.profile')}</h1>
        </div>
        
        {/* Profile Items List */}
        <div className="bg-content1">
          {/* Avatar Item */}
          <div className="h-[56px] px-4 flex items-center">
            <Button
              className="w-full h-full p-0 justify-between"
              variant="light"
              onPress={navigateToAvatarEdit}
              endContent={
                <span className="material-symbols-rounded text-default-400">
                  chevron_right
                </span>
              }
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar
                  src={getAvatarUrl(currentProfile?.avatar_url) || undefined}
                  name={currentProfile?.username || session.user.email}
                  className="w-10 h-10"
                  isBordered
                />
                <span className="text-sm font-medium">{t('settings.profileSettings.avatar')}</span>
              </div>
            </Button>
          </div>
          
          <Divider />
          
          {/* Username */}
          <ProfileItem
            label={t('settings.profileSettings.username')}
            value={currentProfile?.username || t('profile.noUsername')}
            icon="person"
            onClick={navigateToUsernameEdit}
          />
          
          <Divider />
          
          {/* Email */}
          <ProfileItem
            label={t('auth.email')}
            value={session.user.email}
            icon="mail"
            onClick={navigateToEmailEdit}
          />
          
          <Divider />
          
          {/* Likes */}
          <ProfileItem
            label={t('profile.likes')}
            icon="favorite"
            onClick={navigateToLikes}
          />
          
          <Divider />
          
          {/* Following */}
          <ProfileItem
            label={t('profile.following')}
            icon="group"
            onClick={navigateToFollowing}
          />
          
          <Divider />
          
          {/* Followers */}
          <ProfileItem
            label={t('profile.followers')}
            icon="groups"
            onClick={navigateToFollowers}
          />
          
          <Divider />
          
          {/* Color Mode */}
          <ProfileItem
            label={t('profile.colorMode')}
            value={theme === 'dark' ? t('settings.themes.dark') : theme === 'light' ? t('settings.themes.light') : t('settings.themes.system')}
            icon="palette"
            onClick={navigateToColorMode}
          />
          
          <Divider />
          
          {/* Privacy Policy */}
          <ProfileItem
            label={t('profile.privacyPolicy')}
            icon="privacy_tip"
            onClick={navigateToPrivacyPolicy}
          />
          
          <Divider />
          
          {/* Terms of Service */}
          <ProfileItem
            label={t('profile.termsOfService')}
            icon="description"
            onClick={navigateToTermsOfService}
          />
          
          {/* Spacing before Log Out */}
          <div className="h-4 bg-background" />
          
          {/* Log Out - Separated with background color */}
          <div className="bg-danger-50 dark:bg-danger-900/20">
            <ProfileItem
              label={t('auth.logout')}
              icon="logout"
              onClick={navigateToLogOutConfirm}
              variant="danger"
              showArrow={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}