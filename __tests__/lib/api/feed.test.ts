import { 
  getFeedPosts, 
  createFeedPost, 
  togglePostLike, 
  getPostComments, 
  addComment,
  toggleProviderFollow,
  getTrendingProviders,
  recordShare
} from '@/lib/api/feed'

// Create chainable mock for Supabase
const createChainableMock = () => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis()
})

const createDeleteMock = () => ({
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ error: null })
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

describe('Feed API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFeedPosts', () => {
    it('should fetch posts with pagination', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      const mockChain = createChainableMock()
      
      mockChain.range.mockResolvedValue({
        data: [
          {
            id: 'post-1',
            title: 'Test Post',
            content: 'Test content',
            author_id: 'user-1',
            post_type: 'recipe_tip'
          }
        ],
        error: null
      })
      
      supabaseAdmin.from.mockReturnValue(mockChain)

      const result = await getFeedPosts(0, 10)

      expect(result.posts).toHaveLength(1)
      expect(result.posts[0].author.name).toBe('Sample Provider')
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false)
      expect(mockChain.range).toHaveBeenCalledWith(0, 10)
    })

    it('should handle database errors', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      const mockChain = createChainableMock()
      
      const error = new Error('Database error')
      mockChain.range.mockResolvedValue({
        data: null,
        error
      })
      
      supabaseAdmin.from.mockReturnValue(mockChain)

      await expect(getFeedPosts()).rejects.toThrow(error)
    })
  })

  describe('createFeedPost', () => {
    it('should create a new post when authenticated', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      const mockChain = createChainableMock()
      
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
      
      mockChain.single.mockResolvedValue({
        data: { user_type: 'provider' },
        error: null
      })
      
      mockChain.select.mockReturnValue(mockChain)
      
      const insertMock = createChainableMock()
      insertMock.single.mockResolvedValue({
        data: {
          id: 'post-1',
          title: 'New Post',
          content: 'Content',
          author_id: 'user-123'
        },
        error: null
      })
      
      supabaseAdmin.from
        .mockReturnValueOnce(mockChain) // First call for user lookup
        .mockReturnValueOnce(insertMock) // Second call for insert

      const result = await createFeedPost({
        title: 'New Post',
        content: 'Content',
        post_type: 'recipe_tip'
      })

      expect(result.id).toBe('post-1')
      expect(insertMock.insert).toHaveBeenCalledWith({
        author_id: 'user-123',
        author_type: 'provider',
        title: 'New Post',
        content: 'Content',
        post_type: 'recipe_tip'
      })
    })

    it('should throw error when not authenticated', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      await expect(createFeedPost({
        title: 'Test',
        content: 'Test',
        post_type: 'recipe_tip'
      })).rejects.toThrow('Not authenticated')
    })
  })

  describe('togglePostLike', () => {
    it('should like a post when not already liked', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const selectMock = createChainableMock()
      selectMock.single.mockResolvedValue({
        data: null,
        error: null
      })

      const insertMock = createChainableMock()
      insertMock.insert.mockResolvedValue({
        error: null
      })

      supabaseAdmin.from
        .mockReturnValueOnce(selectMock)
        .mockReturnValueOnce(insertMock)

      const result = await togglePostLike('post-1')

      expect(result.liked).toBe(true)
      expect(insertMock.insert).toHaveBeenCalledWith({
        post_id: 'post-1',
        user_id: 'user-123'
      })
    })

    it('should unlike a post when already liked', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const selectMock = createChainableMock()
      selectMock.single.mockResolvedValue({
        data: { id: 'like-1' },
        error: null
      })

      const deleteMock = createDeleteMock()

      supabaseAdmin.from
        .mockReturnValueOnce(selectMock)
        .mockReturnValueOnce(deleteMock)

      const result = await togglePostLike('post-1')

      expect(result.liked).toBe(false)
      expect(deleteMock.eq).toHaveBeenCalledWith('id', 'like-1')
    })
  })

  describe('getPostComments', () => {
    it('should fetch comments for a post', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      const mockChain = createChainableMock()
      
      mockChain.order.mockResolvedValue({
        data: [
          {
            id: 'comment-1',
            content: 'Great post!',
            author: { id: 'user-1', name: 'John Doe' }
          }
        ],
        error: null
      })
      
      supabaseAdmin.from.mockReturnValue(mockChain)

      const result = await getPostComments('post-1')

      expect(result).toHaveLength(1)
      expect(result[0].content).toBe('Great post!')
      expect(mockChain.eq).toHaveBeenCalledWith('post_id', 'post-1')
    })
  })

  describe('addComment', () => {
    it('should add a comment when authenticated', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValue({
        data: {
          id: 'comment-1',
          content: 'New comment',
          post_id: 'post-1',
          user_id: 'user-123'
        },
        error: null
      })

      supabaseAdmin.from.mockReturnValue(mockChain)

      const result = await addComment('post-1', 'New comment')

      expect(result.content).toBe('New comment')
      expect(mockChain.insert).toHaveBeenCalledWith({
        post_id: 'post-1',
        user_id: 'user-123',
        content: 'New comment'
      })
    })
  })

  describe('toggleProviderFollow', () => {
    it('should follow a provider when not already following', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const selectMock = createChainableMock()
      selectMock.single.mockResolvedValue({
        data: null,
        error: null
      })

      const insertMock = createChainableMock()
      insertMock.insert.mockResolvedValue({
        error: null
      })

      supabaseAdmin.from
        .mockReturnValueOnce(selectMock)
        .mockReturnValueOnce(insertMock)

      const result = await toggleProviderFollow('provider-1')

      expect(result.following).toBe(true)
    })
  })

  describe('getTrendingProviders', () => {
    it('should fetch trending providers', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      const mockChain = createChainableMock()
      
      mockChain.limit.mockResolvedValue({
        data: [
          {
            id: 'provider-1',
            business_name: 'Test Kitchen',
            total_plans: 10,
            average_rating: 4.5
          }
        ],
        error: null
      })
      
      supabaseAdmin.from.mockReturnValue(mockChain)

      const result = await getTrendingProviders(5)

      expect(result).toHaveLength(1)
      expect(result[0].business_name).toBe('Test Kitchen')
      expect(mockChain.limit).toHaveBeenCalledWith(5)
    })
  })

  describe('recordShare', () => {
    it('should record a share event', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const mockChain = createChainableMock()
      mockChain.insert.mockResolvedValue({
        error: null
      })

      supabaseAdmin.from.mockReturnValue(mockChain)

      await recordShare('post-1', 'twitter')

      expect(mockChain.insert).toHaveBeenCalledWith({
        post_id: 'post-1',
        user_id: 'user-123',
        share_platform: 'twitter'
      })
    })

    it('should record share without user when not authenticated', async () => {
      const { supabaseAdmin } = require('@/lib/supabase')
      
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      const mockChain = createChainableMock()
      mockChain.insert.mockResolvedValue({
        error: null
      })

      supabaseAdmin.from.mockReturnValue(mockChain)

      await recordShare('post-1')

      expect(mockChain.insert).toHaveBeenCalledWith({
        post_id: 'post-1',
        user_id: null,
        share_platform: 'copy_link'
      })
    })
  })
})