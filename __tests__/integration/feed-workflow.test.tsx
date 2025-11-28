import { render, screen, waitFor, within } from '@testing-library/react'
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
jest.mock('@/lib/api/feed.client', () => ({
  togglePostLike: jest.fn(),
  addComment: jest.fn(),
  recordShare: jest.fn()
}))

// Mock auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn()
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Mock clipboard API - must resolve successfully
const mockWriteText = jest.fn(() => Promise.resolve())
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
    readText: jest.fn()
  },
  writable: true,
  configurable: true
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000'
  },
  writable: true
})

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
        creator_display_name: 'Maria\'s Kitchen',
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
        creator_display_name: 'Family Meals Co',
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
    mockWriteText.mockClear()
  })

  it('should display feed posts and handle like interaction', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useCreateFeedPost } = require('@/hooks/useCreateFeedPost')
    const { useAuth } = require('@/lib/auth-context')
    const { togglePostLike } = require('@/lib/api/feed.client')

    // Mock authenticated user
    useAuth.mockReturnValue({
      user: { id: 'user-123', name: 'Test User', user_type: 'user' },
      isLoading: false,
      isAuthenticated: true
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

    // Mock create post hook (Feed component includes CreatePostModal)
    useCreateFeedPost.mockReturnValue({
      createPost: jest.fn(),
      loading: false,
      error: null
    })

    // Mock API responses
    togglePostLike.mockResolvedValue({ liked: true })

    render(<Feed />)

    // Verify posts are displayed
    expect(screen.getByText('Delicious Pasta Recipe')).toBeInTheDocument()
    expect(screen.getByText('Weekly Meal Plan Available')).toBeInTheDocument()

    // Find all article elements (posts)
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(2)

    // Find like button in first post
    // Button order: MoreHorizontal (0), Like (1), Comment (2), Share dropdown (3)
    const firstPost = articles[0]
    const buttons = within(firstPost).getAllByRole('button')
    const likeButton = buttons[1]

    await userEvent.click(likeButton)

    await waitFor(() => {
      expect(togglePostLike).toHaveBeenCalledWith('post-1')
    })
  })

  it('should handle post creation workflow', async () => {
    const { useCreateFeedPost } = require('@/hooks/useCreateFeedPost')
    const { useAuth } = require('@/lib/auth-context')

    const mockCreatePost = jest.fn().mockResolvedValue({
      id: 'new-post-1',
      title: 'New Recipe',
      content: 'Amazing new dish!'
    })

    // Mock authenticated provider
    useAuth.mockReturnValue({
      user: { id: 'provider-1', name: 'Chef Maria', user_type: 'provider' },
      isLoading: false,
      isAuthenticated: true
    })

    // Mock create post hook - must be set BEFORE render
    useCreateFeedPost.mockReturnValue({
      createPost: mockCreatePost,
      loading: false,
      error: null
    })

    const mockOnClose = jest.fn()
    const mockOnPostCreated = jest.fn()

    render(
      <CreatePostModal
        open={true}
        onClose={mockOnClose}
        onPostCreated={mockOnPostCreated}
      />
    )

    // Fill out the form - title and content
    const titleInput = screen.getByPlaceholderText(/enter post title/i)
    const contentInput = screen.getByPlaceholderText(/share your thoughts/i)

    await userEvent.type(titleInput, 'New Recipe')
    await userEvent.type(contentInput, 'Amazing new dish!')

    // Post type defaults to 'recipe_tip', so no need to change

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create post/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith({
        title: 'New Recipe',
        content: 'Amazing new dish!',
        post_type: 'recipe_tip',
        image_url: undefined,
        tags: []
      })
    })

    await waitFor(() => {
      expect(mockOnPostCreated).toHaveBeenCalled()
    })
  })

  it('should handle unauthenticated user interactions', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useCreateFeedPost } = require('@/hooks/useCreateFeedPost')
    const { useAuth } = require('@/lib/auth-context')
    const { togglePostLike } = require('@/lib/api/feed.client')
    const { toast } = require('sonner')

    // Mock unauthenticated user
    useAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false
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

    // Mock create post hook (Feed component includes CreatePostModal)
    useCreateFeedPost.mockReturnValue({
      createPost: jest.fn(),
      loading: false,
      error: null
    })

    render(<Feed />)

    // Verify posts are displayed
    expect(screen.getByText('Delicious Pasta Recipe')).toBeInTheDocument()

    // Find like button in first post
    // Button order: MoreHorizontal (0), Like (1), Comment (2), Share dropdown (3)
    const articles = screen.getAllByRole('article')
    const firstPost = articles[0]
    const buttons = within(firstPost).getAllByRole('button')
    const likeButton = buttons[1]

    await userEvent.click(likeButton)

    // Should show toast error instead of making API call
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please sign in to like posts')
    })

    // API should NOT be called for unauthenticated users
    expect(togglePostLike).not.toHaveBeenCalled()
  })

  it('should handle loading states', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useCreateFeedPost } = require('@/hooks/useCreateFeedPost')
    const { useAuth } = require('@/lib/auth-context')

    useAuth.mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      isLoading: false,
      isAuthenticated: true
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

    // Mock create post hook
    useCreateFeedPost.mockReturnValue({
      createPost: jest.fn(),
      loading: false,
      error: null
    })

    const { container } = render(<Feed />)

    // Should show skeleton loading indicators (divs with animate-pulse class)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should handle error states', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useCreateFeedPost } = require('@/hooks/useCreateFeedPost')
    const { useAuth } = require('@/lib/auth-context')

    useAuth.mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      isLoading: false,
      isAuthenticated: true
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

    // Mock create post hook
    useCreateFeedPost.mockReturnValue({
      createPost: jest.fn(),
      loading: false,
      error: null
    })

    render(<Feed />)

    // Should show error message
    expect(screen.getByText(/failed to load posts/i)).toBeInTheDocument()

    // Should show retry button
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('should handle infinite scroll', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useCreateFeedPost } = require('@/hooks/useCreateFeedPost')
    const { useAuth } = require('@/lib/auth-context')

    const mockLoadMore = jest.fn()

    useAuth.mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      isLoading: false,
      isAuthenticated: true
    })

    useFeedPosts.mockReturnValue({
      posts: mockPosts,
      loading: false,
      error: null,
      hasMore: true,
      loadMore: mockLoadMore,
      refresh: jest.fn()
    })

    // Mock create post hook
    useCreateFeedPost.mockReturnValue({
      createPost: jest.fn(),
      loading: false,
      error: null
    })

    render(<Feed />)

    // Should show load more button when hasMore is true
    const loadMoreButton = screen.getByRole('button', { name: /load more/i })
    await userEvent.click(loadMoreButton)

    expect(mockLoadMore).toHaveBeenCalled()
  })

  it('should handle share functionality', async () => {
    const { useFeedPosts } = require('@/hooks/useFeedPosts')
    const { useCreateFeedPost } = require('@/hooks/useCreateFeedPost')
    const { useAuth } = require('@/lib/auth-context')
    const { recordShare } = require('@/lib/api/feed.client')
    const { toast } = require('sonner')

    useAuth.mockReturnValue({
      user: { id: 'user-123', name: 'Test User' },
      isLoading: false,
      isAuthenticated: true
    })

    useFeedPosts.mockReturnValue({
      posts: mockPosts,
      loading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn()
    })

    // Mock create post hook
    useCreateFeedPost.mockReturnValue({
      createPost: jest.fn(),
      loading: false,
      error: null
    })

    recordShare.mockResolvedValue(undefined)

    render(<Feed />)

    // Find share dropdown button in first post
    // Button order: MoreHorizontal (0), Like (1), Comment (2), Share dropdown (3)
    const articles = screen.getAllByRole('article')
    const firstPost = articles[0]
    const buttons = within(firstPost).getAllByRole('button')
    const shareDropdownButton = buttons[3]

    // Click to open dropdown
    await userEvent.click(shareDropdownButton)

    // Click "Copy Link" menu item
    const copyLinkOption = await screen.findByText('Copy Link')
    await userEvent.click(copyLinkOption)

    // Should record the share and show success toast
    await waitFor(() => {
      expect(recordShare).toHaveBeenCalledWith('post-1', 'copy_link')
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!')
    })
  })
})
