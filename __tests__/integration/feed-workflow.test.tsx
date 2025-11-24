import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Feed } from '@/components/Feed'
import { CreatePostModal } from '@/components/CreatePostModal'

// Mock the hooks
jest.mock('@/hooks/useFeedPosts', () => ({
  useFeedPosts: jest.fn()
}))

jest.mock('@/hooks/useCreateFeedPost', () => ({
  useCreateFeedPost: jest.fn()
}))

// Mock the feed API
jest.mock('@/lib/api/feed', () => ({
  togglePostLike: jest.fn(),
  addComment: jest.fn(),
  recordShare: jest.fn()
}))

// Mock auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn()
}))

describe('Feed Workflow Integration', () => {
  const mockPosts = [
    {
      id: 'post-1',
      title: 'Delicious Pasta Recipe',
      content: 'Try this amazing pasta dish that takes only 20 minutes!',
      post_type: 'recipe_tip',
      author: {
        id: 'provider-1',
        name: 'Chef Maria',
        email: 'maria@example.com',
        user_type: 'provider'
      },
      provider: {
        id: 'provider-1',
        business_name: 'Maria\'s Kitchen',
        profile_image_url: null,
        bio: 'Authentic Italian recipes'
      },
      likes_count: 15,
      comments_count: 3,
      shares_count: 2,
      user_has_liked: false,
      user_is_following: false,
      published_at: new Date().toISOString(),
      image_url: 'https://example.com/pasta.jpg',
      tags: ['pasta', 'quick', 'italian']
    },
    {
      id: 'post-2',
      title: 'Weekly Meal Plan Available',
      content: 'Check out our new family-friendly meal plan for this week!',
      post_type: 'meal_plan',
      author: {
        id: 'provider-2',
        name: 'Chef John',
        email: 'john@example.com',
        user_type: 'provider'
      },
      provider: {
        id: 'provider-2',
        business_name: 'Family Meals Co',
        profile_image_url: null,
        bio: 'Healthy family meals'
      },
      likes_count: 8,
      comments_count: 1,
      shares_count: 0,
      user_has_liked: true,
      user_is_following: true,
      published_at: new Date().toISOString(),
      related_meal_plan_id: 'plan-123',
      tags: ['family', 'healthy']
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display feed posts and handle interactions', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useAuth } = require('@/lib/auth-context')
    const { togglePostLike, addComment } = require('@/lib/api/feed')

    // Mock authenticated user
    useAuth.mockReturnValue({
      user: { id: 'user-123', name: 'Test User', user_type: 'user' },
      loading: false
    })

    // Mock feed posts hook
    useFeedPosts.mockReturnValue({
      posts: mockPosts,
      loading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn()
    })

    // Mock API responses
    togglePostLike.mockResolvedValue({ liked: true })
    addComment.mockResolvedValue({
      id: 'comment-1',
      content: 'Great recipe!',
      user_id: 'user-123',
      post_id: 'post-1'
    })

    render(<Feed />)

    // Verify posts are displayed
    expect(screen.getByText('Delicious Pasta Recipe')).toBeInTheDocument()
    expect(screen.getByText('Weekly Meal Plan Available')).toBeInTheDocument()

    // Test like functionality
    const likeButtons = screen.getAllByRole('button', { name: /like/i })
    await userEvent.click(likeButtons[0])

    await waitFor(() => {
      expect(togglePostLike).toHaveBeenCalledWith('post-1')
    })

    // Test comment functionality
    const commentButtons = screen.getAllByRole('button', { name: /comment/i })
    await userEvent.click(commentButtons[0])

    // Should show comment form
    const commentInput = screen.getByPlaceholderText(/add a comment/i)
    await userEvent.type(commentInput, 'Great recipe!')

    const submitButton = screen.getByRole('button', { name: /post comment/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(addComment).toHaveBeenCalledWith('post-1', 'Great recipe!')
    })
  })

  it('should handle post creation workflow', async () => {
    const { useCreateFeedPost } = require('@/hooks/useCreateFeedPost')
    const { useAuth } = require('@/lib/auth-context')

    const mockCreatePost = jest.fn()

    // Mock authenticated provider
    useAuth.mockReturnValue({
      user: { id: 'provider-1', name: 'Chef Maria', user_type: 'provider' },
      loading: false
    })

    // Mock create post hook
    useCreateFeedPost.mockReturnValue({
      createPost: mockCreatePost,
      loading: false,
      error: null
    })

    mockCreatePost.mockResolvedValue({
      id: 'new-post-1',
      title: 'New Recipe',
      content: 'Amazing new dish!'
    })

    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()

    render(
      <CreatePostModal 
        isOpen={true} 
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Fill out the form
    const titleInput = screen.getByLabelText(/title/i)
    const contentInput = screen.getByLabelText(/content/i)
    const typeSelect = screen.getByLabelText(/post type/i)

    await userEvent.type(titleInput, 'New Recipe')
    await userEvent.type(contentInput, 'Amazing new dish!')
    await userEvent.selectOptions(typeSelect, 'recipe_tip')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create post/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith({
        title: 'New Recipe',
        content: 'Amazing new dish!',
        post_type: 'recipe_tip',
        image_url: undefined,
        related_meal_plan_id: undefined,
        tags: undefined
      })
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should handle unauthenticated user interactions', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useAuth } = require('@/lib/auth-context')

    // Mock unauthenticated user
    useAuth.mockReturnValue({
      user: null,
      loading: false
    })

    // Mock feed posts hook
    useFeedPosts.mockReturnValue({
      posts: mockPosts,
      loading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn()
    })

    render(<Feed />)

    // Verify posts are displayed
    expect(screen.getByText('Delicious Pasta Recipe')).toBeInTheDocument()

    // Like buttons should show login prompt for unauthenticated users
    const likeButtons = screen.getAllByRole('button', { name: /like/i })
    await userEvent.click(likeButtons[0])

    // Should show login prompt instead of making API call
    expect(screen.getByText(/sign in to like posts/i)).toBeInTheDocument()
  })

  it('should handle loading states', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useAuth } = require('@/lib/auth-context')

    useAuth.mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      loading: false
    })

    // Mock loading state
    useFeedPosts.mockReturnValue({
      posts: [],
      loading: true,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn()
    })

    render(<Feed />)

    // Should show loading indicators
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should handle error states', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useAuth } = require('@/lib/auth-context')

    useAuth.mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      loading: false
    })

    // Mock error state
    useFeedPosts.mockReturnValue({
      posts: [],
      loading: false,
      error: 'Failed to load posts',
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn()
    })

    render(<Feed />)

    // Should show error message
    expect(screen.getByText(/failed to load posts/i)).toBeInTheDocument()
  })

  it('should handle infinite scroll', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useAuth } = require('@/lib/auth-context')

    const mockLoadMore = jest.fn()

    useAuth.mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      loading: false
    })

    useFeedPosts.mockReturnValue({
      posts: mockPosts,
      loading: false,
      error: null,
      hasMore: true,
      loadMore: mockLoadMore,
      refresh: jest.fn()
    })

    render(<Feed />)

    // Should show load more button when hasMore is true
    const loadMoreButton = screen.getByRole('button', { name: /load more/i })
    await userEvent.click(loadMoreButton)

    expect(mockLoadMore).toHaveBeenCalled()
  })

  it('should handle share functionality', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useAuth } = require('@/lib/auth-context')
    const { recordShare } = require('@/lib/api/feed')

    useAuth.mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      loading: false
    })

    useFeedPosts.mockReturnValue({
      posts: mockPosts,
      loading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn()
    })

    recordShare.mockResolvedValue(undefined)

    render(<Feed />)

    // Test share functionality
    const shareButtons = screen.getAllByRole('button', { name: /share/i })
    await userEvent.click(shareButtons[0])

    await waitFor(() => {
      expect(recordShare).toHaveBeenCalledWith('post-1', 'copy_link')
    })
  })
})