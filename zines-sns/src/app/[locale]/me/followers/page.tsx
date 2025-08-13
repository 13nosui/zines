'use client'

import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { Spinner } from '@heroui/spinner'
import { Avatar } from '@heroui/avatar'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useInView } from 'react-intersection-observer'
import { toast } from 'sonner'

interface Follower {
  id: string
  created_at: string
  follower: {
    id: string
    username: string
    avatar_url: string
    bio?: string
  }
  isFollowing?: boolean
}

export default function FollowersPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { user } = useAuth()
  const [followers, setFollowers] = useState<Follower[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const { ref, inView } = useInView()
  const supabase = createClientComponentClient()
  
  const ITEMS_PER_PAGE = 20
  
  const fetchFollowers = useCallback(async (pageNum: number) => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        follower:follower_id (
          id,
          username,
          avatar_url,
          bio
        )
      `)
      .eq('following_id', user.id)
      .order('created_at', { ascending: false })
      .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1)
    
    if (error) {
      console.error('Error fetching followers:', error)
      toast.error(t('profile.errorLoadingFollowers'))
      return []
    }
    
    // Check if current user is following each follower
    if (data && data.length > 0) {
      const followerIds = data.map(f => f.follower.id)
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', followerIds)
      
      const followingSet = new Set(followingData?.map(f => f.following_id) || [])
      
      return data.map(follower => ({
        ...follower,
        isFollowing: followingSet.has(follower.follower.id)
      }))
    }
    
    return []
  }, [user, supabase, t])
  
  useEffect(() => {
    const loadInitialFollowers = async () => {
      setIsLoading(true)
      const data = await fetchFollowers(0)
      setFollowers(data)
      setHasMore(data.length === ITEMS_PER_PAGE)
      setIsLoading(false)
    }
    
    loadInitialFollowers()
  }, [fetchFollowers])
  
  useEffect(() => {
    const loadMoreFollowers = async () => {
      if (inView && hasMore && !isLoading) {
        const nextPage = page + 1
        const newFollowers = await fetchFollowers(nextPage)
        
        if (newFollowers.length > 0) {
          setFollowers(prev => [...prev, ...newFollowers])
          setPage(nextPage)
          setHasMore(newFollowers.length === ITEMS_PER_PAGE)
        } else {
          setHasMore(false)
        }
      }
    }
    
    loadMoreFollowers()
  }, [inView, hasMore, isLoading, page, fetchFollowers])
  
  const handleFollow = async (userId: string) => {
    if (!user) return
    
    setFollowingIds(prev => new Set([...prev, userId]))
    
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: userId
      })
    
    if (error) {
      console.error('Error following:', error)
      toast.error(t('profile.errorFollowing'))
      setFollowingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    } else {
      setFollowers(prev => 
        prev.map(f => 
          f.follower.id === userId 
            ? { ...f, isFollowing: true }
            : f
        )
      )
      toast.success(t('profile.followSuccess'))
    }
  }
  
  const handleUnfollow = async (userId: string) => {
    if (!user) return
    
    setFollowingIds(prev => new Set([...prev, userId]))
    
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId)
    
    if (error) {
      console.error('Error unfollowing:', error)
      toast.error(t('profile.errorUnfollowing'))
      setFollowingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    } else {
      setFollowers(prev => 
        prev.map(f => 
          f.follower.id === userId 
            ? { ...f, isFollowing: false }
            : f
        )
      )
      toast.success(t('profile.unfollowSuccess'))
    }
  }
  
  const handleBack = () => {
    router.push(`/${currentLocale}/me`)
  }
  
  const handleUserClick = (userId: string) => {
    router.push(`/${currentLocale}/users/${userId}`)
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-content1 border-b sticky top-0 z-10">
          <Button
            isIconOnly
            variant="light"
            onPress={handleBack}
            className="material-symbols-rounded"
          >
            arrow_back
          </Button>
          <h1 className="text-lg font-semibold">{t('profile.followers')}</h1>
        </div>
        
        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Spinner />
          </div>
        ) : followers.length === 0 ? (
          <div className="p-4">
            <Card className="bg-content1">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-rounded text-default-400 text-2xl">
                    groups
                  </span>
                </div>
                <p className="text-sm text-default-500">
                  {t('profile.noFollowersYet')}
                </p>
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {followers.map((follower) => (
              <div
                key={follower.id}
                className="p-4 hover:bg-content2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={follower.follower.avatar_url || undefined}
                    name={follower.follower.username}
                    className="w-12 h-12 cursor-pointer"
                    onClick={() => handleUserClick(follower.follower.id)}
                  />
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleUserClick(follower.follower.id)}
                  >
                    <p className="font-medium text-sm">
                      {follower.follower.username}
                    </p>
                    {follower.follower.bio && (
                      <p className="text-xs text-default-500 line-clamp-1">
                        {follower.follower.bio}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={follower.isFollowing ? "bordered" : "solid"}
                    color={follower.isFollowing ? "default" : "primary"}
                    onPress={() => 
                      follower.isFollowing 
                        ? handleUnfollow(follower.follower.id)
                        : handleFollow(follower.follower.id)
                    }
                    isLoading={followingIds.has(follower.follower.id)}
                    className="min-w-[80px]"
                  >
                    {follower.isFollowing ? t('profile.following') : t('profile.follow')}
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Load more indicator */}
            {hasMore && (
              <div ref={ref} className="p-4 flex justify-center">
                <Spinner size="sm" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}