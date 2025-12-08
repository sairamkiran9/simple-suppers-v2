'use client'

/**
 * useComments Hook - React Query Version
 *
 * Manages fetching and adding comments for a post
 * Uses React Query for data fetching with manual optimistic updates
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPostComments, addComment } from '@/lib/api/feed.client'
import type { FeedCommentWithAuthor } from '@/lib/database-types'

interface UseCommentsReturn {
  /** Array of comments for the post */
  comments: FeedCommentWithAuthor[]
  /** Loading state for initial fetch */
  loading: boolean
  /** Loading state for submitting new comment */
  submitting: boolean
  /** Error message if fetch/submit fails */
  error: string | null
  /** Whether comments have been loaded at least once */
  hasLoaded: boolean
  /** Function to fetch comments */
  fetchComments: () => void
  /** Function to submit a new comment */
  submitComment: (content: string) => Promise<any>
  /** Function to refresh comments */
  refresh: () => void
  /** Total number of comments */
  commentsCount: number
}

/**
 * Hook for fetching and managing comments for a post with React Query
 *
 * Benefits over manual state management:
 * - Automatic caching per post ID
 * - Request deduplication (multiple components = 1 API call)
 * - Short cache time (30 seconds) for dynamic comment content
 * - Automatic error handling and retry
 *
 * @param postId - The unique identifier of the post
 * @returns Object containing comments, loading states, and action functions
 *
 * @example
 * ```tsx
 * const { comments, loading, submitComment, submitting } = useComments(postId)
 *
 * const handleSubmit = async (content: string) => {
 *   await submitComment(content)
 * }
 *
 * if (loading) return <div>Loading comments...</div>
 * return <div>{comments.length} comments</div>
 * ```
 */
export function useComments(postId: string): UseCommentsReturn {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    data: comments = [],
    isLoading: loading,
    error: fetchError,
    refetch,
    isSuccess: hasLoaded
  } = useQuery({
    // Query key includes post ID for per-post caching
    queryKey: ['post-comments', postId],

    // Query function that fetches the comments
    queryFn: async () => {
      const data = await getPostComments(postId)
      return data || []
    },

    // Only fetch if postId is provided
    enabled: !!postId,

    // Cache configuration - short cache for dynamic content
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes

    // Don't refetch on window focus (better UX)
    refetchOnWindowFocus: false,

    // Retry once on failure
    retry: 1,
  })

  const fetchComments = useCallback(() => {
    refetch()
  }, [refetch])

  const submitCommentHandler = useCallback(async (content: string) => {
    if (submitting || !content.trim()) return null

    setSubmitting(true)
    setSubmitError(null)

    try {
      const newComment = await addComment(postId, content.trim())

      // Refetch comments to get the updated list with proper author data
      await refetch()

      return newComment
    } catch (err) {
      const errorMessage = 'Failed to post comment'
      setSubmitError(errorMessage)
      console.error('Error posting comment:', err)
      return null
    } finally {
      setSubmitting(false)
    }
  }, [postId, submitting, refetch])

  const refresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Combine fetch and submit errors
  const error = fetchError
    ? 'Failed to load comments'
    : submitError

  return {
    comments,
    loading,
    submitting,
    error,
    hasLoaded,
    fetchComments,
    submitComment: submitCommentHandler,
    refresh,
    commentsCount: (comments || []).length
  }
}
