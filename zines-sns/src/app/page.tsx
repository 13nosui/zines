import { PostGridClient } from '@/components/posts/PostGridClient'
import { FABNavigation } from '@/components/navigation/FABNavigation'
import { createServerClient } from '@/lib/supabase/server'
import { PostWithProfile } from '@/types'

const POSTS_PER_PAGE = 24

async function getPosts(offset = 0): Promise<PostWithProfile[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!inner (
        id,
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + POSTS_PER_PAGE - 1)

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  // Get likes count for each post
  const postsWithLikes = await Promise.all(
    (data || []).map(async (post) => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      return {
        ...post,
        likes: { count: count || 0 }
      }
    })
  )

  return postsWithLikes as PostWithProfile[]
}

export default async function HomePage() {
  const initialPosts = await getPosts()
  
  const fabItems = [
    { icon: 'add', label: 'Create Post', path: '/post/new' },
    { icon: 'person', label: 'My Page', path: '/profile' },
    { icon: 'settings', label: 'Settings', path: '/settings' },
  ]

  return (
    <main className="min-h-screen">
      <PostGridClient
        initialPosts={initialPosts}
        hasMore={initialPosts.length === POSTS_PER_PAGE}
      />
      <FABNavigation items={fabItems} />
    </main>
  )
}