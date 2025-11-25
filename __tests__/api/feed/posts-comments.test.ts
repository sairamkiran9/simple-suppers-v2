import { NextRequest } from 'next/server'
import { GET as getComments, POST as addCommentPOST } from '@/app/api/feed/posts/[id]/comments/route'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    }
  },
  supabaseAdmin: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}))

// Mock feed API functions
jest.mock('@/lib/api/feed.server', () => ({
  getPostComments: jest.fn(),
  addComment: jest.fn()
}))

describe('/api/feed/posts/[id]/comments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/feed/posts/[id]/comments', () => {
    it('should get comments without authentication', async () => {
      const { getPostComments } = require('@/lib/api/feed.server')
      const { supabase } = require('@/lib/supabase')
      
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      const mockComments = [
        {
          id: 'comment-1',
          content: 'Great post!',
          author: { id: 'user-1', name: 'John Doe' },
          user_has_liked: false
        }
      ]

      getPostComments.mockResolvedValue(mockComments)

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments')
      const response = await getComments(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockComments)
      expect(getPostComments).toHaveBeenCalledWith('post-1', undefined)
    })

    it('should get comments with user authentication', async () => {
      const { getPostComments } = require('@/lib/api/feed.server')

      const mockComments = [
        {
          id: 'comment-1',
          content: 'Great post!',
          author: { id: 'user-1', name: 'John Doe' },
          user_has_liked: true
        }
      ]

      getPostComments.mockResolvedValue(mockComments)

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments', {
        headers: { authorization: 'Bearer valid-token' }
      })
      const response = await getComments(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockComments)
      expect(getPostComments).toHaveBeenCalledWith('post-1', undefined)
    })

    it('should handle API errors when getting comments', async () => {
      const { getPostComments } = require('@/lib/api/feed.server')
      
      getPostComments.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments')
      const response = await getComments(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch comments')
    })

    it('should handle invalid authorization header', async () => {
      const { getPostComments } = require('@/lib/api/feed.server')
      const { supabase } = require('@/lib/supabase')
      
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      getPostComments.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments', {
        headers: { authorization: 'Invalid header' }
      })
      const response = await getComments(request, { params: { id: 'post-1' } })

      expect(response.status).toBe(200)
      expect(getPostComments).toHaveBeenCalledWith('post-1', undefined)
    })
  })

  describe('POST /api/feed/posts/[id]/comments', () => {
    it('should add a comment successfully', async () => {
      const { addComment } = require('@/lib/api/feed.server')
      const { supabaseAdmin } = require('@/lib/supabase')
      
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
      
      const mockComment = {
        id: 'comment-1',
        content: 'Great recipe!',
        post_id: 'post-1',
        user_id: 'user-123',
        created_at: new Date().toISOString()
      }

      addComment.mockResolvedValue(mockComment)

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Great recipe!'
        })
      })

      const response = await addCommentPOST(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockComment)
      expect(addComment).toHaveBeenCalledWith('post-1', 'Great recipe!')
    })

    it('should validate required content field', async () => {
      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await addCommentPOST(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Content is required')
    })

    it('should handle empty content', async () => {
      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments', {
        method: 'POST',
        body: JSON.stringify({
          content: ''
        })
      })

      const response = await addCommentPOST(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Content is required')
    })

    it('should handle authentication errors', async () => {
      const { addComment } = require('@/lib/api/feed.server')
      
      addComment.mockRejectedValue(new Error('Not authenticated'))

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Great recipe!'
        })
      })

      const response = await addCommentPOST(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to add comment')
    })

    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await addCommentPOST(request, { params: { id: 'post-1' } })

      expect(response.status).toBe(500)
    })

    it('should handle long comments', async () => {
      const { addComment } = require('@/lib/api/feed.server')
      const { supabaseAdmin } = require('@/lib/supabase')
      
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
      
      const longContent = 'A'.repeat(1000)
      const mockComment = {
        id: 'comment-1',
        content: longContent,
        post_id: 'post-1',
        user_id: 'user-123'
      }

      addComment.mockResolvedValue(mockComment)

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments', {
        method: 'POST',
        body: JSON.stringify({
          content: longContent
        })
      })

      const response = await addCommentPOST(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.content).toBe(longContent)
    })

    it('should handle database errors gracefully', async () => {
      const { addComment } = require('@/lib/api/feed.server')
      
      addComment.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/comments', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Great recipe!'
        })
      })

      const response = await addCommentPOST(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to add comment')
    })
  })
})