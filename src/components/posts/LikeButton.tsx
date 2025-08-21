'use client'

import { useState, useEffect } from 'react'
import { Button } from '@heroui/react'
import { Icon } from '@/components/ui/Icon'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()

  useEffect(() => {
    // Check if the current user has liked this post
    checkUserLike()
  }, [postId])

  const checkUserLike = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        return
      }
      
              if (!user) {
          return
        }

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking user like:', error)
      }

      setLiked(!!data)
    } catch (error) {
      console.error('Error in checkUserLike:', error)
    }
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

        if (error) {
          console.error('Error unliking post:', error)
          showNotification('Failed to unlike post: ' + error.message)
        } else {
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

        if (error) {
          console.error('Error liking post:', error)
          showNotification('Failed to like post: ' + error.message)
        } else {
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
    // Notification removed per user request
    console.log('Notification:', message)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        isIconOnly
        variant={liked ? "flat" : "light"}
        color={liked ? "danger" : "default"}
        size="sm"
        onPress={handleLike}
        isLoading={loading}
        className="min-w-unit-10 relative z-10 cursor-pointer"
        isDisabled={loading}
        aria-label={liked ? "Unlike post" : "Like post"}
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