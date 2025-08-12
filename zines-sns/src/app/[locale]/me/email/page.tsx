'use client'

import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Card, CardBody } from '@heroui/card'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

export default function EmailEditPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { user } = useAuth()
  const [newEmail, setNewEmail] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClientComponentClient()
  
  const handleUpdateEmail = async () => {
    if (!user || !newEmail) return
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast.error(t('auth.validation.emailInvalid'))
      return
    }
    
    if (newEmail === user.email) {
      toast.error(t('profile.emailSameError'))
      return
    }
    
    setIsUpdating(true)
    
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    })
    
    if (error) {
      console.error('Error updating email:', error)
      toast.error(error.message)
    } else {
      toast.success(t('profile.emailUpdateSuccess'))
      router.push(`/${currentLocale}/me`)
    }
    
    setIsUpdating(false)
  }
  
  const handleBack = () => {
    router.push(`/${currentLocale}/me`)
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
          <h1 className="text-lg font-semibold flex-1">{t('auth.email')}</h1>
          <Button
            color="primary"
            onPress={handleUpdateEmail}
            isLoading={isUpdating}
            isDisabled={!newEmail || newEmail === user?.email}
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
                onValueChange={setNewEmail}
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
        </div>
      </div>
    </div>
  )
}