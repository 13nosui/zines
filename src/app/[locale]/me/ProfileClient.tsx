'use client'

import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { MyPostsGrid } from '@/components/posts/MyPostsGrid'
import { FABMenu } from '@/components/ui/FABMenu'

interface ProfileClientProps {
  session: Session
  initialProfile?: any
}

export function ProfileClient({ session }: ProfileClientProps) {
  const [hasNoPosts, setHasNoPosts] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Posts Grid */}
      <MyPostsGrid 
        userId={session.user.id} 
        onEmptyState={() => setHasNoPosts(true)}
      />
      
      {/* FAB Menu */}
      <FABMenu hasNoPosts={hasNoPosts} />
    </div>
  )
}