'use client'

import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { toast } from 'sonner'

export default function LogOutConfirmationPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const handleLogOut = async () => {
    setIsLoggingOut(true)
    
    try {
      await signOut()
      // The AuthProvider will handle the redirect
      router.push(`/${currentLocale}/auth/sign-in`)
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error(t('auth.errors.unexpected'))
      setIsLoggingOut(false)
    }
  }
  
  const handleCancel = () => {
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
            onPress={handleCancel}
            className="material-symbols-rounded"
          >
            arrow_back
          </Button>
          <h1 className="text-lg font-semibold">{t('auth.logout')}</h1>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <Card className="bg-content1">
            <CardBody className="p-6 text-center">
              <div className="w-16 h-16 bg-danger-50 dark:bg-danger-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-danger text-2xl">
                  logout
                </span>
              </div>
              
              <h2 className="text-lg font-semibold mb-2">
                {t('profile.logoutConfirmTitle')}
              </h2>
              
              <p className="text-sm text-default-500 mb-6">
                {t('profile.logoutConfirmDescription')}
              </p>
              
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="flat"
                  onPress={handleCancel}
                  isDisabled={isLoggingOut}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1"
                  color="danger"
                  onPress={handleLogOut}
                  isLoading={isLoggingOut}
                >
                  {t('auth.logout')}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}