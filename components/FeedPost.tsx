'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Share2, User, Link2, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { togglePostLike, recordShare, deleteFeedPost } from '@/lib/api/feed.client'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { CommentsSection } from './CommentsSection'
import type { FeedPostWithAuthor } from '@/lib/database-types'
import Image from 'next/image'

interface FeedPostProps {
  post: FeedPostWithAuthor
  onDelete?: () => void
}

export function FeedPost({ post, onDelete }: FeedPostProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(post.user_has_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showComments, setShowComments] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwnPost = user?.id === post.author_id

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

  const getShareUrl = () => `${window.location.origin}/feed/posts/${post.id}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      await recordShare(post.id, 'copy_link')
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShareTwitter = async () => {
    const url = getShareUrl()
    const text = `Check out "${post.title}" on Simple Suppers!`
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
    await recordShare(post.id, 'twitter')
  }

  const handleShareFacebook = async () => {
    const url = getShareUrl()
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
    await recordShare(post.id, 'facebook')
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteFeedPost(post.id)
      toast.success('Post deleted successfully')
      setShowDeleteDialog(false)
      onDelete?.()
    } catch (error) {
      toast.error('Failed to delete post')
    } finally {
      setIsDeleting(false)
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
      {/* Header - Instagram Style */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 ring-2 ring-teal-500 ring-offset-2">
            <AvatarImage src={post.author?.creator_profile_image_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold">
              {(post.author?.creator_display_name || post.author.name)?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              {post.author?.creator_display_name || post.author.name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge className={`${getPostTypeColor(post.post_type)} text-xs px-2 py-0`}>
                {getPostTypeLabel(post.post_type)}
              </Badge>
            </div>
          </div>
        </div>
        {isOwnPost && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Image - Instagram Style: Full width, no padding */}
      {post.image_url && (
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
          <Image
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            width={500}
            height={500}
          />
        </div>
      )}

      {/* Actions - Instagram Style */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`transition-transform active:scale-125 ${liked ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
            >
              <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-gray-700 dark:text-gray-300"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-700 dark:text-gray-300">
                  <Share2 className="w-6 h-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareTwitter}>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Share on X
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareFacebook}>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Share on Facebook
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Like Count */}
        <p className="font-semibold text-sm text-gray-900 dark:text-white mt-2">
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </p>
      </div>

      {/* Content - Instagram Style: Caption below image */}
      <div className="px-4 pb-2">
        <p className="text-sm text-gray-900 dark:text-white">
          <span className="font-semibold mr-2">
            {post.author?.creator_display_name || post.author.name}
          </span>
          <span className="font-medium">{post.title}</span>
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap line-clamp-3">
          {post.content}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">
            {post.tags.map((tag) => `#${tag}`).join(' ')}
          </p>
        )}

        {/* Meal Plan Link */}
        {post.meal_plan && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Featured Meal Plan
            </p>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              {post.meal_plan.title}
            </h4>
            <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
              {post.meal_plan.is_free ? 'Free' : `${post.meal_plan.final_price}`}
            </p>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 uppercase">
          {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
        </p>
      </div>

      {/* View Comments Button */}
      {post.comments_count > 0 && !showComments && (
        <button
          onClick={() => setShowComments(true)}
          className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          View all {post.comments_count} comments
        </button>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
          <CommentsSection postId={post.id} initialCount={post.comments_count} />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}