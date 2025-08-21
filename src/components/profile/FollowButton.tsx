'use client'

import { useState, useEffect } from 'react'
import { Button } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FollowButtonProps {
  userId: string
  className?: string
}

export function FollowButton({ userId, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
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

  useEffect(() => {
    // Check if already following
    const checkFollowing = async () => {
      if (!currentUserId || currentUserId === userId) return

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single()

      setIsFollowing(!!data)
    }

    checkFollowing()
  }, [currentUserId, userId, supabase])

  const handleFollow = async () => {
    if (!currentUserId) {
      // Redirect to sign-in if not authenticated
      router.push('/auth/sign-in')
      return
    }

    setIsLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)

        setIsFollowing(false)
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId
          })

        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show the button if the user is viewing their own profile
  if (currentUserId === userId) {
    return null
  }

  return (
    <Button
      size="sm"
      color={isFollowing ? "default" : "primary"}
      variant={isFollowing ? "bordered" : "solid"}
      onPress={handleFollow}
      isLoading={isLoading}
      className={className}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}