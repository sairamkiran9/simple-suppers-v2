-- Feed Feature - Database Triggers and Functions
-- Auto-update engagement counts and timestamps

-- Generic function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to feed tables
CREATE TRIGGER update_feed_posts_updated_at
  BEFORE UPDATE ON feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feed_comments_updated_at
  BEFORE UPDATE ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Increment likes_count when a like is added
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feed_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_like_added
  AFTER INSERT ON feed_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_likes();

-- Decrement likes_count when a like is removed
CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feed_posts
  SET likes_count = likes_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_like_removed
  AFTER DELETE ON feed_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_post_likes();

-- Increment comments_count when a comment is added
CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feed_posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comment_added
  AFTER INSERT ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_comments();

-- Decrement comments_count when a comment is removed
CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feed_posts
  SET comments_count = comments_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comment_removed
  AFTER DELETE ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION decrement_post_comments();

-- Increment comment likes_count
CREATE OR REPLACE FUNCTION increment_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feed_comments
  SET likes_count = likes_count + 1
  WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_like_added
  AFTER INSERT ON feed_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_comment_likes();

-- Decrement comment likes_count
CREATE OR REPLACE FUNCTION decrement_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feed_comments
  SET likes_count = likes_count - 1
  WHERE id = OLD.comment_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_like_removed
  AFTER DELETE ON feed_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_comment_likes();