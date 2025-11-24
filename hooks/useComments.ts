'use client'

import { useState, useCallback } from 'react'
import { getPostComments, addComment } from '@/lib/api/feed'
import type { FeedCommentWithAuthor } from '@/lib/database-types'

export function useComments(postId: string) {
  const [comments, setComments] = useState<FeedCommentWithAuthor[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  const fetchComments = useCallback(async () => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const data = await getPostComments(postId)
      setComments(data)
      setHasLoaded(true)
    } catch (err) {
      setError('Failed to load comments')
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }, [postId, loading])

  const submitComment = useCallback(async (content: string) => {
    if (submitting || !content.trim()) return null

    setSubmitting(true)
    setError(null)

    try {
      const newComment = await addComment(postId, content.trim())

      // Add the new comment to the list with mock author data for immediate display
      const commentWithAuthor: FeedCommentWithAuthor = {
        ...newComment,
        author: {
          id: newComment.user_id,
          name: 'You' // Will be replaced on refresh
        },
        user_has_liked: false
      }

      setComments(prev => [...prev, commentWithAuthor])
      return newComment
    } catch (err) {
      setError('Failed to post comment')
      console.error('Error posting comment:', err)
      return null
    } finally {
      setSubmitting(false)
    }
  }, [postId, submitting])

  const refresh = useCallback(() => {
    fetchComments()
  }, [fetchComments])

  return {
    comments,
    loading,
    submitting,
    error,
    hasLoaded,
    fetchComments,
    submitComment,
    refresh,
    commentsCount: comments.length
  }
}
