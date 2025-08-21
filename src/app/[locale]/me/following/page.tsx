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

interface Following {
  id: string
  created_at: string
  following: {
    id: string
    username: string
    avatar_url: string
    bio?: string
  }
}

export default function FollowingPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { user } = useAuth()
  const [following, setFollowing] = useState<Following[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [unfollowingIds, setUnfollowingIds] = useState<Set<string>>(new Set())
  const { ref, inView } = useInView()
  const supabase = createClientComponentClient()
  
  const ITEMS_PER_PAGE = 20
  
  const fetchFollowing = useCallback(async (pageNum: number) => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        following:following_id (
          id,
          username,
          avatar_url,
          bio
        )
      `)
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })
      .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1)
    
    if (error) {
      console.error('Error fetching following:', error)
      toast.error(t('profile.errorLoadingFollowing'))
      return []
    }
    
    return (data || []) as any[]
  }, [user, supabase, t])
  
  useEffect(() => {
    const loadInitialFollowing = async () => {
      setIsLoading(true)
      const data = await fetchFollowing(0)
      setFollowing(data || [])
      setHasMore((data || []).length === ITEMS_PER_PAGE)
      setIsLoading(false)
    }
    
    loadInitialFollowing()
  }, [fetchFollowing])
  
  useEffect(() => {
    const loadMoreFollowing = async () => {
      if (inView && hasMore && !isLoading) {
        const nextPage = page + 1
        const newFollowing = await fetchFollowing(nextPage)
        
        if (newFollowing && newFollowing.length > 0) {
          setFollowing(prev => [...prev, ...newFollowing])
          setPage(nextPage)
          setHasMore(newFollowing.length === ITEMS_PER_PAGE)
        } else {
          setHasMore(false)
        }
      }
    }
    
    loadMoreFollowing()
  }, [inView, hasMore, isLoading, page, fetchFollowing])
  
  const handleUnfollow = async (followId: string, userId: string) => {
    if (!user) return
    
    setUnfollowingIds(prev => new Set([...prev, userId]))
    
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('id', followId)
    
    if (error) {
      console.error('Error unfollowing:', error)
      toast.error(t('profile.errorUnfollowing'))
      setUnfollowingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    } else {
      setFollowing(prev => prev.filter(f => f.id !== followId))
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
        </div>
        
        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Spinner />
          </div>
        ) : following.length === 0 ? (
          <div className="p-4">
            <Card className="bg-content1">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-rounded text-default-400 text-2xl">
                    group
                  </span>
                </div>
                <p className="text-sm text-default-500">
                  {t('profile.notFollowingAnyone')}
                </p>
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {following.map((follow) => (
              <div
                key={follow.id}
                className="p-4 hover:bg-content2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={follow.following.avatar_url || undefined}
                    name={follow.following.username}
                    className="w-12 h-12 cursor-pointer"
                    onClick={() => handleUserClick(follow.following.id)}
                  />
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleUserClick(follow.following.id)}
                  >
                    <p className="font-medium text-sm">
                      {follow.following.username}
                    </p>
                    {follow.following.bio && (
                      <p className="text-xs text-default-500 line-clamp-1">
                        {follow.following.bio}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="bordered"
                    onPress={() => handleUnfollow(follow.id, follow.following.id)}
                    isLoading={unfollowingIds.has(follow.following.id)}
                    className="min-w-[80px]"
                  >
                    {t('profile.unfollow')}
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