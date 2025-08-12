'use client'

import { useState } from 'react'
import { PostWithProfile } from '@/types'
import { PostGrid } from './PostGrid'

interface PostGridClientProps {
  initialPosts: PostWithProfile[]
  hasMore: boolean
}

export function PostGridClient({ initialPosts, hasMore }: PostGridClientProps) {
  const [currentOffset, setCurrentOffset] = useState(initialPosts.length)

  const loadMore = async () => {
    const response = await fetch(`/api/posts?offset=${currentOffset}`)
    if (!response.ok) throw new Error('Failed to load posts')
    const newPosts = await response.json()
    setCurrentOffset(prev => prev + newPosts.length)
    return newPosts
  }

  return (
    <PostGrid
      initialPosts={initialPosts}
      loadMore={loadMore}
      hasMore={hasMore}
      enableLoadMore={true}
    />
  )
}