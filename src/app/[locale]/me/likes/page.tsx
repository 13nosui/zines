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
import { formatDistanceToNow } from 'date-fns'
import { enUS, ja, zhCN } from 'date-fns/locale'
import { useInView } from 'react-intersection-observer'
import { toast } from 'sonner'

interface LikedPost {
  id: string
  created_at: string
  post: {
    id: string
    content: string
    created_at: string
    author: {
      id: string
      username: string
      avatar_url: string
    }
  }
}

export default function LikesPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const { user } = useAuth()
  const [likes, setLikes] = useState<LikedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const { ref, inView } = useInView()
  const supabase = createClientComponentClient()
  
  const ITEMS_PER_PAGE = 20
  
  // Date locale mapping
  const dateLocales = {
    en: enUS,
    ja: ja,
    'zh-CN': zhCN
  }
  
  const fetchLikes = useCallback(async (pageNum: number) => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('likes')
      .select(`
        id,
        created_at,
        post:posts (
          id,
          content,
          created_at,
          author:profiles (
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1)
    
    if (error) {
      console.error('Error fetching likes:', error)
      toast.error(t('profile.errorLoadingLikes'))
      return []
    }
    
    return (data || []) as any[]
  }, [user, supabase, t])
  
  useEffect(() => {
    const loadInitialLikes = async () => {
      setIsLoading(true)
      const data = await fetchLikes(0)
      setLikes(data || [])
      setHasMore((data || []).length === ITEMS_PER_PAGE)
      setIsLoading(false)
    }
    
    loadInitialLikes()
  }, [fetchLikes])
  
  useEffect(() => {
    const loadMoreLikes = async () => {
      if (inView && hasMore && !isLoading) {
        const nextPage = page + 1
        const newLikes = await fetchLikes(nextPage)
        
        if (newLikes && newLikes.length > 0) {
          setLikes(prev => [...prev, ...newLikes])
          setPage(nextPage)
          setHasMore(newLikes.length === ITEMS_PER_PAGE)
        } else {
          setHasMore(false)
        }
      }
    }
    
    loadMoreLikes()
  }, [inView, hasMore, isLoading, page, fetchLikes])
  
  const handleBack = () => {
    router.push(`/${currentLocale}/me`)
  }
  
  const handlePostClick = (postId: string) => {
    router.push(`/${currentLocale}/posts/${postId}`)
  }
  
  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: dateLocales[currentLocale as keyof typeof dateLocales] || enUS
    })
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
          <h1 className="text-lg font-semibold">{t('profile.likes')}</h1>
        </div>
        
        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Spinner />
          </div>
        ) : likes.length === 0 ? (
          <div className="p-4">
            <Card className="bg-content1">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-rounded text-default-400 text-2xl">
                    favorite
                  </span>
                </div>
                <p className="text-sm text-default-500">
                  {t('profile.noLikesYet')}
                </p>
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {likes.map((like) => (
              <div
                key={like.id}
                className="p-4 hover:bg-content2 cursor-pointer transition-colors"
                onClick={() => handlePostClick(like.post.id)}
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    src={like.post.author.avatar_url || undefined}
                    name={like.post.author.username}
                    className="w-10 h-10 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {like.post.author.username}
                      </span>
                      <span className="text-xs text-default-400">
                        • {formatDate(like.post.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-default-700 line-clamp-3">
                      {like.post.content}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="material-symbols-rounded text-danger text-sm filled">
                        favorite
                      </span>
                      <span className="text-xs text-default-500">
                        {t('profile.likedOn', { date: formatDate(like.created_at) })}
                      </span>
                    </div>
                  </div>
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