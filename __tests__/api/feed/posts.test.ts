import { NextRequest } from 'next/server'
import { GET as feedPostsGET, POST as feedPostsPOST } from '@/app/api/feed/posts/route'

// Create chainable mock for Supabase
const createChainableMock = () => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn(() => Promise.resolve({ data: null, error: null }))
})

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => createChainableMock())
  },
  supabaseAdmin: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => createChainableMock())
  }
}))

// Mock feed API functions
jest.mock('@/lib/api/feed.server', () => ({
  getFeedPosts: jest.fn(),
  createFeedPost: jest.fn()
}))

describe('/api/feed/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/feed/posts', () => {
    it('should get feed posts with default pagination', async () => {
      const { getFeedPosts } = require('@/lib/api/feed.server')
      
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Delicious Recipe',
          content: 'Try this amazing recipe!',
          post_type: 'recipe_tip',
          author: { name: 'Chef John' },
          likes_count: 5,
          comments_count: 2
        }
      ]

      getFeedPosts.mockResolvedValue({
        posts: mockPosts,
        hasMore: false
      })

      const request = new NextRequest('http://localhost:3000/api/feed/posts')
      const response = await feedPostsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(getFeedPosts).toHaveBeenCalledWith(0, 20, undefined)
      expect(data.posts).toHaveLength(1)
      expect(data.hasMore).toBe(false)
    })

    it('should handle pagination parameters', async () => {
      const { getFeedPosts } = require('@/lib/api/feed.server')
      
      getFeedPosts.mockResolvedValue({ posts: [], hasMore: true })

      const request = new NextRequest('http://localhost:3000/api/feed/posts?page=2&limit=10')
      await feedPostsGET(request)

      expect(getFeedPosts).toHaveBeenCalledWith(2, 10, undefined)
    })

    it('should pass user ID when authenticated', async () => {
      const { getFeedPosts } = require('@/lib/api/feed.server')
      const { supabase } = require('@/lib/supabase')
      
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
      getFeedPosts.mockResolvedValue({ posts: [], hasMore: false })

      const request = new NextRequest('http://localhost:3000/api/feed/posts', {
        headers: { authorization: 'Bearer valid-token' }
      })
      await feedPostsGET(request)

      expect(getFeedPosts).toHaveBeenCalledWith(0, 20, 'user-123')
    })

    it('should handle API errors gracefully', async () => {
      const { getFeedPosts } = require('@/lib/api/feed.server')
      
      getFeedPosts.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/feed/posts')
      const response = await feedPostsGET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to fetch feed posts')
    })
  })

  describe('POST /api/feed/posts', () => {
    it('should create a new post successfully', async () => {
      const { createFeedPost } = require('@/lib/api/feed.server')
      
      const mockPost = {
        id: 'post-1',
        title: 'New Recipe',
        content: 'Amazing dish!',
        post_type: 'recipe_tip',
        author_id: 'user-123'
      }

      createFeedPost.mockResolvedValue(mockPost)

      const request = new NextRequest('http://localhost:3000/api/feed/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Recipe',
          content: 'Amazing dish!',
          post_type: 'recipe_tip'
        })
      })

      const response = await feedPostsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('post-1')
      expect(createFeedPost).toHaveBeenCalledWith({
        title: 'New Recipe',
        content: 'Amazing dish!',
        post_type: 'recipe_tip',
        image_url: undefined,
        related_meal_plan_id: undefined,
        tags: undefined
      })
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/feed/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Recipe'
          // Missing content and post_type
        })
      })

      const response = await feedPostsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should handle creation errors', async () => {
      const { createFeedPost } = require('@/lib/api/feed.server')
      
      createFeedPost.mockRejectedValue(new Error('Not authenticated'))

      const request = new NextRequest('http://localhost:3000/api/feed/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Recipe',
          content: 'Amazing dish!',
          post_type: 'recipe_tip'
        })
      })

      const response = await feedPostsPOST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to create post')
    })

    it('should handle all post types', async () => {
      const { createFeedPost } = require('@/lib/api/feed.server')
      
      createFeedPost.mockResolvedValue({ id: 'post-1' })

      const postTypes = ['meal_plan', 'recipe_tip', 'announcement']
      
      for (const postType of postTypes) {
        const request = new NextRequest('http://localhost:3000/api/feed/posts', {
          method: 'POST',
          body: JSON.stringify({
            title: `Test ${postType}`,
            content: 'Test content',
            post_type: postType
          })
        })

        const response = await feedPostsPOST(request)
        expect(response.status).toBe(201)
      }
    })
  })
})