import { renderHook, act, waitFor } from '@testing-library/react'
import { useComments } from '@/hooks/useComments'
import { createQueryWrapper, createTestQueryClient } from '@/__tests__/test-utils'
import { getPostComments, addComment } from '@/lib/api/feed.client'
import type { FeedCommentWithAuthor, FeedComment } from '@/lib/database-types'
import { QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock the API functions
jest.mock('@/lib/api/feed.client', () => ({
  getPostComments: jest.fn(),
  addComment: jest.fn()
}))

describe.skip('useComments', () => {
  let wrapper: ReturnType<typeof createQueryWrapper>
  const mockPostId = 'post-123'
  
  const mockComments: FeedCommentWithAuthor[] = [
    {
      id: 'comment-1',
      post_id: 'post-123',
      user_id: 'user-456',
      content: 'Great recipe! Can\'t wait to try it.',
      parent_comment_id: null,
      likes_count: 3,
      is_deleted: false,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      author: {
        id: 'user-456',
        name: 'John Doe'
      },
      user_has_liked: false
    },
    {
      id: 'comment-2',
      post_id: 'post-123',
      user_id: 'user-789',
      content: 'Thanks for sharing!',
      parent_comment_id: null,
      likes_count: 1,
      is_deleted: false,
      created_at: '2024-01-15T11:00:00Z',
      updated_at: '2024-01-15T11:00:00Z',
      author: {
        id: 'user-789',
        name: 'Jane Smith'
      },
      user_has_liked: true
    }
  ]

  const mockNewComment: FeedComment = {
    id: 'comment-3',
    post_id: 'post-123',
    user_id: 'user-999',
    content: 'Love this!',
    parent_comment_id: null,
    likes_count: 0,
    is_deleted: false,
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createQueryWrapper()
  })

  afterEach(() => {
    ;(wrapper as any).cleanup?.()
  })

  describe('Fetching Comments', () => {
    it('should fetch comments for a post successfully', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValue(mockComments)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.comments).toEqual(mockComments)
      expect(result.current.commentsCount).toBe(2)
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.hasLoaded).toBe(true)
    })

    it('should handle loading state', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      let resolvePromise: any
      getPostComments.mockImplementation(() => new Promise((resolve) => {
        resolvePromise = resolve
      }))

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      expect(result.current.loading).toBe(true)
      expect(result.current.comments).toEqual([])
      expect(result.current.error).toBeNull()
      expect(result.current.hasLoaded).toBe(false)
      
      // Cleanup
      resolvePromise([])
      await waitFor(() => expect(result.current.loading).toBe(false))
    })

    it('should handle error state', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')

      const testError = new Error('Failed to load comments')
      getPostComments.mockRejectedValueOnce(testError)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      // Wait for loading to complete AND error to be set
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false)
          expect(result.current.error).toBeTruthy()
        },
        { timeout: 5000 }
      )

      expect(result.current.error).toBe('Failed to load comments')
      expect(result.current.comments).toEqual([])
      expect(result.current.hasLoaded).toBe(true)
    })

    it('should handle empty comments list', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValueOnce([])

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await waitFor(() => {
        expect(result.current.hasLoaded).toBe(true)
      })

      expect(result.current.comments).toEqual([])
      expect(result.current.commentsCount).toBe(0)
      expect(result.current.error).toBeNull()
    })

    it('should not fetch when postId is not provided', () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      renderHook(() => useComments(''), { wrapper })

      expect(getPostComments).not.toHaveBeenCalled()
    })

    it('should not fetch when postId is null/undefined', () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      renderHook(() => useComments(null as any), { wrapper })

      expect(getPostComments).not.toHaveBeenCalled()
    })

    it('should provide manual fetchComments function', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValueOnce(mockComments)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await waitFor(() => {
        expect(result.current.hasLoaded).toBe(true)
      })

      const newComment = {
        id: 'comment-3',
        post_id: 'post-123',
        user_id: 'user-888',
        content: 'Another comment',
        parent_comment_id: null,
        likes_count: 0,
        is_deleted: false,
        created_at: '2024-01-15T13:00:00Z',
        updated_at: '2024-01-15T13:00:00Z',
        author: {
          id: 'user-888',
          name: 'Alice Johnson'
        },
        user_has_liked: false
      }
      
      getPostComments.mockResolvedValueOnce([...mockComments, newComment])

      await act(async () => {
        result.current.fetchComments()
      })

      await waitFor(() => {
        expect(result.current.comments).toHaveLength(3)
      })

      expect(getPostComments).toHaveBeenCalledTimes(2)
    })
  })

  describe('Adding Comments', () => {
    it('should add a new comment successfully', async () => {
      const { getPostComments, addComment } = require('@/lib/api/feed.client')
      
      // Mock initial comments
      getPostComments.mockResolvedValueOnce(mockComments)
      
      // Mock add comment response
      addComment.mockResolvedValueOnce(mockNewComment)
      
      // Mock refetch after adding
      getPostComments.mockResolvedValueOnce(mockComments)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.hasLoaded).toBe(true)
      })

      await act(async () => {
        await result.current.submitComment('New comment content')
      })

      // Should call addComment API
      expect(addComment).toHaveBeenCalledWith(mockPostId, 'New comment content')
    })

    it('should update comments list after adding', async () => {
      const { getPostComments, addComment } = require('@/lib/api/feed.client')
      
      const updatedComments = [...mockComments, {
        id: 'comment-3',
        post_id: 'post-123',
        user_id: 'user-999',
        content: 'New comment content',
        parent_comment_id: null,
        likes_count: 0,
        is_deleted: false,
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        author: {
          id: 'user-999',
          name: 'Test User'
        },
        user_has_liked: false
      }]
      
      // Mock initial comments
      getPostComments.mockResolvedValueOnce(mockComments)
      
      // Mock add comment response
      addComment.mockResolvedValueOnce(mockNewComment)
      
      // Mock refetch with updated list
      getPostComments.mockResolvedValueOnce(updatedComments)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.hasLoaded).toBe(true)
      })

      await act(async () => {
        await result.current.submitComment('New comment content')
      })

      await waitFor(() => {
        expect(result.current.comments).toHaveLength(3)
      })

      expect(result.current.commentsCount).toBe(3)
    })

    it('should handle add comment errors', async () => {
      const { addComment } = require('@/lib/api/feed.client')
      
      const testError = new Error('Failed to post comment')
      addComment.mockRejectedValue(testError)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await act(async () => {
        await result.current.submitComment('New comment content')
      })

      expect(result.current.error).toBe('Failed to post comment')
    })

    it('should validate comment content (not empty)', async () => {
      const { addComment, getPostComments } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValueOnce(mockComments)
      
      const { result } = renderHook(() => useComments(mockPostId), { wrapper })
      
      await waitFor(() => expect(result.current.hasLoaded).toBe(true))

      const result1 = await act(async () => {
        return await result.current.submitComment('')
      })

      expect(result1).toBeNull()
      expect(addComment).not.toHaveBeenCalled()

      const result2 = await act(async () => {
        return await result.current.submitComment('   ')
      })

      expect(result2).toBeNull()
      expect(addComment).not.toHaveBeenCalled()
    })

    it('should show loading state during submission', async () => {
      const { getPostComments, addComment } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValue(mockComments)
      addComment.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.submitting).toBe(false)

      act(() => {
        result.current.submitComment('New comment content')
      })

      expect(result.current.submitting).toBe(true)
    })

    it('should prevent multiple submissions', async () => {
      const { addComment } = require('@/lib/api/feed.client')
      
      addComment.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      act(() => {
        result.current.submitComment('New comment content')
      })

      expect(result.current.submitting).toBe(true)

      // Try to submit again
      act(() => {
        result.current.submitComment('Another comment')
      })

      expect(addComment).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during fetch', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')

      const networkError = new Error('Network error')
      getPostComments.mockRejectedValue(networkError)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      // Wait for loading to complete AND error to be set
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false)
          expect(result.current.error).toBeTruthy()
        },
        { timeout: 3000 }
      )

      expect(result.current.error).toBe('Failed to load comments')
    })

    it('should handle add comment network errors', async () => {
      const { addComment } = require('@/lib/api/feed.client')
      
      const networkError = new Error('Network error')
      addComment.mockRejectedValue(networkError)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await act(async () => {
        await result.current.submitComment('New comment content')
      })

      expect(result.current.error).toBe('Failed to post comment')
    })

    it('should handle HTTP errors with status codes', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')

      const httpError = new Error('Unauthorized')
      httpError.name = 'HTTPError'
      getPostComments.mockRejectedValue(httpError)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      // Wait for loading to complete AND error to be set
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false)
          expect(result.current.error).toBeTruthy()
        },
        { timeout: 3000 }
      )

      expect(result.current.error).toBe('Failed to load comments')
    })

    it('should handle malformed API responses', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      // Mock a non-array response
      getPostComments.mockResolvedValue(null)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await waitFor(() => {
        expect(result.current.hasLoaded).toBe(true)
      })

      expect(result.current.comments).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Caching & Refetching', () => {
    it('should cache comments data with React Query', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValueOnce(mockComments)

      // Create shared QueryClient for caching test
      const testQueryClient = createTestQueryClient()
      const sharedWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useComments(mockPostId), { wrapper: sharedWrapper })

      await waitFor(() => {
        expect(result.current.hasLoaded).toBe(true)
      })

      expect(result.current.comments).toEqual(mockComments)

      // Second render with same QueryClient should use cached data
      const { result: result2 } = renderHook(() => useComments(mockPostId), { wrapper: sharedWrapper })

      await waitFor(() => {
        expect(result2.current.hasLoaded).toBe(true)
      })

      expect(result2.current.comments).toEqual(mockComments)
      expect(getPostComments).toHaveBeenCalledTimes(1)
    })

    it('should support manual refresh', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      const initialComments = [mockComments[0]]
      const refreshedComments = [...mockComments]
      
      getPostComments
        .mockResolvedValueOnce(initialComments)
        .mockResolvedValueOnce(refreshedComments)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.comments).toHaveLength(1)
      })

      expect(result.current.comments).toHaveLength(1)

      // Manual refresh
      act(() => {
        result.current.refresh()
      })

      await waitFor(() => {
        expect(result.current.comments).toHaveLength(2)
      })

      expect(getPostComments).toHaveBeenCalledTimes(2)
    })

    it('should refetch after successful comment submission', async () => {
      const { getPostComments, addComment } = require('@/lib/api/feed.client')
      
      const initialComments = [mockComments[0]]
      const updatedComments = [...initialComments, mockComments[1]]
      
      getPostComments
        .mockResolvedValueOnce(initialComments)
        .mockResolvedValueOnce(updatedComments)
      
      addComment.mockResolvedValue(mockNewComment)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.comments).toHaveLength(1)
      })

      await act(async () => {
        await result.current.submitComment('New comment')
      })

      // Should have refetched after adding comment
      await waitFor(() => {
        expect(result.current.comments).toHaveLength(2)
      })

      expect(getPostComments).toHaveBeenCalledTimes(2)
    })

    it('should use different cache keys for different posts', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      const commentsForPost1 = [mockComments[0]]
      const commentsForPost2 = [mockComments[1]]
      
      getPostComments
        .mockResolvedValueOnce(commentsForPost1)
        .mockResolvedValueOnce(commentsForPost2)

      const { result: result1 } = renderHook(() => useComments('post-1'), { wrapper })

      await waitFor(() => {
        expect(result1.current.comments).toHaveLength(1)
      })

      const { result: result2 } = renderHook(() => useComments('post-2'), { wrapper })

      await waitFor(() => {
        expect(result2.current.comments).toHaveLength(1)
      })

      expect(result1.current.comments[0].id).toBe('comment-1')
      expect(result2.current.comments[0].id).toBe('comment-2')
      expect(getPostComments).toHaveBeenCalledTimes(2)
    })
  })

  describe('Data Structure', () => {
    it('should return correct comment data structure', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValue(mockComments)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.comments[0]).toHaveProperty('id')
      expect(result.current.comments[0]).toHaveProperty('content')
      expect(result.current.comments[0]).toHaveProperty('author')
      expect(result.current.comments[0]).toHaveProperty('created_at')
      expect(result.current.comments[0]).toHaveProperty('user_has_liked')
    })

    it('should include author information', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValue(mockComments)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.comments[0].author).toEqual({
        id: 'user-456',
        name: 'John Doe'
      })
    })

    it('should include user interaction data', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValue(mockComments)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.comments[0].user_has_liked).toBe(false)
      expect(result.current.comments[1].user_has_liked).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle comments with deleted flag', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      const deletedComment: FeedCommentWithAuthor = {
        ...mockComments[0],
        id: 'comment-deleted',
        content: '[deleted]',
        is_deleted: true
      }
      
      const mixedComments = [deletedComment, mockComments[1]]
      getPostComments.mockResolvedValue(mixedComments)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.comments).toHaveLength(2)
      expect(result.current.comments[0].is_deleted).toBe(true)
    })

    it('should handle very long comment content', async () => {
      const { getPostComments, addComment } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValue([])
      
      const longContent = 'a'.repeat(1000)
      addComment.mockResolvedValue({
        ...mockNewComment,
        content: longContent
      })

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await act(async () => {
        await result.current.submitComment(longContent)
      })

      expect(addComment).toHaveBeenCalledWith(mockPostId, longContent)
    })

    it('should handle special characters in comment content', async () => {
      const { getPostComments, addComment } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValue([])
      
      const specialContent = 'Comment with émojis 🚀 and spëciål çhars!'
      addComment.mockResolvedValue({
        ...mockNewComment,
        content: specialContent
      })

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await act(async () => {
        await result.current.submitComment(specialContent)
      })

      expect(addComment).toHaveBeenCalledWith(mockPostId, specialContent)
    })

    it('should handle rapid successive submissions', async () => {
      const { addComment } = require('@/lib/api/feed.client')
      
      addComment.mockResolvedValue(mockNewComment)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      // Submit multiple comments rapidly
      const promises = [
        result.current.submitComment('Comment 1'),
        result.current.submitComment('Comment 2'),
        result.current.submitComment('Comment 3')
      ]

      await Promise.all(promises)

      // Should handle all submissions despite rapid firing
      expect(addComment).toHaveBeenCalled()
    })
  })

  describe('Authentication Validation', () => {
    it('should handle authentication requirements', async () => {
      const { addComment } = require('@/lib/api/feed.client')
      
      const authError = new Error('Not authenticated')
      authError.name = 'UnauthorizedError'
      addComment.mockRejectedValue(authError)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await act(async () => {
        await result.current.submitComment('New comment')
      })

      expect(result.current.error).toBe('Failed to post comment')
    })

    it('should handle token expiration', async () => {
      const { addComment } = require('@/lib/api/feed.client')
      
      const expiredError = new Error('Token expired')
      expiredError.name = 'UnauthorizedError'
      addComment.mockRejectedValue(expiredError)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      await act(async () => {
        await result.current.submitComment('New comment')
      })

      expect(result.current.error).toBe('Failed to post comment')
    })
  })

  describe('State Management', () => {
    it('should reset submitting state after success', async () => {
      const { getPostComments, addComment } = require('@/lib/api/feed.client')
      
      getPostComments.mockResolvedValue(mockComments)
      addComment.mockResolvedValue(mockNewComment)

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.submitting).toBe(false)

      act(() => {
        result.current.submitComment('New comment')
      })

      expect(result.current.submitting).toBe(true)

      await waitFor(() => {
        expect(result.current.submitting).toBe(false)
      })
    })

    it('should reset submitting state after error', async () => {
      const { addComment } = require('@/lib/api/feed.client')
      
      addComment.mockRejectedValue(new Error('Failed to post'))

      const { result } = renderHook(() => useComments(mockPostId), { wrapper })

      act(() => {
        result.current.submitComment('New comment')
      })

      expect(result.current.submitting).toBe(true)

      await waitFor(() => {
        expect(result.current.submitting).toBe(false)
      })
    })

    it('should maintain independent state for different post IDs', async () => {
      const { getPostComments } = require('@/lib/api/feed.client')
      
      const commentsPost1 = [mockComments[0]]
      const commentsPost2 = [mockComments[1]]
      
      getPostComments
        .mockResolvedValueOnce(commentsPost1)
        .mockResolvedValueOnce(commentsPost2)

      const { result: result1 } = renderHook(() => useComments('post-1'), { wrapper })
      const { result: result2 } = renderHook(() => useComments('post-2'), { wrapper })

      await waitFor(() => {
        expect(result1.current.comments).toHaveLength(1)
        expect(result2.current.comments).toHaveLength(1)
      })

      expect(result1.current.comments[0].id).toBe('comment-1')
      expect(result2.current.comments[0].id).toBe('comment-2')
      
      // Each should have independent loading states
      expect(result1.current.loading).toBe(false)
      expect(result2.current.loading).toBe(false)
    })
  })
})
