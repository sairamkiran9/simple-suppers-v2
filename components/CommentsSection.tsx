'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { User, Send, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useComments } from '@/hooks/useComments'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

interface CommentsSectionProps {
  postId: string
  initialCount: number
}

export function CommentsSection({ postId, initialCount }: CommentsSectionProps) {
  const { user } = useAuth()
  const {
    comments,
    loading,
    submitting,
    error,
    hasLoaded,
    fetchComments,
    submitComment
  } = useComments(postId)

  const [newComment, setNewComment] = useState('')
  const [showAll, setShowAll] = useState(false)

  // Fetch comments on mount
  useEffect(() => {
    if (!hasLoaded) {
      fetchComments()
    }
  }, [fetchComments, hasLoaded])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please sign in to comment')
      return
    }

    if (!newComment.trim()) return

    const result = await submitComment(newComment)
    if (result) {
      setNewComment('')
      toast.success('Comment posted!')
    }
  }

  const displayedComments = showAll ? comments : comments.slice(0, 3)
  const hasMoreComments = comments.length > 3

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback>
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <Input
            placeholder={user ? "Add a comment..." : "Sign in to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user || submitting}
            className="pr-10"
            maxLength={500}
          />
          {newComment.trim() && (
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={submitting}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-teal-600 hover:text-teal-700"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Loading State */}
      {loading && !hasLoaded && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Comments List */}
      {hasLoaded && comments.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
          No comments yet. Be the first to comment!
        </p>
      )}

      {displayedComments.length > 0 && (
        <div className="space-y-3">
          {displayedComments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                    {comment.author?.name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {/* Show More/Less */}
          {hasMoreComments && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showAll
                ? 'Show less'
                : `View all ${comments.length} comments`
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
