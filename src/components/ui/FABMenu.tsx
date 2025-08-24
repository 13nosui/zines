'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface FABMenuProps {
  hasNoPosts?: boolean
}

export function FABMenu({ hasNoPosts = false }: FABMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const t = useTranslations()

  const toggleMenu = () => setIsOpen(!isOpen)

  const handleNavigation = (path: string) => {
    router.push(`/${currentLocale}${path}`)
    setIsOpen(false)
  }

  // If no posts, show only the post button
  if (hasNoPosts) {
    return (
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleNavigation('/create')}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <span className="material-symbols-rounded">add</span>
        <span className="absolute -top-8 whitespace-nowrap bg-content1 text-foreground px-3 py-1 rounded-full text-sm">
          Post Zine
        </span>
      </motion.button>
    )
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
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMenu}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        <span className="material-symbols-rounded">
          {isOpen ? 'close' : 'menu'}
        </span>
      </motion.button>

      {/* Expanded Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Settings */}
            <motion.button
              className="fixed bottom-6 right-6 w-14 h-14 bg-content2 text-foreground rounded-full flex items-center justify-center z-50"
              initial={{ scale: 0, y: 0 }}
              animate={{ scale: 1, y: -200 }}
              exit={{ scale: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNavigation('/settings')}
            >
              <span className="material-symbols-rounded">settings</span>
            </motion.button>

            {/* Home */}
            <motion.button
              className="fixed bottom-6 right-6 w-14 h-14 bg-content2 text-foreground rounded-full flex items-center justify-center z-50"
              initial={{ scale: 0, y: 0 }}
              animate={{ scale: 1, y: -140 }}
              exit={{ scale: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNavigation('/')}
            >
              <span className="material-symbols-rounded">home</span>
            </motion.button>

            {/* Post */}
            <motion.button
              className="fixed bottom-6 right-6 w-14 h-14 bg-content2 text-foreground rounded-full flex items-center justify-center z-50"
              initial={{ scale: 0, y: 0 }}
              animate={{ scale: 1, y: -80 }}
              exit={{ scale: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNavigation('/create')}
            >
              <span className="material-symbols-rounded">add</span>
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </>
  )
}