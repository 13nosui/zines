'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardBody, Button } from '@heroui/react'
import { Icon } from '@/components/ui/Icon'
import { Profile, PostWithProfile } from '@/types'
import { PostGrid } from '@/components/posts/PostGrid'
import { FollowButton } from '@/components/profile/FollowButton'
import { BackButton } from '@/components/navigation/BackButton'

interface UserProfileClientProps {
  profile: Profile
  posts: PostWithProfile[]
  locale: string
  isOwnProfile: boolean
  followersCount: number
  followingCount: number
  postsCount: number
  isFollowing: boolean
}

export function UserProfileClient({
  profile,
  posts,
  locale,
  isOwnProfile,
  followersCount,
  followingCount,
  postsCount,
  isFollowing,
}: UserProfileClientProps) {
  const router = useRouter()

  const handleEditProfile = () => {
    router.push(`/${locale}/me`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Header */}
        <Card className="mt-8 mb-6">
          <CardBody className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-default-200 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username || 'User'}
                      width={128}
                      height={128}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <Icon name="person" className="text-4xl sm:text-5xl text-default-500" />
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
                  <h1 className="text-2xl font-bold">@{profile.username}</h1>
                  {isOwnProfile ? (
                    <Button
                      size="sm"
                      variant="bordered"
                      onPress={handleEditProfile}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <FollowButton userId={profile.id} />
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 justify-center sm:justify-start mb-4">
                  <div className="text-center">
                    <div className="font-bold text-lg">{postsCount}</div>
                    <div className="text-sm text-default-500">Posts</div>
                  </div>
                  <button
                    className="text-center hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/${locale}/user/${profile.id}/followers`)}
                  >
                    <div className="font-bold text-lg">{followersCount}</div>
                    <div className="text-sm text-default-500">Followers</div>
                  </button>
                  <button
                    className="text-center hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/${locale}/user/${profile.id}/following`)}
                  >
                    <div className="font-bold text-lg">{followingCount}</div>
                    <div className="text-sm text-default-500">Following</div>
                  </button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Posts Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Posts</h2>
          <PostGrid
            initialPosts={posts}
            enableLoadMore={true}
            hasMore={posts.length === 24}
            loadMore={async () => {
              const response = await fetch(`/api/posts/user/${profile.id}?offset=${posts.length}`)
              if (!response.ok) throw new Error('Failed to load posts')
              return response.json()
            }}
          />
        </div>
      </div>

      {/* Back Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <BackButton variant="fab" />
      </div>
    </div>
  )
}