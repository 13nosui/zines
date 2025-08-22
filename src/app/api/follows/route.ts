import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = "force-dynamic";

// GET: Check if current user is following a specific user
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const followingId = searchParams.get('followingId')
  
  if (!followingId) {
    return NextResponse.json(
      { error: 'followingId parameter is required' },
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
  
  // Check if following
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('[GET /api/follows] Database error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({
    isFollowing: !!data,
    followerId: user.id,
    followingId
  })
}

// POST: Toggle follow status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { followingId } = body
    
    if (!followingId) {
      return NextResponse.json(
        { error: 'followingId is required' },
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
    
    // Prevent self-following
    if (user.id === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }
    
    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()
    
    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
      
      if (error) {
        console.error('[POST /api/follows] Delete error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        isFollowing: false,
        message: 'Unfollowed successfully'
      })
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: followingId
        })
      
      if (error) {
        console.error('[POST /api/follows] Insert error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        isFollowing: true,
        message: 'Followed successfully'
      })
    }
  } catch (error) {
    console.error('[POST /api/follows] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}