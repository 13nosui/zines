'use client'

import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Card, CardBody } from '@heroui/card'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getProfile, updateProfile, checkUsernameAvailability } from '@/lib/services/profile'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'

export default function UsernameEditPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [originalUsername, setOriginalUsername] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  
  // Debounce username for availability check
  const debouncedUsername = useDebounce(username, 500)
  
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      
      setIsLoading(true)
      const { data, error } = await getProfile(user.id)
      
      if (error) {
        console.error('Error loading profile:', error)
        toast.error(t('settings.profileSettings.updateError'))
      } else if (data) {
        setProfile(data)
        setUsername(data.username || '')
        setOriginalUsername(data.username || '')
      }
      
      setIsLoading(false)
    }
    
    loadProfile()
  }, [user, t])
  
  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!user || !debouncedUsername || debouncedUsername === originalUsername) {
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
  }, [debouncedUsername, user, originalUsername, t])
  
  const handleSave = async () => {
    if (!user || usernameError || username === originalUsername || username.length < 3) return
    
    setIsSaving(true)
    
    const { data, error } = await updateProfile(user.id, { username })
    
    if (error) {
      console.error('Error updating profile:', error)
      toast.error(t('settings.profileSettings.updateError'))
    } else if (data) {
      setProfile(data)
      setOriginalUsername(username)
      toast.success(t('settings.profileSettings.updateSuccess'))
      router.push(`/${currentLocale}/me`)
    }
    
    setIsSaving(false)
  }
  
  const handleBack = () => {
    router.push(`/${currentLocale}/me`)
  }
  
  const isValid = username.length >= 3 && !usernameError && username !== originalUsername
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-content1 border-b">
          <Button
            isIconOnly
            variant="light"
            onPress={handleBack}
            className="material-symbols-rounded"
          >
            arrow_back
          </Button>
          <h1 className="text-lg font-semibold flex-1">{t('settings.profileSettings.username')}</h1>
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={isSaving}
            isDisabled={!isValid}
          >
            {t('common.save')}
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <Card className="bg-content1">
            <CardBody className="p-4">
              <Input
                label={t('settings.profileSettings.username')}
                placeholder={t('settings.profileSettings.usernamePlaceholder')}
                value={username}
                onValueChange={setUsername}
                isInvalid={!!usernameError}
                errorMessage={usernameError}
                isDisabled={isLoading || isSaving}
                startContent={
                  <span className="material-symbols-rounded text-default-400">
                    person
                  </span>
                }
                classNames={{
                  inputWrapper: "h-14"
                }}
              />
              <p className="text-xs text-default-500 mt-2">
                {t('settings.profileSettings.usernameHint', { min: 3 })}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}