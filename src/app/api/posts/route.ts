import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { PostWithProfile } from '@/types'

const POSTS_PER_PAGE = 24

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = parseInt(searchParams.get('limit') || POSTS_PER_PAGE.toString())
  
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!user_id (
        id,
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // Get likes count and check if current user liked each post
  const { data: { user } } = await supabase.auth.getUser()
  
  const postsWithLikes = await Promise.all(
    (data || []).map(async (post: any) => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      let isLiked = false
      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .match({ post_id: post.id, user_id: user.id })
          .single()
        
        isLiked = !!likeData
      }

      return {
        ...post,
        likes: { count: count || 0 },
        isLiked
      }
    })
  )

  return NextResponse.json(postsWithLikes as PostWithProfile[])
}