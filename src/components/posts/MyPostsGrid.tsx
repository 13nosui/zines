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

  const loadPosts = async (initial = false) => {
    if (!initial && (!hasMore || loadingMore)) return
    
    setLoadingMore(!initial)
    try {
      const offset = initial ? 0 : posts.length
      const response = await fetch(`/api/posts/user/${userId}?offset=${offset}`)
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
      <div className="posts-grid">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            ref={index === posts.length - 1 ? lastPostElementRef : null}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.01 }}
            className="relative cursor-pointer bg-gray-100 dark:bg-gray-800"
            onClick={() => handlePostClick(post.id)}
            style={{ aspectRatio: '1 / 1' }}
          >
            {post.images && post.images[0] && (
              <Image
                src={post.images[0]}
                alt={post.title || 'Post image'}
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
                priority={index < 12}
              />
            )}
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