'use client'

import { useState } from 'react'
import { Button } from '@heroui/react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface FABItem {
  icon: string
  label: string
  path?: string
  onClick?: () => void
}

interface FABNavigationProps {
  items: FABItem[]
}

export function FABNavigation({ items }: FABNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  // Get current locale from pathname
  const currentLocale = pathname.split('/')[1]

  const handleItemClick = (item: FABItem) => {
    if (item.onClick) {
      item.onClick()
    } else if (item.path) {
      // Prepend locale to path if not already present
      const localizedPath = item.path.startsWith('/') 
        ? `/${currentLocale}${item.path}`
        : `/${currentLocale}/${item.path}`
      router.push(localizedPath)
    }
    setIsOpen(false)
  }

  return (
    <>
      {/* Blur Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 backdrop-blur-md bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3"
            >
              {items.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    isIconOnly
                    color="primary"
                    variant="shadow"
                    size="lg"
                    className="w-14 h-14 rounded-full"
                    onClick={() => handleItemClick(item)}
                    title={item.label}
                  >
                    <span className="material-symbols-rounded text-2xl">
                      {item.icon}
                    </span>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          isIconOnly
          color="primary"
          variant="shadow"
          size="lg"
          className="w-14 h-14 rounded-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="material-symbols-rounded text-2xl"
          >
            {isOpen ? 'close' : 'menu'}
          </motion.span>
        </Button>
      </div>
    </>
  )
}