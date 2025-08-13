'use client'

import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Card, CardBody } from '@heroui/card'
import { Alert } from '@heroui/alert'
import { Skeleton } from '@heroui/skeleton'
import { Spinner } from '@heroui/spinner'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { checkUsernameAvailability } from '@/lib/services/profile'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'

// Username validation regex: alphanumeric, underscore, dash
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/
const MAX_USERNAME_LENGTH = 24
const MIN_USERNAME_LENGTH = 3

export default function UsernameEditPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { profile, loading, error, updateProfile, isUpdating } = useProfile()
  const [username, setUsername] = useState('')
  const [originalUsername, setOriginalUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  
  // Debounce username for availability check
  const debouncedUsername = useDebounce(username, 500)
  
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setOriginalUsername(profile.username || '')
    }
  }, [profile])
  
  // Validate username format
  const validateUsername = (value: string): string => {
    if (!value) {
      return ''
    }
    
    if (value.length < MIN_USERNAME_LENGTH) {
      return t('settings.profileSettings.usernameTooShort', { min: MIN_USERNAME_LENGTH })
    }
    
    if (value.length > MAX_USERNAME_LENGTH) {
      return t('settings.profileSettings.usernameTooLong', { max: MAX_USERNAME_LENGTH })
    }
    
    if (!USERNAME_REGEX.test(value)) {
      return t('settings.profileSettings.usernameInvalidFormat')
    }
    
    return ''
  }
  
  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!profile || !debouncedUsername || debouncedUsername === originalUsername) {
        setUsernameError('')
        setIsCheckingAvailability(false)
        return
      }
      
      // First validate format
      const formatError = validateUsername(debouncedUsername)
      if (formatError) {
        setUsernameError(formatError)
        setIsCheckingAvailability(false)
        return
      }
      
      setIsCheckingAvailability(true)
      const { available, error } = await checkUsernameAvailability(debouncedUsername, profile.id)
      
      if (error) {
        console.error('Error checking username:', error)
        setUsernameError(t('common.error'))
      } else if (!available) {
        setUsernameError(t('settings.profileSettings.usernameExists'))
      } else {
        setUsernameError('')
      }
      
      setIsCheckingAvailability(false)
    }
    
    checkUsername()
  }, [debouncedUsername, profile, originalUsername, t])
  
  const handleUsernameChange = (value: string) => {
    // Only allow valid characters and enforce max length
    if (value.length <= MAX_USERNAME_LENGTH) {
      setUsername(value)
    }
  }
  
  const handleSave = async () => {
    if (!profile || usernameError || username === originalUsername) return
    
    const { data, error } = await updateProfile(
      { username },
      { optimistic: true }
    )
    
    if (error) {
      console.error('Error updating profile:', error)
      toast.error(t('settings.profileSettings.updateError'))
    } else if (data) {
      setOriginalUsername(username)
      toast.success(t('settings.profileSettings.updateSuccess'))
      router.push(`/${currentLocale}/me`)
    }
  }
  
  const handleBack = () => {
    router.push(`/${currentLocale}/me`)
  }
  
  const isValid = username.length >= MIN_USERNAME_LENGTH && !usernameError && username !== originalUsername
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[480px] mx-auto">
          <div className="flex items-center gap-3 p-4 bg-content1 border-b">
            <Skeleton className="w-10 h-10 rounded-medium" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4">
            <Card className="bg-content1">
              <CardBody className="p-4">
                <Skeleton className="h-14 w-full rounded-medium" />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[480px] mx-auto">
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
          </div>
          <div className="p-4">
            <Alert color="danger" description={error.message} />
          </div>
        </div>
      </div>
    )
  }
  
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
            isLoading={isUpdating}
            isDisabled={!isValid || isCheckingAvailability}
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
                onValueChange={handleUsernameChange}
                isInvalid={!!usernameError}
                errorMessage={usernameError}
                isDisabled={isUpdating}
                maxLength={MAX_USERNAME_LENGTH}
                startContent={
                  <span className="material-symbols-rounded text-default-400">
                    person
                  </span>
                }
                endContent={
                  <div className="flex items-center gap-2">
                    {isCheckingAvailability && (
                      <Spinner size="sm" />
                    )}
                    <span className="text-xs text-default-400">
                      {username.length}/{MAX_USERNAME_LENGTH}
                    </span>
                  </div>
                }
                classNames={{
                  inputWrapper: "h-14"
                }}
              />
              <p className="text-xs text-default-500 mt-2">
                {t('settings.profileSettings.usernameHint', { min: MIN_USERNAME_LENGTH, max: MAX_USERNAME_LENGTH })}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}