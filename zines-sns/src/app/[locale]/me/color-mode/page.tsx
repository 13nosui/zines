'use client'

import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { RadioGroup, Radio } from '@heroui/radio'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ColorModeSelectionPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleBack = () => {
    router.push(`/${currentLocale}/me`)
  }
  
  if (!mounted) {
    return null
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
          <h1 className="text-lg font-semibold">{t('profile.colorMode')}</h1>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <Card className="bg-content1">
            <CardBody className="p-4">
              <RadioGroup
                value={theme || 'system'}
                onValueChange={setTheme}
              >
                <Radio 
                  value="system" 
                  className="py-3"
                  classNames={{
                    base: "max-w-full m-0",
                    labelWrapper: "w-full"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-default-500">
                      devices
                    </span>
                    <div>
                      <p className="text-sm font-medium">{t('settings.themes.system')}</p>
                      <p className="text-xs text-default-500">{t('profile.colorModeSystemDescription')}</p>
                    </div>
                  </div>
                </Radio>
                
                <Radio 
                  value="light"
                  className="py-3"
                  classNames={{
                    base: "max-w-full m-0",
                    labelWrapper: "w-full"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-default-500">
                      light_mode
                    </span>
                    <div>
                      <p className="text-sm font-medium">{t('settings.themes.light')}</p>
                      <p className="text-xs text-default-500">{t('profile.colorModeLightDescription')}</p>
                    </div>
                  </div>
                </Radio>
                
                <Radio 
                  value="dark"
                  className="py-3"
                  classNames={{
                    base: "max-w-full m-0",
                    labelWrapper: "w-full"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-default-500">
                      dark_mode
                    </span>
                    <div>
                      <p className="text-sm font-medium">{t('settings.themes.dark')}</p>
                      <p className="text-xs text-default-500">{t('profile.colorModeDarkDescription')}</p>
                    </div>
                  </div>
                </Radio>
              </RadioGroup>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}