'use client'

import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function PrivacyPolicyPage() {
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
        <div className="flex items-center gap-3 p-4 bg-content1 border-b sticky top-0 z-10">
          <Button
            isIconOnly
            variant="light"
            onPress={handleBack}
            className="material-symbols-rounded"
          >
            arrow_back
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <Card className="bg-content1">
            <CardBody className="p-6 space-y-4">
              <div>
                <p className="text-sm text-default-600">
                  {t('legal.privacyIntro')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">{t('legal.dataCollection')}</h3>
                <p className="text-sm text-default-600">
                  {t('legal.dataCollectionText')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">{t('legal.dataUsage')}</h3>
                <p className="text-sm text-default-600">
                  {t('legal.dataUsageText')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">{t('legal.dataProtection')}</h3>
                <p className="text-sm text-default-600">
                  {t('legal.dataProtectionText')}
                </p>
              </div>
              
              <div className="pt-4 text-xs text-default-500">
                <p>{t('legal.lastUpdated')}: {new Date().toLocaleDateString()}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}