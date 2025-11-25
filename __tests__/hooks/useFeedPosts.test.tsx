import { renderHook, act, waitFor } from '@testing-library/react'
import { useFeedPosts } from '@/hooks/useFeedPosts'

// Mock the feed API
jest.mock('@/lib/api/feed.client', () => ({
  getFeedPosts: jest.fn()
}))

describe('useFeedPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')
    getFeedPosts.mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useFeedPosts())

    expect(result.current.loading).toBe(true)
    expect(result.current.posts).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.hasMore).toBe(true)
  })

  it('should load posts successfully', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')
    
    const mockPosts = [
      {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        author: { name: 'Test Author' }
      }
    ]

    getFeedPosts.mockResolvedValue({
      posts: mockPosts,
      hasMore: false
    })

    const { result } = renderHook(() => useFeedPosts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.posts).toEqual(mockPosts)
    expect(result.current.hasMore).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle API errors', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')
    
    getFeedPosts.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useFeedPosts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('API Error')
    expect(result.current.posts).toEqual([])
  })

  it('should load more posts when loadMore is called', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')
    
    const initialPosts = [
      { id: 'post-1', title: 'Post 1', author: { name: 'Author 1' } }
    ]
    
    const morePosts = [
      { id: 'post-2', title: 'Post 2', author: { name: 'Author 2' } }
    ]

    getFeedPosts
      .mockResolvedValueOnce({ posts: initialPosts, hasMore: true })
      .mockResolvedValueOnce({ posts: morePosts, hasMore: false })

    const { result } = renderHook(() => useFeedPosts())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.posts).toHaveLength(1)
    expect(result.current.hasMore).toBe(true)

    // Load more
    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.posts).toHaveLength(2)
    expect(result.current.posts[0].id).toBe('post-1')
    expect(result.current.posts[1].id).toBe('post-2')
    expect(result.current.hasMore).toBe(false)
  })

  it('should not load more when already loading', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')
    
    getFeedPosts.mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useFeedPosts())

    // Try to load more while still loading
    act(() => {
      result.current.loadMore()
    })

    expect(getFeedPosts).toHaveBeenCalledTimes(1) // Only initial call
  })

  it('should not load more when hasMore is false', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')
    
    getFeedPosts.mockResolvedValue({
      posts: [{ id: 'post-1', title: 'Post 1', author: { name: 'Author' } }],
      hasMore: false
    })

    const { result } = renderHook(() => useFeedPosts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

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
      { id: 'post-1', title: 'Post 1', author: { name: 'Author 1' } }
    ]
    
    const refreshedPosts = [
      { id: 'post-2', title: 'Post 2', author: { name: 'Author 2' } },
      { id: 'post-3', title: 'Post 3', author: { name: 'Author 3' } }
    ]

    getFeedPosts
      .mockResolvedValueOnce({ posts: initialPosts, hasMore: false })
      .mockResolvedValueOnce({ posts: refreshedPosts, hasMore: true })

    const { result } = renderHook(() => useFeedPosts())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.posts).toHaveLength(1)

    // Refresh
    act(() => {
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.posts).toHaveLength(2)
    expect(result.current.posts[0].id).toBe('post-2')
    expect(result.current.hasMore).toBe(true)
    expect(getFeedPosts).toHaveBeenLastCalledWith(0, 20) // Reset to page 0
  })

  it('should handle string errors gracefully', async () => {
    const { getFeedPosts } = require('@/lib/api/feed.client')
    
    getFeedPosts.mockRejectedValue('String error')

    const { result } = renderHook(() => useFeedPosts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load posts')
  })
})