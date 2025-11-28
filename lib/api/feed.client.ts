// Client-side Feed API Functions - Calls API routes instead of direct DB access
import type { FeedPost, FeedPostWithAuthor, FeedComment, FeedCommentWithAuthor } from '../database-types'

/**
 * Get feed posts with pagination
 * Calls GET /api/feed/posts
 */
export async function getFeedPosts(
  page = 0,
  limit = 20,
  userId?: string
): Promise<{ posts: FeedPostWithAuthor[]; hasMore: boolean }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (userId) {
    params.append('userId', userId)
  }

  const response = await fetch(`/api/feed/posts?${params}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch feed posts')
  }

  return response.json()
}

/**
 * Create a new feed post
 * Calls POST /api/feed/posts
 */
export async function createFeedPost(post: {
  title: string
  content: string
  post_type: 'meal_plan' | 'recipe_tip' | 'announcement'
  image_url?: string
  related_meal_plan_id?: string
  tags?: string[]
}): Promise<FeedPost> {
  // Get auth token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch('/api/feed/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(post),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create feed post')
  }

  return response.json()
}

/**
 * Like/unlike a post
 * Calls POST /api/feed/posts/[id]/like
 */
export async function togglePostLike(postId: string): Promise<{ liked: boolean }> {
  const response = await fetch(`/api/feed/posts/${postId}/like`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to toggle like')
  }

  return response.json()
}

/**
 * Get comments for a post
 * Calls GET /api/feed/posts/[id]/comments
 */
export async function getPostComments(
  postId: string,
  userId?: string
): Promise<FeedCommentWithAuthor[]> {
  const params = new URLSearchParams()
  if (userId) {
    params.append('userId', userId)
  }

  const url = `/api/feed/posts/${postId}/comments${userId ? `?${params}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch comments')
  }

  return response.json()
}

/**
 * Add a comment to a post
 * Calls POST /api/feed/posts/[id]/comments
 */
export async function addComment(postId: string, content: string): Promise<FeedComment> {
  const response = await fetch(`/api/feed/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add comment')
  }

  return response.json()
}

/**
 * Record a share
 * Note: This needs an API route to be created
 */
export async function recordShare(postId: string, platform = 'copy_link'): Promise<void> {
  // For now, making a simple call - you may want to create /api/feed/posts/[id]/share route
  const response = await fetch(`/api/feed/posts/${postId}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ platform }),
  })

  if (!response.ok) {
    // Silently fail for share tracking
    console.error('Failed to record share')
  }
}
