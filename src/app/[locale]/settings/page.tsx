'use client'

import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Select, SelectItem } from '@heroui/select'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { useState, useEffect, useCallback } from 'react'
import { locales } from '@/i18n'
import { useAuth } from '@/components/providers/AuthProvider'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { uploadAvatar, deleteAvatar } from '@/lib/supabase/storage'
import { getProfile, updateProfile, checkUsernameAvailability } from '@/lib/services/profile'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'
import { BackButton } from '@/components/navigation/BackButton'

export default function SettingsPage() {
  const t = useTranslations()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [hasUsernameChanged, setHasUsernameChanged] = useState(false)
  
  // Get current locale from pathname
  const currentLocale = pathname.split('/')[1]
  
  // Debounce username for availability check
  const debouncedUsername = useDebounce(username, 500)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      
      setIsLoadingProfile(true)
      const { data, error } = await getProfile(user.id)
      
      if (error) {
        console.error('Error loading profile:', error)
        toast.error(t('settings.profileSettings.updateError'))
      } else if (data) {
        setProfile(data)
        setUsername(data.username)
      }
      
      setIsLoadingProfile(false)
    }
    
    loadProfile()
  }, [user, t])
  
  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!user || !debouncedUsername || debouncedUsername === profile?.username) {
        setUsernameError('')
        return
      }
      
      if (debouncedUsername.length < 3) {
        setUsernameError(t('settings.profileSettings.invalidUsername'))
        return
      }
      
      const { available, error } = await checkUsernameAvailability(debouncedUsername, user.id)
      
      if (error) {
        console.error('Error checking username:', error)
      } else if (!available) {
        setUsernameError(t('settings.profileSettings.usernameExists'))
      } else {
        setUsernameError('')
      }
    }
    
    checkUsername()
  }, [debouncedUsername, user, profile, t])

  const handleLocaleChange = (locale: string) => {
    // Replace the locale in the current pathname
    const segments = pathname.split('/')
    segments[1] = locale
    const newPathname = segments.join('/')
    router.push(newPathname)
  }
  
  const handleUsernameChange = (value: string) => {
    setUsername(value)
    setHasUsernameChanged(value !== profile?.username)
  }
  
  const handleSaveProfile = async () => {
    if (!user || !profile || usernameError || !hasUsernameChanged) return
    
    setIsSaving(true)
    
    const { data, error } = await updateProfile(user.id, { username })
    
    if (error) {
      console.error('Error updating profile:', error)
      toast.error(t('settings.profileSettings.updateError'))
    } else if (data) {
      setProfile(data)
      setHasUsernameChanged(false)
      toast.success(t('settings.profileSettings.updateSuccess'))
    }
    
    setIsSaving(false)
  }
  
  const handleAvatarUpload = async (file: File) => {
    if (!user) return
    
    setIsUploadingAvatar(true)
    
    const { url, error } = await uploadAvatar(user.id, file)
    
    if (error) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message)
    } else if (url) {
      // Update profile with new avatar URL
      const { data, error: updateError } = await updateProfile(user.id, { avatar_url: url })
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
        toast.error(t('settings.profileSettings.updateError'))
      } else if (data) {
        setProfile(data)
        toast.success(t('settings.profileSettings.updateSuccess'))
      }
    }
    
    setIsUploadingAvatar(false)
  }
  
  const handleAvatarRemove = async () => {
    if (!user) return
    
    setIsUploadingAvatar(true)
    
    const { success, error } = await deleteAvatar(user.id)
    
    if (error) {
      console.error('Error removing avatar:', error)
      toast.error(error.message)
    } else if (success) {
      // Update profile to remove avatar URL
      const { data, error: updateError } = await updateProfile(user.id, { avatar_url: null })
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
        toast.error(t('settings.profileSettings.updateError'))
      } else if (data) {
        setProfile(data)
        toast.success(t('settings.profileSettings.updateSuccess'))
      }
    }
    
    setIsUploadingAvatar(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // The AuthProvider will handle the redirect to '/' and refresh
      // But we'll also redirect to /auth/sign-in as requested
      router.push(`/${currentLocale}/auth/sign-in`)
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error(t('auth.errors.unexpected'))
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="max-w-[480px] mx-auto space-y-6 p-4">
        <div className="mb-6">
        </div>
      
      {user && (
        <Card>
          <CardHeader>
          </CardHeader>
          <CardBody className="space-y-6">
            <div>
              <p className="text-sm text-default-500 mb-4">{t('settings.profileSettings.avatar')}</p>
              <AvatarUpload
                currentAvatarUrl={profile?.avatar_url}
                username={profile?.username}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                isUploading={isUploadingAvatar}
              />
            </div>
            
            <div className="space-y-2">
              <Input
                label={t('settings.profileSettings.username')}
                placeholder={t('settings.profileSettings.usernamePlaceholder')}
                value={username}
                onValueChange={handleUsernameChange}
                isInvalid={!!usernameError}
                errorMessage={usernameError}
                isDisabled={isLoadingProfile || isSaving}
                classNames={{
                  input: "text-foreground"
                }}
                startContent={
                  <span className="material-symbols-rounded text-default-400">
                    person
                  </span>
                }
              />
              {hasUsernameChanged && !usernameError && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    color="primary"
                    onPress={handleSaveProfile}
                    isLoading={isSaving}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Social & Activity Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{t('settings.social')}</h3>
        </CardHeader>
        <CardBody className="space-y-3">
          <Button
            variant="flat"
            onPress={() => router.push(`/${currentLocale}/me/followers`)}
            className="w-full justify-between"
            endContent={
              <span className="material-symbols-rounded text-default-400">
                chevron_right
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-default-500">
                groups
              </span>
              <span>{t('settings.socialItems.followers')}</span>
            </div>
          </Button>
          <Button
            variant="flat"
            onPress={() => router.push(`/${currentLocale}/me/following`)}
            className="w-full justify-between"
            endContent={
              <span className="material-symbols-rounded text-default-400">
                chevron_right
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-default-500">
                group
              </span>
              <span>{t('settings.socialItems.following')}</span>
            </div>
          </Button>
          <Button
            variant="flat"
            onPress={() => router.push(`/${currentLocale}/me/likes`)}
            className="w-full justify-between"
            endContent={
              <span className="material-symbols-rounded text-default-400">
                chevron_right
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-default-500">
                favorite
              </span>
              <span>{t('settings.socialItems.likes')}</span>
            </div>
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
        </CardHeader>
        <CardBody>
          <Select
            label={t('settings.theme')}
            selectedKeys={[theme || 'system']}
            onSelectionChange={(keys) => setTheme(Array.from(keys)[0] as string)}
            className="max-w-full"
            classNames={{
              value: "text-foreground"
            }}
          >
            <SelectItem key="system">
              {t('settings.themes.system')}
            </SelectItem>
            <SelectItem key="light">
              {t('settings.themes.light')}
            </SelectItem>
            <SelectItem key="dark">
              {t('settings.themes.dark')}
            </SelectItem>
          </Select>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
        </CardHeader>
        <CardBody>
          <Select
            label={t('settings.language')}
            selectedKeys={[currentLocale]}
            onSelectionChange={(keys) => handleLocaleChange(Array.from(keys)[0] as string)}
            className="max-w-full"
            classNames={{
              value: "text-foreground"
            }}
          >
            {locales.map((locale) => (
              <SelectItem key={locale}>
                {t(`settings.languages.${locale}`)}
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
        </CardHeader>
        <CardBody className="space-y-3">
          <Button
            variant="flat"
            onPress={() => router.push(`/${currentLocale}/privacy-policy`)}
            className="w-full justify-between"
            endContent={
              <span className="material-symbols-rounded text-default-400">
                chevron_right
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-default-500">
                privacy_tip
              </span>
              <span>{t('profile.privacyPolicy')}</span>
            </div>
          </Button>
          <Button
            variant="flat"
            onPress={() => router.push(`/${currentLocale}/terms-of-service`)}
            className="w-full justify-between"
            endContent={
              <span className="material-symbols-rounded text-default-400">
                chevron_right
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-default-500">
                description
              </span>
              <span>{t('profile.termsOfService')}</span>
            </div>
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
        </CardHeader>
        <CardBody>
          <Button
            color="danger"
            variant="flat"
            onPress={handleSignOut}
            className="w-full"
            startContent={
              <span className="material-symbols-rounded">
                logout
              </span>
            }
          >
            {t('auth.logout')}
          </Button>
        </CardBody>
      </Card>
      
        {/* FAB Back Button */}
        <div className="fixed bottom-6 left-6 z-50">
          <BackButton variant="fab" />
        </div>
      </div>
    </div>
  )
}