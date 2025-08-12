'use client'

import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function FollowersPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  
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
          <h1 className="text-lg font-semibold">{t('profile.followers')}</h1>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <Card className="bg-content1">
            <CardBody className="p-8 text-center">
              <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-default-400 text-2xl">
                  groups
                </span>
              </div>
              <p className="text-sm text-default-500">
                {t('profile.noFollowersYet')}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}