'use client'

import { useState, useEffect } from 'react'
import { Button } from '@heroui/react'
import { Icon } from '@/components/ui/Icon'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LikeButtonProps {
  postId: string
  initialLiked?: boolean
  initialCount?: number
  className?: string
  showCount?: boolean
}

export function LikeButton({ 
  postId, 
  initialLiked = false, 
  initialCount = 0,
  className,
  showCount = true
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getUser()
  }, [supabase])

  const handleLike = async () => {
    if (!currentUserId) {
      // Redirect to sign-in if not authenticated
      router.push('/auth/sign-in')
      return
    }

    // Optimistic update
    const newIsLiked = !isLiked
    const newCount = newIsLiked ? likesCount + 1 : likesCount - 1
    setIsLiked(newIsLiked)
    setLikesCount(Math.max(0, newCount))
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setIsLiked(!newIsLiked)
        setLikesCount(likesCount)
        console.error('Error toggling like')
      } else {
        const data = await response.json()
        // Update with actual server data
        setLikesCount(data.likesCount)
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!newIsLiked)
      setLikesCount(likesCount)
      console.error('Error toggling like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        isIconOnly
        size="md"
        variant="light"
        onPress={handleLike}
        isLoading={isLoading}
        className="min-w-unit-12 h-unit-12"
        aria-label={isLiked ? 'Unlike' : 'Like'}
      >
        <Icon 
          name="favorite" 
          className={isLiked ? "text-danger" : "text-default-500"}
          filled={isLiked}
        />
      </Button>
      {showCount && (
        <span className="text-sm text-default-500">
          {likesCount}
        </span>
      )}
    </div>
  )
}