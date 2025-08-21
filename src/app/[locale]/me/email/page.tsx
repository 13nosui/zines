'use client'

import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Card, CardBody } from '@heroui/card'
import { Alert } from '@heroui/alert'
import { Skeleton } from '@heroui/skeleton'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { BackButton } from '@/components/navigation/BackButton'

export default function EmailEditPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { user, loading } = useAuth()
  const [newEmail, setNewEmail] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [emailError, setEmailError] = useState('')
  const supabase = createClientComponentClient()
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError(t('auth.validation.emailInvalid'))
      return false
    }
    
    if (email === user?.email) {
      setEmailError(t('profile.emailSameError'))
      return false
    }
    
    setEmailError('')
    return true
  }
  
  const handleEmailChange = (value: string) => {
    setNewEmail(value)
    if (value) {
      validateEmail(value)
    } else {
      setEmailError('')
    }
  }
  
  const handleUpdateEmail = async () => {
    if (!user || !newEmail || !validateEmail(newEmail)) return
    
    setIsUpdating(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })
      
      if (error) {
        console.error('Error updating email:', error)
        if (error.message.includes('already registered')) {
          toast.error(t('profile.emailAlreadyExists'))
        } else {
          toast.error(error.message)
        }
      } else {
        toast.success(t('profile.emailUpdateSuccess'))
        router.push(`/${currentLocale}/me`)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error(t('common.error'))
    }
    
    setIsUpdating(false)
  }
  
  const handleBack = () => {
    router.push(`/${currentLocale}/me`)
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[480px] mx-auto">
          <div className="flex items-center gap-3 p-4 bg-content1 border-b">
            <Skeleton className="w-10 h-10 rounded-medium" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4 space-y-4">
            <Card className="bg-content1">
              <CardBody className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-48" />
              </CardBody>
            </Card>
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
  
  const isValid = newEmail && !emailError && newEmail !== user?.email
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-content1 border-b">
          <BackButton variant="header" />
          <h1 className="text-lg font-semibold flex-1">{t('auth.email')}</h1>
          <Button
            color="primary"
            onPress={handleUpdateEmail}
            isLoading={isUpdating}
            isDisabled={!isValid}
          >
            {t('common.save')}
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          <Card className="bg-content1">
            <CardBody className="p-4">
              <p className="text-sm text-default-500 mb-2">{t('profile.currentEmail')}</p>
              <p className="text-base font-medium">{user?.email}</p>
            </CardBody>
          </Card>
          
          <Card className="bg-content1">
            <CardBody className="p-4">
              <Input
                label={t('profile.newEmail')}
                placeholder={t('auth.emailPlaceholder')}
                value={newEmail}
                onValueChange={handleEmailChange}
                isInvalid={!!emailError}
                errorMessage={emailError}
                isDisabled={isUpdating}
                type="email"
                startContent={
                  <span className="material-symbols-rounded text-default-400">
                    mail
                  </span>
                }
                classNames={{
                  inputWrapper: "h-14"
                }}
              />
              <p className="text-xs text-default-500 mt-2">
                {t('profile.emailChangeHint')}
              </p>
            </CardBody>
          </Card>
          
          {/* Email update info */}
          <Alert 
            color="warning" 
            description={t('profile.emailVerificationInfo')}
            startContent={
              <span className="material-symbols-rounded text-warning">
                info
              </span>
            }
          />
        </div>
      </div>
    </div>
  )
}