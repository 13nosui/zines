'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { PostWithProfile } from '@/types'
import { Spinner } from '@heroui/react'

interface PostGridProps {
  initialPosts: PostWithProfile[]
  loadMore?: () => Promise<PostWithProfile[]>
  hasMore?: boolean
  enableLoadMore?: boolean
}

export function PostGrid({ initialPosts, loadMore, hasMore = false, enableLoadMore = false }: PostGridProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState(false)
  const [canLoadMore, setCanLoadMore] = useState(hasMore && enableLoadMore)
  const observer = useRef<IntersectionObserver>()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]
  const loadMoreRef = useRef<() => Promise<PostWithProfile[]>>()

  // Update posts when initialPosts change (e.g., after router.refresh())
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])
  
  // Update loadMore ref when it changes
  useEffect(() => {
    if (!enableLoadMore || !loadMore) return
    
    loadMoreRef.current = loadMore || (async () => {
      const response = await fetch(`/api/posts?offset=${posts.length}`)
      if (!response.ok) throw new Error('Failed to load posts')
      return response.json()
    })
  }, [enableLoadMore, loadMore, posts.length])

  const lastPostElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && canLoadMore && loadMore) {
          handleLoadMore()
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, canLoadMore]
  )

  const handleLoadMore = async () => {
    if (!loadMoreRef.current || loading || !canLoadMore) return
    
    setLoading(true)
    try {
      const newPosts = await loadMoreRef.current()
      setPosts((prev) => [...prev, ...newPosts])
      setCanLoadMore(newPosts.length > 0)
    } catch (error) {
      console.error('Error loading more posts:', error)
      setCanLoadMore(false)
    } finally {
      setLoading(false)
    }
  }

  const handlePostClick = (postId: string) => {
    router.push(`/${currentLocale}/post/${postId}`)
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

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <span className="material-symbols-rounded text-6xl mb-4">
            photo_library
          </span>
          <p className="text-lg">No posts yet</p>
        </div>
      )}
    </div>
  )
}