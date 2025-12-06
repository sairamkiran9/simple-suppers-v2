import { renderHook, act, waitFor } from '@testing-library/react'
import { useFeedPosts } from '@/hooks/useFeedPosts'
import { createQueryWrapper } from '@/__tests__/test-utils'

// Mock the feed API
jest.mock('@/lib/api/feed.client', () => ({
  getFeedPosts: jest.fn()
}))

describe('useFeedPosts', () => {
  let wrapper: ReturnType<typeof createQueryWrapper>

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createQueryWrapper()
  })

  afterEach(() => {
    ;(wrapper as any).cleanup?.()
  })

  it('should initialize with loading state', () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')
    getFeedPosts.mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useFeedPosts(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.posts).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.hasMore).toBe(false) // Updated: React Query returns false by default
  })

  it('should load posts successfully', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')

    const mockPosts = [
      {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        author: { name: 'Test Author' },
      },
    ]

    getFeedPosts.mockResolvedValueOnce({
      posts: mockPosts,
      hasMore: false,
    })

    const { result } = renderHook(() => useFeedPosts(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.posts).toHaveLength(1)
    }, { timeout: 3000 })

    expect(result.current.posts).toEqual(mockPosts)
    expect(result.current.hasMore).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle API errors', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')

    const testError = new Error('API Error')
    // Mock needs to reject twice because hook has retry: 1
    getFeedPosts.mockRejectedValueOnce(testError).mockRejectedValueOnce(testError)

    const { result } = renderHook(() => useFeedPosts(), { wrapper })

    // Wait for error to be set (after retry)
    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    }, { timeout: 5000 })

    expect(result.current.loading).toBe(false)
    expect(result.current.posts).toEqual([])
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('should load more posts when loadMore is called', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')

    const initialPosts = [
      { id: 'post-1', title: 'Post 1', author: { name: 'Author 1' } },
    ]

    const morePosts = [
      { id: 'post-2', title: 'Post 2', author: { name: 'Author 2' } },
    ]

    getFeedPosts
      .mockResolvedValueOnce({ posts: initialPosts, hasMore: true })
      .mockResolvedValueOnce({ posts: morePosts, hasMore: false })

    const { result } = renderHook(() => useFeedPosts(), { wrapper })

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.posts).toHaveLength(1)
    }, { timeout: 3000 })

    expect(result.current.hasMore).toBe(true)

    // Load more
    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => {
      expect(result.current.posts).toHaveLength(2)
    }, { timeout: 3000 })

    expect(result.current.posts[0].id).toBe('post-1')
    expect(result.current.posts[1].id).toBe('post-2')
    expect(result.current.hasMore).toBe(false)
  })

  it('should not load more when already loading', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')

    getFeedPosts.mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useFeedPosts(), { wrapper })

    // Try to load more while still loading
    act(() => {
      result.current.loadMore()
    })

    expect(getFeedPosts).toHaveBeenCalledTimes(1) // Only initial call
  })

  it('should not load more when hasMore is false', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')

    getFeedPosts.mockResolvedValueOnce({
      posts: [{ id: 'post-1', title: 'Post 1', author: { name: 'Author' } }],
      hasMore: false,
    })

    const { result } = renderHook(() => useFeedPosts(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.posts).toHaveLength(1)
    }, { timeout: 3000 })

    expect(result.current.hasMore).toBe(false)

    // Try to load more
    act(() => {
      result.current.loadMore()
    })

    expect(getFeedPosts).toHaveBeenCalledTimes(1) // Only initial call
  })

  it('should refresh posts when refresh is called', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')

    const initialPosts = [
      { id: 'post-1', title: 'Post 1', author: { name: 'Author 1' } },
    ]

    const refreshedPosts = [
      { id: 'post-2', title: 'Post 2', author: { name: 'Author 2' } },
      { id: 'post-3', title: 'Post 3', author: { name: 'Author 3' } },
    ]

    getFeedPosts
      .mockResolvedValueOnce({ posts: initialPosts, hasMore: false })
      .mockResolvedValueOnce({ posts: refreshedPosts, hasMore: true })

    const { result } = renderHook(() => useFeedPosts(), { wrapper })

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.posts).toHaveLength(1)
    }, { timeout: 3000 })

    // Refresh - this will refetch page 0
    act(() => {
      result.current.refresh()
    })

    // Wait for the refreshed data
    await waitFor(() => {
      expect(result.current.posts).toHaveLength(2)
    }, { timeout: 3000 })

    expect(result.current.posts[0].id).toBe('post-2')
    expect(result.current.posts[1].id).toBe('post-3')
    expect(result.current.hasMore).toBe(true)
    // Verify the hook called getFeedPosts twice (initial + refresh, both with page 0)
    expect(getFeedPosts).toHaveBeenCalledTimes(2)
    expect(getFeedPosts).toHaveBeenCalledWith(0, 20)
  })

  it('should provide loadingMore state during pagination', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')

    const mockPosts = [
      { id: 'post-1', title: 'Post 1', author: { name: 'Author 1' } },
    ]

    getFeedPosts
      .mockResolvedValueOnce({ posts: mockPosts, hasMore: true })
      .mockImplementationOnce(() => new Promise(() => {})) // Never resolves for loadingMore state

    const { result } = renderHook(() => useFeedPosts(), { wrapper })

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.posts).toHaveLength(1)
    }, { timeout: 3000 })

    expect(result.current.loadingMore).toBe(false)

    // Trigger load more
    act(() => {
      result.current.loadMore()
    })

    // Wait for loadingMore state to update
    await waitFor(() => {
      expect(result.current.loadingMore).toBe(true)
    }, { timeout: 3000 })
  })

  it('should handle multiple refresh cycles', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')

    const firstPosts = [{ id: 'post-1', title: 'Post 1', author: { name: 'Author 1' } }]
    const secondPosts = [{ id: 'post-2', title: 'Post 2', author: { name: 'Author 2' } }]

    getFeedPosts
      .mockResolvedValueOnce({ posts: firstPosts, hasMore: false })
      .mockResolvedValueOnce({ posts: secondPosts, hasMore: false })
      .mockResolvedValueOnce({ posts: firstPosts, hasMore: false })

    const { result } = renderHook(() => useFeedPosts(), { wrapper })

    // First load
    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1)
    }, { timeout: 3000 })
    expect(result.current.posts[0].id).toBe('post-1')

    // First refresh
    act(() => {
      result.current.refresh()
    })
    await waitFor(() => {
      expect(result.current.posts[0].id).toBe('post-2')
    }, { timeout: 3000 })

    // Second refresh
    act(() => {
      result.current.refresh()
    })
    await waitFor(() => {
      expect(result.current.posts[0].id).toBe('post-1')
    }, { timeout: 3000 })

    expect(getFeedPosts).toHaveBeenCalledTimes(3)
  })
})
