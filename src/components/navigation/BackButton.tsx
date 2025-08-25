'use client'

import { Button } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface BackButtonProps {
  onPress?: () => void
  variant?: 'fab' | 'header'
  className?: string
}

export function BackButton({ onPress, variant = 'fab', className = '' }: BackButtonProps) {
  const router = useRouter()
  
  const handleBack = () => {
    if (onPress) {
      onPress()
    } else {
      router.back()
    }
  }

  if (variant === 'fab') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          isIconOnly
          color="default"
          variant="shadow"
          className={`rounded-full w-14 h-14 ${className}`}
          onPress={handleBack}
          aria-label="Go back"
        >
          <span className="material-symbols-rounded text-2xl">
            chevron_backward
          </span>
        </Button>
      </motion.div>
    )
  }

  // Header variant for sticky headers
  return (
    <Button
      isIconOnly
      variant="light"
      onPress={handleBack}
      className={`rounded-full min-w-unit-12 h-unit-12 ${className}`}
      aria-label="Go back"
    >
      <span className="material-symbols-rounded">
        arrow_back
      </span>
    </Button>
  )
}