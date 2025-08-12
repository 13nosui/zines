'use client'

import { Avatar } from '@heroui/avatar'
import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { uploadAvatar, deleteAvatar, getAvatarUrl } from '@/lib/supabase/storage'
import { getProfile, updateProfile } from '@/lib/services/profile'
import { toast } from 'sonner'

export default function AvatarEditPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      
      setIsLoading(true)
      const { data, error } = await getProfile(user.id)
      
      if (error) {
        console.error('Error loading profile:', error)
        toast.error(t('settings.profileSettings.updateError'))
      } else if (data) {
        setProfile(data)
      }
      
      setIsLoading(false)
    }
    
    loadProfile()
  }, [user, t])
  
  const handleAvatarUpload = async (file: File) => {
    if (!user) return
    
    setIsUploadingAvatar(true)
    
    const { url, error } = await uploadAvatar(user.id, file)
    
    if (error) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message)
    } else if (url) {
      // Update profile with new avatar URL
      const { data, error: updateError } = await updateProfile(user.id, { avatar_url: url })
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
        toast.error(t('settings.profileSettings.updateError'))
      } else if (data) {
        setProfile(data)
        toast.success(t('settings.profileSettings.updateSuccess'))
      }
    }
    
    setIsUploadingAvatar(false)
  }
  
  const handleAvatarRemove = async () => {
    if (!user) return
    
    setIsUploadingAvatar(true)
    
    const { success, error } = await deleteAvatar(user.id)
    
    if (error) {
      console.error('Error removing avatar:', error)
      toast.error(error.message)
    } else if (success) {
      // Update profile to remove avatar URL
      const { data, error: updateError } = await updateProfile(user.id, { avatar_url: null })
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
        toast.error(t('settings.profileSettings.updateError'))
      } else if (data) {
        setProfile(data)
        toast.success(t('settings.profileSettings.updateSuccess'))
      }
    }
    
    setIsUploadingAvatar(false)
  }
  
  const handleBack = () => {
    router.push(`/${currentLocale}/me`)
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
        </div>
      </div>
    </div>
  )
}