'use client'

import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useRouter } from 'next/navigation'
import { PWAProvider } from './PWAProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <PWAProvider>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </NextThemesProvider>
      </HeroUIProvider>
    </PWAProvider>
  )
}