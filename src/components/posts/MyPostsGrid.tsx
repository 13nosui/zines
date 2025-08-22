'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { PostWithProfile } from '@/types'
import { Spinner } from '@heroui/react'

interface MyPostsGridProps {
  userId: string
  onEmptyState?: () => void
}

export function MyPostsGrid({ userId, onEmptyState }: MyPostsGridProps) {
  const [posts, setPosts] = useState<PostWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver>()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]

  // Load initial posts
  useEffect(() => {
    loadPosts(true)
  }, [userId])

  // Refresh posts when component mounts or pathname changes
  useEffect(() => {
    const handleFocus = () => {
      // Refresh posts when window regains focus
      loadPosts(true)
    }
    
    // Also refresh on visibility change (for tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPosts(true)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId])

  const loadPosts = async (initial = false) => {
    if (!initial && (!hasMore || loadingMore)) return
    
    setLoadingMore(!initial)
    try {
      const offset = initial ? 0 : posts.length
      const response = await fetch(`/api/posts/user/${userId}?offset=${offset}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load posts')
      
      const newPosts = await response.json()
      
      if (initial) {
        setPosts(newPosts)
        if (newPosts.length === 0 && onEmptyState) {
          onEmptyState()
        }
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }
      
      setHasMore(newPosts.length === 24) // Assuming 24 posts per page
    } catch (error) {
      console.error('Error loading posts:', error)
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const lastPostElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loadingMore) return
      if (observer.current) observer.current.disconnect()
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadPosts()
        }
      })
      
      if (node) observer.current.observe(node)
    },
    [loadingMore, hasMore]
  )

  const handlePostClick = (postId: string) => {
    router.push(`/${currentLocale}/post/${postId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {/* Empty state is handled by parent component through onEmptyState callback */}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-0">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            ref={index === posts.length - 1 ? lastPostElementRef : null}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            className="aspect-square-container cursor-pointer relative group max-[639px]:max-w-[240px] max-[639px]:mx-auto"
            onClick={() => handlePostClick(post.id)}
          >
            <div className="aspect-square-content">
              {post.image_urls && post.image_urls[0] ? (
                <Image
                  src={post.image_urls[0]}
                  alt={post.title || 'Post image'}
                  fill
                  sizes="(max-width: 640px) 33vw, 33vw"
                  className="object-cover"
                  priority={index < 12}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="material-symbols-rounded text-4xl text-gray-400 dark:text-gray-500">
                    image
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200" />
            </div>
          </motion.div>
        ))}
      </div>

      {loadingMore && (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      )}
    </div>
  )
}