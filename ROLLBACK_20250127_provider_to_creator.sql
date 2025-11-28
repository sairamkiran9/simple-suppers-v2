-- ============================================
-- ROLLBACK SCRIPT: Provider to Creator Migration
-- Created: 2025-01-27
-- Purpose: Rollback database changes if migration fails
-- ============================================
-- WARNING: This script will DESTROY all changes made during the migration
-- Only run this if the migration has failed and you need to restore
-- ============================================

BEGIN;

-- Step 1: Recreate meal_plan_providers table
CREATE TABLE IF NOT EXISTS meal_plan_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_image_url VARCHAR(500),
  total_meal_plans_created INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Step 2: Migrate creator data back to meal_plan_providers
INSERT INTO meal_plan_providers (
  user_id,
  business_name,
  bio,
  profile_image_url,
  total_meal_plans_created,
  total_earnings,
  rating,
  email_verified,
  created_at,
  updated_at
)
SELECT
  id,
  COALESCE(creator_display_name, name),
  creator_bio,
  creator_profile_image_url,
  total_meal_plans_created,
  total_earnings,
  creator_rating,
  creator_email_verified,
  created_at,
  updated_at
FROM users
WHERE is_creator = true
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Add provider_id back to meal_plans
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES meal_plan_providers(id);

-- Restore provider_id from created_by_user_id
UPDATE meal_plans mp
SET provider_id = mpp.id
FROM meal_plan_providers mpp
WHERE mp.created_by_user_id = mpp.user_id;

-- Step 4: Add provider_id back to user_plan_purchases
ALTER TABLE user_plan_purchases ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES meal_plan_providers(id);
ALTER TABLE user_plan_purchases ADD COLUMN IF NOT EXISTS provider_earnings DECIMAL(10, 2) DEFAULT 0.00;

-- Restore provider_id from creator_user_id
UPDATE user_plan_purchases upp
SET provider_id = mpp.id,
    provider_earnings = creator_earnings
FROM meal_plan_providers mpp
WHERE upp.creator_user_id = mpp.user_id;

-- Step 5: Add provider_id back to platform_analytics
ALTER TABLE platform_analytics ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES meal_plan_providers(id);

UPDATE platform_analytics pa
SET provider_id = mpp.id
FROM meal_plan_providers mpp
WHERE pa.creator_user_id = mpp.user_id;

-- Step 6: Restore feed_follows
ALTER TABLE feed_follows ADD COLUMN IF NOT EXISTS following_provider_id UUID REFERENCES meal_plan_providers(id);

UPDATE feed_follows ff
SET following_provider_id = mpp.id
FROM meal_plan_providers mpp
WHERE ff.following_user_id = mpp.user_id;

-- Step 7: Restore feed_posts author_type
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS author_type VARCHAR(20) DEFAULT 'user';

UPDATE feed_posts
SET author_type = 'provider'
WHERE author_id IN (SELECT user_id FROM meal_plan_providers);

-- Step 8: Drop new creator columns from users
ALTER TABLE users DROP COLUMN IF EXISTS is_creator;
ALTER TABLE users DROP COLUMN IF EXISTS creator_display_name;
ALTER TABLE users DROP COLUMN IF EXISTS creator_bio;
ALTER TABLE users DROP COLUMN IF EXISTS creator_profile_image_url;
ALTER TABLE users DROP COLUMN IF EXISTS total_meal_plans_created;
ALTER TABLE users DROP COLUMN IF EXISTS total_earnings;
ALTER TABLE users DROP COLUMN IF EXISTS creator_rating;
ALTER TABLE users DROP COLUMN IF EXISTS creator_email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
ALTER TABLE users DROP COLUMN IF EXISTS creator_tier;
ALTER TABLE users DROP COLUMN IF EXISTS social_media_links;

-- Step 9: Drop new columns from dependent tables
ALTER TABLE meal_plans DROP COLUMN IF EXISTS created_by_user_id;
ALTER TABLE meal_plans DROP COLUMN IF EXISTS creator_name;
ALTER TABLE meal_plans DROP COLUMN IF EXISTS creator_bio;
ALTER TABLE meal_plans DROP COLUMN IF EXISTS creator_avatar_url;

ALTER TABLE user_plan_purchases DROP COLUMN IF EXISTS creator_user_id;
ALTER TABLE user_plan_purchases DROP COLUMN IF EXISTS creator_earnings;

ALTER TABLE platform_analytics DROP COLUMN IF EXISTS creator_user_id;

ALTER TABLE feed_follows DROP COLUMN IF EXISTS following_user_id;

-- Step 10: Recreate old indexes
CREATE INDEX IF NOT EXISTS idx_meal_plans_provider_id ON meal_plans(provider_id);
CREATE INDEX IF NOT EXISTS idx_purchases_provider_id ON user_plan_purchases(provider_id);
CREATE INDEX IF NOT EXISTS idx_analytics_provider_id ON platform_analytics(provider_id);
CREATE INDEX IF NOT EXISTS idx_feed_follows_provider_id ON feed_follows(following_provider_id);

-- Step 11: Recreate old RLS policies (placeholder - needs specific policies)
-- NOTE: You'll need to add your specific RLS policies here

COMMIT;

-- ============================================
-- Verification Queries
-- ============================================
-- Run these after rollback to verify success:
-- SELECT COUNT(*) FROM meal_plan_providers;
-- SELECT COUNT(*) FROM meal_plans WHERE provider_id IS NULL;
-- SELECT COUNT(*) FROM users WHERE is_creator IS NOT NULL;
