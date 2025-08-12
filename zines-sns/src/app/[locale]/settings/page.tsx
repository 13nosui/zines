'use client'

import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Select, SelectItem } from '@heroui/select'
import { Button } from '@heroui/button'
import { useState, useEffect } from 'react'
import { locales } from '@/i18n'

export default function SettingsPage() {
  const t = useTranslations()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  // Get current locale from pathname
  const currentLocale = pathname.split('/')[1]

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLocaleChange = (locale: string) => {
    // Replace the locale in the current pathname
    const segments = pathname.split('/')
    segments[1] = locale
    const newPathname = segments.join('/')
    router.push(newPathname)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button
          isIconOnly
          variant="light"
          onPress={() => router.back()}
          className="material-symbols-rounded"
        >
          arrow_back
        </Button>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t('settings.theme')}</h2>
        </CardHeader>
        <CardBody>
          <Select
            label={t('settings.theme')}
            selectedKeys={[theme || 'system']}
            onSelectionChange={(keys) => setTheme(Array.from(keys)[0] as string)}
            className="max-w-full"
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
          <h2 className="text-lg font-semibold">{t('settings.language')}</h2>
        </CardHeader>
        <CardBody>
          <Select
            label={t('settings.language')}
            selectedKeys={[currentLocale]}
            onSelectionChange={(keys) => handleLocaleChange(Array.from(keys)[0] as string)}
            className="max-w-full"
          >
            {locales.map((locale) => (
              <SelectItem key={locale}>
                {t(`settings.languages.${locale}`)}
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>
    </div>
  )
}