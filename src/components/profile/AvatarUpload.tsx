'use client'

import { useState, useRef } from 'react'
import { Avatar } from '@heroui/avatar'
import { Button } from '@heroui/button'
import { Spinner } from '@heroui/spinner'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal'
import { useTranslations } from 'next-intl'
import { getAvatarUrl } from '@/lib/supabase/storage'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  username?: string
  onUpload: (file: File) => Promise<void>
  onRemove?: () => Promise<void>
  isUploading?: boolean
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
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
  const imgRef = useRef<HTMLImageElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isProcessing, setIsProcessing] = useState(false)

  const avatarUrl = getAvatarUrl(currentAvatarUrl)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
      setIsModalOpen(true)
    }
    reader.readAsDataURL(file)
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
      setIsModalOpen(true)
    }
    reader.readAsDataURL(file)
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

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }

  const getCroppedImg = async (): Promise<File | null> => {
    if (!completedCrop || !imgRef.current || !previewUrl) {
      return null
    }

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return null
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // Set canvas size to desired crop size
    canvas.width = completedCrop.width
    canvas.height = completedCrop.height

    // Draw the cropped image
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    )

    // Create circular mask
    ctx.globalCompositeOperation = 'destination-in'
    ctx.beginPath()
    ctx.arc(
      completedCrop.width / 2,
      completedCrop.height / 2,
      completedCrop.width / 2,
      0,
      2 * Math.PI
    )
    ctx.closePath()
    ctx.fill()

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null)
          return
        }
        const file = new File([blob], 'avatar.png', { type: 'image/png' })
        resolve(file)
      }, 'image/png')
    })
  }

  const handleCropComplete = async () => {
    setIsProcessing(true)
    const croppedFile = await getCroppedImg()
    
    if (croppedFile) {
      await onUpload(croppedFile)
      setIsModalOpen(false)
      setPreviewUrl(null)
      setCrop(undefined)
      setCompletedCrop(undefined)
    }
    
    setIsProcessing(false)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setPreviewUrl(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleModalClose}
        size="lg"
        isDismissable={!isProcessing}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {t('settings.profileSettings.cropAvatar')}
          </ModalHeader>
          <ModalBody>
            {previewUrl && (
              <div className="flex flex-col items-center gap-4">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                  className="max-h-[400px]"
                >
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="Avatar preview"
                    onLoad={onImageLoad}
                    className="max-h-[400px] max-w-full"
                  />
                </ReactCrop>
                <p className="text-sm text-default-500 text-center">
                  {t('settings.profileSettings.cropHint')}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="light" 
              onPress={handleModalClose}
              isDisabled={isProcessing}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              color="primary" 
              onPress={handleCropComplete}
              isLoading={isProcessing}
              isDisabled={!completedCrop}
            >
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}