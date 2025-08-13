import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type Like = Database['public']['Tables']['likes']['Row']

export interface PostWithProfile extends Post {
  profiles: Profile
  likes: { count: number }
  isLiked?: boolean
}

export interface ProfileWithStats extends Profile {
  followers_count: number
  following_count: number
  posts_count: number
  isFollowing?: boolean
}

export type ThemeMode = 'light' | 'dark' | 'system'