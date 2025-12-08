-- ============================================
-- CONSOLIDATED MIGRATION SCRIPT
-- Run this in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/abtkockywyhvfpzaqdfi/sql/new
-- ============================================
-- WARNING: This will transform your database from provider model to creator model
-- Make sure you have a backup if needed
-- ============================================

-- ============================================
-- PHASE 1: Provider to Creator Migration
-- ============================================

BEGIN;

-- Add creator columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_profile_image_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_meal_plans_created INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_rating DECIMAL(3, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_tier VARCHAR(20) CHECK (creator_tier IN ('bronze', 'silver', 'gold') OR creator_tier IS NULL);
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{}'::jsonb;

-- Migrate data from meal_plan_providers to users
UPDATE users u
SET
  is_creator = TRUE,
  creator_display_name = mpp.business_name,
  creator_bio = mpp.bio,
  creator_profile_image_url = mpp.profile_image_url,
  total_meal_plans_created = COALESCE(mpp.total_plans, 0),
  total_earnings = COALESCE(mpp.total_earnings, 0.00),
  creator_rating = COALESCE(mpp.average_rating, 0.00),
  creator_email_verified = COALESCE(mpp.email_verified, FALSE),
  updated_at = NOW()
FROM meal_plan_providers mpp
WHERE u.id = mpp.user_id;

-- Add new columns to meal_plans
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS creator_name VARCHAR(255);
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS creator_bio TEXT;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS creator_avatar_url VARCHAR(500);

-- Migrate meal_plans data
UPDATE meal_plans mp
SET
  created_by_user_id = mpp.user_id,
  creator_name = mpp.business_name,
  creator_bio = mpp.bio,
  creator_avatar_url = mpp.profile_image_url,
  updated_at = NOW()
FROM meal_plan_providers mpp
WHERE mp.provider_id = mpp.id;

-- Add new columns to user_plan_purchases
ALTER TABLE user_plan_purchases ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE user_plan_purchases ADD COLUMN IF NOT EXISTS creator_earnings DECIMAL(10, 2) DEFAULT 0.00;

-- Migrate purchases data
UPDATE user_plan_purchases upp
SET
  creator_user_id = mpp.user_id,
  creator_earnings = COALESCE(upp.provider_earnings, upp.purchase_price)
FROM meal_plan_providers mpp
WHERE upp.provider_id = mpp.id;

-- Update platform_analytics if exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_analytics') THEN
    ALTER TABLE platform_analytics ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    UPDATE platform_analytics pa
    SET creator_user_id = mpp.user_id
    FROM meal_plan_providers mpp
    WHERE pa.provider_id = mpp.id;
  END IF;
END $$;

-- Update feed_follows
ALTER TABLE feed_follows ADD COLUMN IF NOT EXISTS following_user_id UUID REFERENCES users(id) ON DELETE CASCADE;

UPDATE feed_follows ff
SET following_user_id = mpp.user_id
FROM meal_plan_providers mpp
WHERE ff.following_provider_id = mpp.id;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_is_creator ON users(is_creator) WHERE is_creator = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_creator_tier ON users(creator_tier) WHERE creator_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_creator_rating ON users(creator_rating DESC) WHERE is_creator = TRUE;
CREATE INDEX IF NOT EXISTS idx_meal_plans_created_by ON meal_plans(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_creator_user ON user_plan_purchases(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_feed_follows_user_id ON feed_follows(following_user_id);

-- Drop old columns
ALTER TABLE meal_plans DROP COLUMN IF EXISTS provider_id CASCADE;
ALTER TABLE user_plan_purchases DROP COLUMN IF EXISTS provider_id CASCADE;
ALTER TABLE user_plan_purchases DROP COLUMN IF EXISTS provider_earnings CASCADE;
ALTER TABLE feed_follows DROP COLUMN IF EXISTS following_provider_id CASCADE;
ALTER TABLE feed_posts DROP COLUMN IF EXISTS author_type CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_analytics') THEN
    ALTER TABLE platform_analytics DROP COLUMN IF EXISTS provider_id CASCADE;
  END IF;
END $$;

-- Drop meal_plan_providers table
DROP TABLE IF EXISTS meal_plan_providers CASCADE;

-- Update feed_follows constraint
ALTER TABLE feed_follows DROP CONSTRAINT IF EXISTS feed_follows_follower_user_id_following_provider_id_key;
ALTER TABLE feed_follows ADD CONSTRAINT feed_follows_follower_following_unique UNIQUE(follower_user_id, following_user_id);

COMMIT;

-- ============================================
-- PHASE 2: Update RLS Policies
-- ============================================

BEGIN;

-- Update users policies
DROP POLICY IF EXISTS users_read_creator_profiles ON users;
CREATE POLICY users_read_creator_profiles ON users
  FOR SELECT
  USING (is_creator = TRUE AND is_active = TRUE AND is_deleted = FALSE);

DROP POLICY IF EXISTS users_update_creator_profile ON users;
CREATE POLICY users_update_creator_profile ON users
  FOR UPDATE
  USING (auth.uid() = id AND is_creator = TRUE);

-- Update meal_plans policies
DROP POLICY IF EXISTS meal_plans_provider_manage ON meal_plans;
CREATE POLICY meal_plans_creator_manage ON meal_plans
  FOR ALL
  USING (
    created_by_user_id = auth.uid()
    AND created_by_user_id IN (
      SELECT id FROM users WHERE is_creator = TRUE AND is_active = TRUE AND is_deleted = FALSE
    )
  );

CREATE POLICY meal_plans_creator_insert ON meal_plans
  FOR INSERT
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_creator = TRUE AND is_active = TRUE AND is_deleted = FALSE)
  );

-- Update meal_plan_days policies
DROP POLICY IF EXISTS meal_plan_days_provider_manage ON meal_plan_days;
CREATE POLICY meal_plan_days_creator_manage ON meal_plan_days
  FOR ALL
  USING (
    meal_plan_id IN (
      SELECT mp.id FROM meal_plans mp
      WHERE mp.created_by_user_id = auth.uid()
      AND mp.created_by_user_id IN (SELECT id FROM users WHERE is_creator = TRUE AND is_active = TRUE AND is_deleted = FALSE)
    )
  );

-- Update meals policies
DROP POLICY IF EXISTS meals_provider_manage ON meals;
CREATE POLICY meals_creator_manage ON meals
  FOR ALL
  USING (
    meal_plan_day_id IN (
      SELECT mpd.id FROM meal_plan_days mpd
      JOIN meal_plans mp ON mpd.meal_plan_id = mp.id
      WHERE mp.created_by_user_id = auth.uid()
      AND mp.created_by_user_id IN (SELECT id FROM users WHERE is_creator = TRUE AND is_active = TRUE AND is_deleted = FALSE)
    )
  );

-- Update purchases policies
DROP POLICY IF EXISTS purchases_provider_select ON user_plan_purchases;
CREATE POLICY purchases_creator_select ON user_plan_purchases
  FOR SELECT
  USING (
    creator_user_id = auth.uid()
    AND creator_user_id IN (SELECT id FROM users WHERE is_creator = TRUE AND is_active = TRUE AND is_deleted = FALSE)
  );

-- Update platform_analytics policies if exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_analytics') THEN
    DROP POLICY IF EXISTS analytics_provider_own ON platform_analytics;
    CREATE POLICY analytics_creator_own ON platform_analytics
      FOR SELECT
      USING (
        creator_user_id = auth.uid()
        AND creator_user_id IN (SELECT id FROM users WHERE is_creator = TRUE AND is_active = TRUE AND is_deleted = FALSE)
      );
  END IF;
END $$;

COMMIT;

-- ============================================
-- PHASE 3: Update Triggers & Functions
-- ============================================

BEGIN;

-- Drop old triggers and functions
DROP TRIGGER IF EXISTS update_provider_stats_on_purchase ON user_plan_purchases;
DROP FUNCTION IF EXISTS update_provider_stats() CASCADE;

-- Create new creator stats function
CREATE OR REPLACE FUNCTION update_creator_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    total_earnings = (
      SELECT COALESCE(SUM(creator_earnings), 0)
      FROM user_plan_purchases
      WHERE creator_user_id = NEW.creator_user_id AND status = 'completed'
    ),
    total_meal_plans_created = (
      SELECT COUNT(*)
      FROM meal_plans
      WHERE created_by_user_id = NEW.creator_user_id AND is_active = TRUE AND is_deleted = FALSE
    ),
    updated_at = NOW()
  WHERE id = NEW.creator_user_id AND is_creator = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creator_stats_on_purchase
  AFTER INSERT OR UPDATE ON user_plan_purchases
  FOR EACH ROW
  WHEN (NEW.creator_user_id IS NOT NULL)
  EXECUTE FUNCTION update_creator_stats();

-- Create meal plan stats function
CREATE OR REPLACE FUNCTION update_creator_stats_on_meal_plan()
RETURNS TRIGGER AS $$
DECLARE
  creator_id UUID;
BEGIN
  creator_id := COALESCE(NEW.created_by_user_id, OLD.created_by_user_id);

  IF creator_id IS NOT NULL THEN
    UPDATE users
    SET
      total_meal_plans_created = (
        SELECT COUNT(*)
        FROM meal_plans
        WHERE created_by_user_id = creator_id
          AND is_active = TRUE
          AND is_deleted = FALSE
          AND is_published = TRUE
      ),
      updated_at = NOW()
    WHERE id = creator_id AND is_creator = TRUE;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creator_stats_on_meal_plan_change
  AFTER INSERT OR UPDATE OR DELETE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_stats_on_meal_plan();

-- Create creator rating function
CREATE OR REPLACE FUNCTION update_creator_rating()
RETURNS TRIGGER AS $$
DECLARE
  creator_id UUID;
BEGIN
  SELECT created_by_user_id INTO creator_id
  FROM meal_plans
  WHERE id = COALESCE(NEW.meal_plan_id, OLD.meal_plan_id);

  IF creator_id IS NOT NULL THEN
    UPDATE users
    SET
      creator_rating = (
        SELECT COALESCE(ROUND(AVG(mp.average_rating::numeric), 2), 0)
        FROM meal_plans mp
        WHERE mp.created_by_user_id = creator_id
          AND mp.is_active = TRUE
          AND mp.is_deleted = FALSE
          AND mp.rating_count > 0
      ),
      updated_at = NOW()
    WHERE id = creator_id AND is_creator = TRUE;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creator_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON meal_plan_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_rating();

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Migration Complete! Creators: ' || COUNT(*)::text
FROM users WHERE is_creator = TRUE;
