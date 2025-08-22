import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PostWithProfile } from '@/types'
import { UserProfileClient } from './UserProfileClient'

interface UserProfilePageProps {
  params: Promise<{
    locale: string
    userId: string
  }>
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { userId } = await params
  const supabase = createServerClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single()
  
  return {
    title: profile?.username ? `@${profile.username}` : 'User Profile',
  }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { locale, userId } = await params
  const supabase = createServerClient()
  
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (profileError || !profile) {
    notFound()
  }
  
  // Get user's posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(24)
  
  if (postsError) {
    console.error('Error fetching user posts:', postsError)
  }
  
  // Get current user to check if viewing own profile
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === userId
  
  // Get follow statistics
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
  
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)
  
  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  // Check if current user is following this user
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
  
  // Get likes for posts
  const postsWithLikes = await Promise.all(
    (posts || []).map(async (post: any) => {
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
  
  return (
    <UserProfileClient
      profile={profile}
      posts={postsWithLikes as PostWithProfile[]}
      locale={locale}
      isOwnProfile={isOwnProfile}
      followersCount={followersCount || 0}
      followingCount={followingCount || 0}
      postsCount={postsCount || 0}
      isFollowing={isFollowing}
    />
  )
}