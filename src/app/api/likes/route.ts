import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = "force-dynamic";

// GET: Check if current user has liked a specific post
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const postId = searchParams.get('postId')
  
  if (!postId) {
    return NextResponse.json(
      { error: 'postId parameter is required' },
      { status: 400 }
    )
  }
  
  const supabase = createServerClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({
      isLiked: false,
      postId,
      likesCount: 0
    })
  }
  
  // Check if liked
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('[GET /api/likes] Database error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  // Get total likes count
  const { count, error: countError } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
  
  if (countError) {
    console.error('[GET /api/likes] Count error:', countError)
    return NextResponse.json(
      { error: countError.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({
    isLiked: !!data,
    userId: user.id,
    postId,
    likesCount: count || 0
  })
}

// POST: Toggle like status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId } = body
    
    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single()
    
    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)
      
      if (error) {
        console.error('[POST /api/likes] Delete error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
      
      // Get updated count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
      
      return NextResponse.json({
        isLiked: false,
        likesCount: count || 0,
        message: 'Unliked successfully'
      })
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          post_id: postId
        })
      
      if (error) {
        console.error('[POST /api/likes] Insert error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
      
      // Get updated count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
      
      return NextResponse.json({
        isLiked: true,
        likesCount: count || 0,
        message: 'Liked successfully'
      })
    }
  } catch (error) {
    console.error('[POST /api/likes] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}