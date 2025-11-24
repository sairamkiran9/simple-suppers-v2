import { renderHook, act, waitFor } from '@testing-library/react'
import { useCreateFeedPost } from '@/hooks/useCreateFeedPost'

// Mock the feed API
jest.mock('@/lib/api/feed', () => ({
  createFeedPost: jest.fn()
}))

describe('useCreateFeedPost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCreateFeedPost())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.createPost).toBe('function')
  })

  it('should create a post successfully', async () => {
    const { createFeedPost } = require('@/lib/api/feed')
    
    const mockPost = {
      id: 'post-1',
      title: 'Test Post',
      content: 'Test content',
      post_type: 'recipe_tip',
      author_id: 'user-123'
    }

    createFeedPost.mockResolvedValue(mockPost)

    const { result } = renderHook(() => useCreateFeedPost())

    let createdPost: any = null

    await act(async () => {
      createdPost = await result.current.createPost({
        title: 'Test Post',
        content: 'Test content',
        post_type: 'recipe_tip'
      })
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(createdPost).toEqual(mockPost)
    expect(createFeedPost).toHaveBeenCalledWith({
      title: 'Test Post',
      content: 'Test content',
      post_type: 'recipe_tip'
    })
  })

  it('should handle loading state during creation', async () => {
    const { createFeedPost } = require('@/lib/api/feed')
    
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    
    createFeedPost.mockReturnValue(promise)

    const { result } = renderHook(() => useCreateFeedPost())

    // Start creating post
    act(() => {
      result.current.createPost({
        title: 'Test Post',
        content: 'Test content',
        post_type: 'recipe_tip'
      })
    })

    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()

    // Resolve the promise
    act(() => {
      resolvePromise!({ id: 'post-1' })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle API errors', async () => {
    const { createFeedPost } = require('@/lib/api/feed')
    
    createFeedPost.mockRejectedValue(new Error('Not authenticated'))

    const { result } = renderHook(() => useCreateFeedPost())

    let createdPost: any = null

    await act(async () => {
      createdPost = await result.current.createPost({
        title: 'Test Post',
        content: 'Test content',
        post_type: 'recipe_tip'
      })
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Not authenticated')
    expect(createdPost).toBeNull()
  })

  it('should handle string errors', async () => {
    const { createFeedPost } = require('@/lib/api/feed')
    
    createFeedPost.mockRejectedValue('String error')

    const { result } = renderHook(() => useCreateFeedPost())

    let createdPost: any = null

    await act(async () => {
      createdPost = await result.current.createPost({
        title: 'Test Post',
        content: 'Test content',
        post_type: 'recipe_tip'
      })
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Failed to create post')
    expect(createdPost).toBeNull()
  })

  it('should create posts with all optional fields', async () => {
    const { createFeedPost } = require('@/lib/api/feed')
    
    const mockPost = { id: 'post-1' }
    createFeedPost.mockResolvedValue(mockPost)

    const { result } = renderHook(() => useCreateFeedPost())

    await act(async () => {
      await result.current.createPost({
        title: 'Meal Plan Post',
        content: 'Check out this meal plan!',
        post_type: 'meal_plan',
        image_url: 'https://example.com/image.jpg',
        related_meal_plan_id: 'plan-123',
        tags: ['healthy', 'quick']
      })
    })

    expect(createFeedPost).toHaveBeenCalledWith({
      title: 'Meal Plan Post',
      content: 'Check out this meal plan!',
      post_type: 'meal_plan',
      image_url: 'https://example.com/image.jpg',
      related_meal_plan_id: 'plan-123',
      tags: ['healthy', 'quick']
    })
  })

  it('should handle different post types', async () => {
    const { createFeedPost } = require('@/lib/api/feed')
    
    createFeedPost.mockResolvedValue({ id: 'post-1' })

    const { result } = renderHook(() => useCreateFeedPost())

    const postTypes: Array<'meal_plan' | 'recipe_tip' | 'announcement'> = [
      'meal_plan',
      'recipe_tip', 
      'announcement'
    ]

    for (const postType of postTypes) {
      await act(async () => {
        await result.current.createPost({
          title: `Test ${postType}`,
          content: 'Test content',
          post_type: postType
        })
      })

      expect(createFeedPost).toHaveBeenCalledWith({
        title: `Test ${postType}`,
        content: 'Test content',
        post_type: postType
      })
    }
  })

  it('should clear error on successful creation after previous error', async () => {
    const { createFeedPost } = require('@/lib/api/feed')
    
    // First call fails
    createFeedPost.mockRejectedValueOnce(new Error('First error'))
    // Second call succeeds
    createFeedPost.mockResolvedValueOnce({ id: 'post-1' })

    const { result } = renderHook(() => useCreateFeedPost())

    // First attempt - should fail
    await act(async () => {
      await result.current.createPost({
        title: 'Test Post',
        content: 'Test content',
        post_type: 'recipe_tip'
      })
    })

    expect(result.current.error).toBe('First error')

    // Second attempt - should succeed and clear error
    await act(async () => {
      await result.current.createPost({
        title: 'Test Post 2',
        content: 'Test content 2',
        post_type: 'recipe_tip'
      })
    })

    expect(result.current.error).toBeNull()
  })
})