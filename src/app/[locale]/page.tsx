import { PostGridClient } from '@/components/posts/PostGridClient'
import { FABNavigation } from '@/components/navigation/FABNavigation'
import { createServerClient } from '@/lib/supabase/server'
import { PostWithProfile } from '@/types'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

const POSTS_PER_PAGE = 24

async function getPosts(offset = 0): Promise<PostWithProfile[]> {
  const supabase = createServerClient()
  
  const { data: posts, error } = await supabase
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
    .limit(12)

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  // Get likes count for each post
  const postsWithLikes = await Promise.all(
    (posts || []).map(async (post: any) => {
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
  const t = await getTranslations()
  
  const fabItems = [
    { icon: 'add', label: t('zine.create'), path: '/create' },
    { icon: 'person', label: t('settings.profile'), path: '/me' },
    { icon: 'settings', label: t('common.settings'), path: '/settings' },
  ]

  return (
    <>
      <PostGridClient
        initialPosts={initialPosts}
        hasMore={initialPosts.length === POSTS_PER_PAGE}
      />
      <FABNavigation items={fabItems} />
    </>
  )
}