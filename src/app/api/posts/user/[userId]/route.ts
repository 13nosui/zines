import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { PostWithProfile } from '@/types'

const POSTS_PER_PAGE = 24

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const searchParams = request.nextUrl.searchParams
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = parseInt(searchParams.get('limit') || POSTS_PER_PAGE.toString())
  
  // Await the params to get the userId
  const { userId } = await params
  
  console.log('[GET /api/posts/user/[userId]] Request received:', {
    url: request.url,
    userId,
    offset,
    limit,
    headers: Object.fromEntries(request.headers.entries())
  })
  
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.log('[GET /api/posts/user/[userId]] Database error:', {
      error: error.message,
      code: error.code,
      details: error.details,
      userId
    })
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  console.log('[GET /api/posts/user/[userId]] Posts fetched:', {
    userId,
    count: data?.length || 0,
    offset,
    limit
  })

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

  console.log('[GET /api/posts/user/[userId]] Response:', {
    targetUserId: userId,
    currentUserId: user?.id || 'anonymous',
    totalPosts: postsWithLikes.length,
    samplePost: postsWithLikes.length > 0 ? {
      id: postsWithLikes[0].id,
      title: postsWithLikes[0].title,
      hasProfile: !!postsWithLikes[0].profiles,
      likesCount: postsWithLikes[0].likes?.count
    } : null
  })

  return NextResponse.json(postsWithLikes as PostWithProfile[])
}