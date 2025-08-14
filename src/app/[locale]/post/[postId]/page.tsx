import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function PostDetailPage({ params }: { params: { postId: string } }) {
  const supabase = createServerClient()
  
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!inner (
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

  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold mb-4">{post.title || 'Untitled'}</h1>
      {post.body && <p className="mb-4">{post.body}</p>}
      {post.images && post.images.length > 0 && (
        <div className="grid gap-4">
          {post.images.map((image: string, index: number) => (
            <img
              key={index}
              src={image}
              alt={`Post image ${index + 1}`}
              className="w-full rounded-lg"
            />
          ))}
        </div>
      )}
    </div>
  )
}