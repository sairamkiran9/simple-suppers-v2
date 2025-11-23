// Feed API Client Functions
import { supabase } from '../supabase'
import type { FeedPost, FeedPostWithAuthor, FeedComment, FeedCommentWithAuthor } from '../database-types'

// Get feed posts with pagination
export async function getFeedPosts(
  page = 0,
  limit = 20,
  userId?: string
): Promise<{ posts: FeedPostWithAuthor[]; hasMore: boolean }> {
  const offset = page * limit

  try {
    // Get basic posts first
    const { data: posts, error } = await supabase
      .from('feed_posts')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Add mock author data for now
    const postsWithUserData = (posts || []).map(post => ({
      ...post,
      author: {
        id: post.author_id,
        name: 'Sample Provider',
        email: 'provider@example.com',
        user_type: 'provider'
      },
      provider: {
        id: 'sample-provider-id',
        business_name: 'Sample Kitchen',
        profile_image_url: null,
        bio: 'Delicious meals for everyone'
      },
      meal_plan: null,
      user_has_liked: false,
      user_is_following: false
    } as FeedPostWithAuthor))

    return {
      posts: postsWithUserData,
      hasMore: posts?.length === limit + 1
    }
  } catch (error) {
    console.error('getFeedPosts error:', error)
    throw error
  }
}

// Create a new feed post
export async function createFeedPost(post: {
  title: string
  content: string
  post_type: 'meal_plan' | 'recipe_tip' | 'announcement'
  image_url?: string
  related_meal_plan_id?: string
  tags?: string[]
}): Promise<FeedPost> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get user type to set author_type
  const { data: userData } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase
    .from('feed_posts')
    .insert({
      author_id: user.id,
      author_type: userData?.user_type || 'user',
      ...post
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Like/unlike a post
export async function togglePostLike(postId: string): Promise<{ liked: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('feed_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('feed_likes')
      .delete()
      .eq('id', existingLike.id)
    
    if (error) throw error
    return { liked: false }
  } else {
    // Like
    const { error } = await supabase
      .from('feed_likes')
      .insert({
        post_id: postId,
        user_id: user.id
      })
    
    if (error) throw error
    return { liked: true }
  }
}

// Get comments for a post
export async function getPostComments(
  postId: string,
  userId?: string
): Promise<FeedCommentWithAuthor[]> {
  const { data: comments, error } = await supabase
    .from('feed_comments')
    .select(`
      *,
      author:users!user_id(id, name)
    `)
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) throw error

  // Check if user has liked comments
  const commentsWithUserData = await Promise.all(
    (comments || []).map(async (comment) => {
      let user_has_liked = false

      if (userId) {
        const { data: like } = await supabase
          .from('feed_comment_likes')
          .select('id')
          .eq('comment_id', comment.id)
          .eq('user_id', userId)
          .single()
        
        user_has_liked = !!like
      }

      return {
        ...comment,
        user_has_liked
      } as FeedCommentWithAuthor
    })
  )

  return commentsWithUserData
}

// Add a comment to a post
export async function addComment(postId: string, content: string): Promise<FeedComment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('feed_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Follow/unfollow a provider
export async function toggleProviderFollow(providerId: string): Promise<{ following: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if already following
  const { data: existingFollow } = await supabase
    .from('feed_follows')
    .select('id')
    .eq('follower_user_id', user.id)
    .eq('following_provider_id', providerId)
    .single()

  if (existingFollow) {
    // Unfollow
    const { error } = await supabase
      .from('feed_follows')
      .delete()
      .eq('id', existingFollow.id)
    
    if (error) throw error
    return { following: false }
  } else {
    // Follow
    const { error } = await supabase
      .from('feed_follows')
      .insert({
        follower_user_id: user.id,
        following_provider_id: providerId
      })
    
    if (error) throw error
    return { following: true }
  }
}

// Get trending providers
export async function getTrendingProviders(limit = 10) {
  const { data, error } = await supabase
    .from('meal_plan_providers')
    .select(`
      id,
      business_name,
      profile_image_url,
      bio,
      total_plans,
      average_rating,
      follower_count:feed_follows(count)
    `)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('total_plans', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Record a share
export async function recordShare(postId: string, platform = 'copy_link'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('feed_shares')
    .insert({
      post_id: postId,
      user_id: user?.id || null,
      share_platform: platform
    })

  if (error) throw error
}