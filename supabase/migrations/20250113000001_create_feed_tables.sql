-- Feed Feature - Database Tables Migration
-- Creates all tables needed for the social feed functionality

-- 1. Feed posts table
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Author information
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('user', 'provider', 'admin')),

  -- Post content
  post_type VARCHAR(30) NOT NULL CHECK (post_type IN ('meal_plan', 'recipe_tip', 'announcement')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(500),

  -- Related entities
  related_meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,

  -- Engagement metrics (denormalized for performance)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  -- Post metadata
  tags TEXT[], -- Array of tags like ['quick', 'healthy', 'keto']
  is_pinned BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Status flags
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for feed_posts
CREATE INDEX idx_feed_posts_author ON feed_posts(author_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_feed_posts_type ON feed_posts(post_type) WHERE is_deleted = FALSE;
CREATE INDEX idx_feed_posts_published ON feed_posts(published_at DESC) WHERE is_active = TRUE AND is_deleted = FALSE;
CREATE INDEX idx_feed_posts_meal_plan ON feed_posts(related_meal_plan_id) WHERE related_meal_plan_id IS NOT NULL;
CREATE INDEX idx_feed_posts_tags ON feed_posts USING GIN(tags);

-- 2. Feed likes table
CREATE TABLE feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one like per user per post
  UNIQUE(post_id, user_id)
);

-- Indexes for feed_likes
CREATE INDEX idx_feed_likes_post ON feed_likes(post_id);
CREATE INDEX idx_feed_likes_user ON feed_likes(user_id);

-- 3. Feed comments table
CREATE TABLE feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  -- Nested comments (replies)
  parent_comment_id UUID REFERENCES feed_comments(id) ON DELETE CASCADE,

  -- Engagement
  likes_count INTEGER DEFAULT 0,

  -- Status
  is_deleted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for feed_comments
CREATE INDEX idx_feed_comments_post ON feed_comments(post_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_feed_comments_user ON feed_comments(user_id);
CREATE INDEX idx_feed_comments_parent ON feed_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_feed_comments_created ON feed_comments(created_at DESC);

-- 4. Feed comment likes table
CREATE TABLE feed_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  comment_id UUID NOT NULL REFERENCES feed_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(comment_id, user_id)
);

-- Indexes for feed_comment_likes
CREATE INDEX idx_feed_comment_likes_comment ON feed_comment_likes(comment_id);
CREATE INDEX idx_feed_comment_likes_user ON feed_comment_likes(user_id);

-- 5. Feed follows table
CREATE TABLE feed_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  follower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_provider_id UUID NOT NULL REFERENCES meal_plan_providers(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique follows
  UNIQUE(follower_user_id, following_provider_id)
);

-- Indexes for feed_follows
CREATE INDEX idx_feed_follows_follower ON feed_follows(follower_user_id);
CREATE INDEX idx_feed_follows_following ON feed_follows(following_provider_id);

-- 6. Feed shares table
CREATE TABLE feed_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous shares

  share_platform VARCHAR(50), -- 'copy_link', 'facebook', 'twitter', etc.

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for feed_shares
CREATE INDEX idx_feed_shares_post ON feed_shares(post_id);
CREATE INDEX idx_feed_shares_user ON feed_shares(user_id) WHERE user_id IS NOT NULL;