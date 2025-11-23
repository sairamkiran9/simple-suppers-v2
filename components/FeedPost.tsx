'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Share2, User } from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { togglePostLike, recordShare } from '@/lib/api/feed'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import type { FeedPostWithAuthor } from '@/lib/database-types'

interface FeedPostProps {
  post: FeedPostWithAuthor
}

export function FeedPost({ post }: FeedPostProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(post.user_has_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showComments, setShowComments] = useState(false)

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like posts')
      return
    }

    try {
      const result = await togglePostLike(post.id)
      setLiked(result.liked)
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1)
    } catch (error) {
      toast.error('Failed to update like')
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed/posts/${post.id}`)
      await recordShare(post.id, 'copy_link')
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'meal_plan': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'recipe_tip': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'announcement': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'meal_plan': return 'Meal Plan'
      case 'recipe_tip': return 'Recipe Tip'
      case 'announcement': return 'Announcement'
      default: return type
    }
  }

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.provider?.profile_image_url || undefined} />
              <AvatarFallback>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {post.provider?.business_name || post.author.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge className={getPostTypeColor(post.post_type)}>
            {getPostTypeLabel(post.post_type)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {post.title}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Meal Plan Link */}
        {post.meal_plan && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Featured Meal Plan:
            </p>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {post.meal_plan.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {post.meal_plan.is_free ? 'Free' : `$${post.meal_plan.final_price}`}
            </p>
          </div>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-6 pb-4">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`${liked ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
              {likesCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-gray-500 dark:text-gray-400"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {post.comments_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-500 dark:text-gray-400"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Comments feature coming soon...
          </p>
        </div>
      )}
    </article>
  )
}