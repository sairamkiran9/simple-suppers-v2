import { NextRequest } from 'next/server'
import { POST as toggleLikePOST } from '@/app/api/feed/posts/[id]/like/route'

// Mock feed API functions
jest.mock('@/lib/api/feed', () => ({
  togglePostLike: jest.fn()
}))

describe('/api/feed/posts/[id]/like', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/feed/posts/[id]/like', () => {
    it('should toggle like successfully', async () => {
      const { togglePostLike } = require('@/lib/api/feed')
      
      togglePostLike.mockResolvedValue({ liked: true })

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/like', {
        method: 'POST'
      })

      const response = await toggleLikePOST(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.liked).toBe(true)
      expect(togglePostLike).toHaveBeenCalledWith('post-1')
    })

    it('should handle unlike operation', async () => {
      const { togglePostLike } = require('@/lib/api/feed')
      
      togglePostLike.mockResolvedValue({ liked: false })

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/like', {
        method: 'POST'
      })

      const response = await toggleLikePOST(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.liked).toBe(false)
    })

    it('should handle authentication errors', async () => {
      const { togglePostLike } = require('@/lib/api/feed')
      
      togglePostLike.mockRejectedValue(new Error('Not authenticated'))

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/like', {
        method: 'POST'
      })

      const response = await toggleLikePOST(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to toggle like')
    })

    it('should handle invalid post ID', async () => {
      const { togglePostLike } = require('@/lib/api/feed')
      
      togglePostLike.mockRejectedValue(new Error('Post not found'))

      const request = new NextRequest('http://localhost:3000/api/feed/posts/invalid-id/like', {
        method: 'POST'
      })

      const response = await toggleLikePOST(request, { params: { id: 'invalid-id' } })

      expect(response.status).toBe(500)
    })

    it('should handle database errors gracefully', async () => {
      const { togglePostLike } = require('@/lib/api/feed')
      
      togglePostLike.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/feed/posts/post-1/like', {
        method: 'POST'
      })

      const response = await toggleLikePOST(request, { params: { id: 'post-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to toggle like')
    })
  })
})