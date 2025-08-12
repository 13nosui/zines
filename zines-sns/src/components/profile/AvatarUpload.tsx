'use client'

import { useState, useRef } from 'react'
import { Avatar } from '@heroui/avatar'
import { Button } from '@heroui/button'
import { Spinner } from '@heroui/spinner'
import { useTranslations } from 'next-intl'
import { getAvatarUrl } from '@/lib/supabase/storage'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  username?: string
  onUpload: (file: File) => Promise<void>
  onRemove?: () => Promise<void>
  isUploading?: boolean
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  username = 'User',
  onUpload, 
  onRemove,
  isUploading = false 
}: AvatarUploadProps) {
  const t = useTranslations()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const avatarUrl = previewUrl || getAvatarUrl(currentAvatarUrl)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    // Upload file
    await onUpload(file)
    setPreviewUrl(null)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    // Upload file
    await onUpload(file)
    setPreviewUrl(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleRemove = async () => {
    if (onRemove) {
      await onRemove()
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`relative rounded-full transition-colors ${
          isDragging ? 'ring-4 ring-primary ring-offset-2' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Avatar
          src={avatarUrl || undefined}
          name={username}
          className="w-24 h-24 text-large"
          isBordered
        />
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Spinner size="sm" color="white" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        <Button
          size="sm"
          variant="flat"
          onPress={() => fileInputRef.current?.click()}
          isDisabled={isUploading}
          startContent={
            <span className="material-symbols-rounded text-small">
              upload
            </span>
          }
        >
          {t('settings.profileSettings.changeAvatar')}
        </Button>
        
        {avatarUrl && onRemove && (
          <Button
            size="sm"
            variant="flat"
            color="danger"
            onPress={handleRemove}
            isDisabled={isUploading}
            startContent={
              <span className="material-symbols-rounded text-small">
                delete
              </span>
            }
          >
            {t('settings.profileSettings.removeAvatar')}
          </Button>
        )}
      </div>
    </div>
  )
}