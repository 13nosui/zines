import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Supported locales
export const locales = ['en', 'ja', 'es', 'fr', 'de', 'zh', 'ko'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'en'

// Get the locale from system settings or user preference
export function getSystemLocale(): Locale {
  if (typeof window !== 'undefined') {
    const systemLang = navigator.language.split('-')[0]
    return locales.includes(systemLang as Locale) ? (systemLang as Locale) : defaultLocale
  }
  return defaultLocale
}

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validatedLocale = locale || defaultLocale
  if (!locales.includes(validatedLocale as any)) notFound()

  return {
    locale: validatedLocale,
    messages: (await import(`../messages/${validatedLocale}.json`)).default
  }
})