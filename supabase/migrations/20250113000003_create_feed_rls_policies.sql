-- Feed Feature - Row Level Security Policies

-- Enable RLS on all feed tables
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_shares ENABLE ROW LEVEL SECURITY;

-- Feed Posts Policies
CREATE POLICY "Public can view published posts"
  ON feed_posts FOR SELECT
  USING (is_active = TRUE AND is_deleted = FALSE);

CREATE POLICY "Authenticated users can create posts"
  ON feed_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON feed_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON feed_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Feed Likes Policies
CREATE POLICY "Public can view likes"
  ON feed_likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can like"
  ON feed_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
  ON feed_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Feed Comments Policies
CREATE POLICY "Public can view comments"
  ON feed_comments FOR SELECT
  USING (is_deleted = FALSE);

CREATE POLICY "Authenticated users can comment"
  ON feed_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can update own comments"
  ON feed_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can delete own comments"
  ON feed_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Feed Comment Likes Policies
CREATE POLICY "Public can view comment likes"
  ON feed_comment_likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can like comments"
  ON feed_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON feed_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Feed Follows Policies
CREATE POLICY "Public can view follows"
  ON feed_follows FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can follow"
  ON feed_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can unfollow"
  ON feed_follows FOR DELETE
  USING (auth.uid() = follower_user_id);

-- Feed Shares Policies
CREATE POLICY "Public can view shares"
  ON feed_shares FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can create shares"
  ON feed_shares FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);