// Feed API Client Functions
import { supabaseAdmin } from '../supabase'
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
    const { data: posts, error } = await supabaseAdmin
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
        name: 'Sample Creator',
        email: 'creator@example.com',
        user_type: 'user' as const,
        is_creator: true,
        creator_display_name: 'Sample Kitchen',
        creator_profile_image_url: null,
        creator_bio: 'Delicious meals for everyone',
        is_verified: false,
        creator_tier: null
      },
      meal_plan: undefined,
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
  const { data: { user } } = await supabaseAdmin.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get user type to set author_type
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabaseAdmin
    .from('feed_posts')
    .insert({
      author_id: user.id,
      author_type: (userData?.user_type as 'user' | 'provider' | 'admin') || 'user',
      ...post
    })
    .select()
    .single()

  if (error) throw error
  return data as FeedPost
}

// Like/unlike a post
export async function togglePostLike(postId: string): Promise<{ liked: boolean }> {
  const { data: { user } } = await supabaseAdmin.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if already liked
  const { data: existingLike } = await supabaseAdmin
    .from('feed_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    // Unlike
    const { error } = await supabaseAdmin
      .from('feed_likes')
      .delete()
      .eq('id', existingLike.id)
    
    if (error) throw error
    return { liked: false }
  } else {
    // Like
    const { error } = await supabaseAdmin
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
  const { data: comments, error } = await supabaseAdmin
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
        const { data: like } = await supabaseAdmin
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
  const { data: { user } } = await supabaseAdmin.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabaseAdmin
    .from('feed_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content
    })
    .select()
    .single()

  if (error) throw error
  return data as FeedComment
}

// Follow/unfollow a provider
export async function toggleProviderFollow(providerId: string): Promise<{ following: boolean }> {
  const { data: { user } } = await supabaseAdmin.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if already following
  const { data: existingFollow } = await supabaseAdmin
    .from('feed_follows')
    .select('id')
    .eq('follower_user_id', user.id)
    .eq('following_provider_id', providerId)
    .single()

  if (existingFollow) {
    // Unfollow
    const { error } = await supabaseAdmin
      .from('feed_follows')
      .delete()
      .eq('id', existingFollow.id)
    
    if (error) throw error
    return { following: false }
  } else {
    // Follow
    const { error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      name,
      creator_display_name,
      creator_profile_image_url,
      creator_bio,
      total_meal_plans_created,
      creator_rating,
      follower_count:feed_follows(count)
    `)
    .eq('is_creator', true)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('total_meal_plans_created', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Record a share
export async function recordShare(postId: string, platform = 'copy_link'): Promise<void> {
  const { data: { user } } = await supabaseAdmin.auth.getUser()

  const { error } = await supabaseAdmin
    .from('feed_shares')
    .insert({
      post_id: postId,
      user_id: user?.id || null,
      share_platform: platform
    })

  if (error) throw error
}