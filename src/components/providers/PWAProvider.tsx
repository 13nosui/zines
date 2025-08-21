'use client'

import { useEffect } from 'react'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered successfully:', registration.scope)
            
            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 60000) // Check every minute
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error)
          })
      })
    }

    // Add install prompt handler for PWA
    let deferredPrompt: any
    
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      deferredPrompt = e
      console.log('PWA install prompt ready')
    })

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed successfully')
      deferredPrompt = null
    })
  }, [])

  return <>{children}</>
}