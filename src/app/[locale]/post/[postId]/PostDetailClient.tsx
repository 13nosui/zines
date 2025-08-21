'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardBody, Button, Chip } from '@heroui/react'
import { Icon } from '@/components/ui/Icon'
import { motion } from 'framer-motion'
import { BackButton } from '@/components/navigation/BackButton'

interface PostDetailClientProps {
  post: any
  locale: string
}

export function PostDetailClient({ post, locale }: PostDetailClientProps) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)



  const handleNextImage = () => {
    if (post.image_urls && currentImageIndex < post.image_urls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Content */}
      <div className="max-w-[480px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-none border-none bg-transparent">
            <CardBody className="p-0 space-y-4">

              {/* Image Display */}
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="relative">
                  <div className="relative aspect-square w-full bg-black overflow-hidden">
                    <Image
                      src={post.image_urls[currentImageIndex]}
                      alt={`Post image ${currentImageIndex + 1}`}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* Image Navigation */}
                  {post.image_urls.length > 1 && (
                    <>
                      <div className="absolute inset-y-0 left-0 flex items-center">
                        <Button
                          isIconOnly
                          variant="solid"
                          size="sm"
                          className="rounded-full ml-2 bg-black/50 text-white"
                          onPress={handlePrevImage}
                          isDisabled={currentImageIndex === 0}
                        >
                          <Icon name="chevron_left" />
                        </Button>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <Button
                          isIconOnly
                          variant="solid"
                          size="sm"
                          className="rounded-full mr-2 bg-black/50 text-white"
                          onPress={handleNextImage}
                          isDisabled={currentImageIndex === post.image_urls.length - 1}
                        >
                          <Icon name="chevron_right" />
                        </Button>
                      </div>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {post.image_urls.map((_: any, index: number) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex
                                ? 'bg-white'
                                : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Post Info */}
              <div className="space-y-3 px-4">
                {/* User Info - moved here */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-default-200 flex items-center justify-center">
                    {post.profiles?.avatar_url ? (
                      <Image
                        src={post.profiles.avatar_url}
                        alt={post.profiles.username || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <Icon name="person" className="text-default-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{post.profiles?.username || 'Anonymous'}</p>
                  </div>
                </div>

                {/* Likes */}
                <div className="flex items-center gap-2">
                  <Icon name="favorite" className="text-danger" />
                  <span className="text-sm">{post.likes?.count || 0} likes</span>
                </div>

                {/* Title */}
                {/* {post.title && (
                  <h2 className="text-xl font-semibold">{post.title}</h2>
                )} */}

                {/* Body */}
                {/* {post.body && (
                  <p className="text-default-700 whitespace-pre-wrap">{post.body}</p>
                )} */}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string, index: number) => (
                      <Chip
                        key={index}
                        size="lg"
                        variant="flat"
                        className="text-xs"
                      >
                        #{tag}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
      
      {/* FAB Back Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <BackButton variant="fab" />
      </div>
    </div>
  )
}