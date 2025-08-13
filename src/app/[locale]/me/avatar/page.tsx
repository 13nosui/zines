'use client'

import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { Alert } from '@heroui/alert'
import { Skeleton } from '@heroui/skeleton'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { uploadAvatar, deleteAvatar } from '@/lib/supabase/storage'
import { toast } from 'sonner'

export default function AvatarEditPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { profile, loading, error, updateProfile } = useProfile()
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  const handleAvatarUpload = async (file: File) => {
    if (!profile) return
    
    setIsUploadingAvatar(true)
    
    try {
      // Upload to storage
      const { url, error: uploadError } = await uploadAvatar(profile.id, file)
      
      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        toast.error(uploadError.message)
        setIsUploadingAvatar(false)
        return
      }
      
      // Update profile with new avatar URL (with optimistic update)
      const { data, error: updateError } = await updateProfile(
        { avatar_url: url },
        { optimistic: true }
      )
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
        toast.error(t('settings.profileSettings.updateError'))
        // Delete the uploaded file if profile update failed
        if (url) {
          await deleteAvatar(profile.id)
        }
      } else if (data) {
        toast.success(t('settings.profileSettings.updateSuccess'))
      }
    } catch (error) {
      console.error('Error in avatar upload:', error)
      toast.error(t('common.error'))
    }
    
    setIsUploadingAvatar(false)
  }
  
  const handleAvatarRemove = async () => {
    if (!profile) return
    
    setIsUploadingAvatar(true)
    
    try {
      // Optimistically update UI
      const oldAvatarUrl = profile.avatar_url
      
      // Update profile to remove avatar URL (with optimistic update)
      const { data, error: updateError } = await updateProfile(
        { avatar_url: null },
        { optimistic: true }
      )
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
        toast.error(t('settings.profileSettings.updateError'))
        setIsUploadingAvatar(false)
        return
      }
      
      // Delete from storage after successful profile update
      const { success, error: deleteError } = await deleteAvatar(profile.id)
      
      if (deleteError) {
        console.error('Error removing avatar from storage:', deleteError)
        // Revert the profile update if storage deletion failed
        await updateProfile({ avatar_url: oldAvatarUrl })
        toast.error(deleteError.message)
      } else if (success && data) {
        toast.success(t('settings.profileSettings.updateSuccess'))
      }
    } catch (error) {
      console.error('Error in avatar removal:', error)
      toast.error(t('common.error'))
    }
    
    setIsUploadingAvatar(false)
  }
  
  const handleBack = () => {
    router.push(`/${currentLocale}/me`)
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[480px] mx-auto">
          <div className="flex items-center gap-3 p-4 bg-content1 border-b">
            <Skeleton className="w-10 h-10 rounded-medium" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4">
            <Card className="bg-content1">
              <CardBody className="flex flex-col items-center py-8">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-24 h-24 rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-32 rounded-medium" />
                    <Skeleton className="h-10 w-32 rounded-medium" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[480px] mx-auto">
          <div className="flex items-center gap-3 p-4 bg-content1 border-b">
            <Button
              isIconOnly
              variant="light"
              onPress={handleBack}
              className="material-symbols-rounded"
            >
              arrow_back
            </Button>
            <h1 className="text-lg font-semibold">{t('settings.profileSettings.avatar')}</h1>
          </div>
          <div className="p-4">
            <Alert color="danger" description={error.message} />
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-lg font-semibold">{t('settings.profileSettings.avatar')}</h1>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <Card className="bg-content1">
            <CardBody className="flex flex-col items-center py-8">
              <AvatarUpload
                currentAvatarUrl={profile?.avatar_url}
                username={profile?.username}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                isUploading={isUploadingAvatar}
              />
            </CardBody>
          </Card>
          
          {/* Avatar guidelines */}
          <div className="mt-4 text-sm text-default-500 space-y-1">
            <p>• {t('settings.profileSettings.avatarGuideline1')}</p>
            <p>• {t('settings.profileSettings.avatarGuideline2')}</p>
            <p>• {t('settings.profileSettings.avatarGuideline3')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}