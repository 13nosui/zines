import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { PostDetailClient } from './PostDetailClient'

export default async function PostDetailPage({ params }: { params: { postId: string; locale: string } }) {
  const supabase = createServerClient()
  
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq('id', params.postId)
    .single()

  if (error || !post) {
    notFound()
  }

  // Get likes count for the post
  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', params.postId)

  const postWithLikes = {
    ...post,
    likes: { count: likesCount || 0 }
  }

  return <PostDetailClient post={postWithLikes} locale={params.locale} />
}