import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = "force-dynamic";

// GET: Get follow statistics for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await the params to get the userId
    const { userId } = await params
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerClient()
    
    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
    
    if (followersError) {
      console.error('[GET /api/follows/stats] Followers count error:', followersError)
      return NextResponse.json(
        { error: followersError.message },
        { status: 500 }
      )
    }
    
    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)
    
    if (followingError) {
      console.error('[GET /api/follows/stats] Following count error:', followingError)
      return NextResponse.json(
        { error: followingError.message },
        { status: 500 }
      )
    }
    
    // Check if current user is following this user
    const { data: { user } } = await supabase.auth.getUser()
    let isFollowing = false
    
    if (user && user.id !== userId) {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single()
      
      isFollowing = !!data
    }
    
    return NextResponse.json({
      userId,
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      isFollowing
    })
  } catch (error) {
    console.error('[GET /api/follows/stats] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}