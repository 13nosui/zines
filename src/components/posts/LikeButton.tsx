'use client'

import { useState, useEffect } from 'react'
import { Button } from '@heroui/react'
import { Icon } from '@/components/ui/Icon'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

interface LikeButtonProps {
  postId: string
  initialLiked?: boolean
  initialLikeCount?: number
  onLikeToggle?: (liked: boolean) => void
}

export function LikeButton({ 
  postId, 
  initialLiked = false, 
  initialLikeCount = 0,
  onLikeToggle 
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    // Check if the current user has liked this post
    checkUserLike()
  }, [postId])

  const checkUserLike = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    setLiked(!!data)
  }

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login')
      return
    }

    setLoading(true)
    
    try {
      if (liked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (!error) {
          setLiked(false)
          setLikeCount(prev => Math.max(0, prev - 1))
          
          // Show notification
          showNotification('Post unliked')
          
          // Callback
          onLikeToggle?.(false)
        }
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        if (!error) {
          setLiked(true)
          setLikeCount(prev => prev + 1)
          
          // Show notification
          showNotification('Post liked!')
          
          // Callback
          onLikeToggle?.(true)
        }
      }
      
      // Refresh the page to update like counts
      router.refresh()
    } catch (error) {
      console.error('Error toggling like:', error)
      showNotification('Failed to update like')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message: string) => {
    // Create a toast notification
    const toast = document.createElement('div')
    toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-default-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in'
    toast.textContent = message
    document.body.appendChild(toast)

    // Remove after 2 seconds
    setTimeout(() => {
      toast.classList.add('animate-fade-out')
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        isIconOnly
        variant="light"
        size="sm"
        onPress={handleLike}
        isLoading={loading}
        className="min-w-unit-10"
      >
        <Icon 
          name={liked ? "favorite" : "favorite_border"} 
          className={liked ? "text-danger" : "text-default-500"}
        />
      </Button>
      <span className="text-sm text-default-600">{likeCount} likes</span>
    </div>
  )
}