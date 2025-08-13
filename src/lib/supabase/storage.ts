import { createClient } from '@/lib/supabase/client'

const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: Error | null }> {
  try {
    const supabase = createClient()
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { url: null, error: new Error('File size must be less than 5MB') }
    }
    
    // Validate file type
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    
    if (!fileExt || !allowedTypes.includes(fileExt.toLowerCase())) {
      return { url: null, error: new Error('File type must be an image') }
    }
    
    // Delete existing avatar if any
    const { data: existingFiles } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(userId)
    
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(file => `${userId}/${file.name}`)
      await supabase.storage
        .from(AVATAR_BUCKET)
        .remove(filesToDelete)
    }
    
    // Upload new avatar
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) {
      return { url: null, error }
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(data.path)
    
    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: null, error: error as Error }
  }
}

export async function deleteAvatar(userId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createClient()
    
    // List all files in user's folder
    const { data: files, error: listError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(userId)
    
    if (listError) {
      return { success: false, error: listError }
    }
    
    if (!files || files.length === 0) {
      return { success: true, error: null }
    }
    
    // Delete all files
    const filesToDelete = files.map(file => `${userId}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove(filesToDelete)
    
    if (deleteError) {
      return { success: false, error: deleteError }
    }
    
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

export function getAvatarUrl(path: string | null): string | null {
  if (!path) return null
  
  // If it's already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // Otherwise, construct the public URL
  const supabase = createClient()
  const { data: { publicUrl } } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path)
  
  return publicUrl
}