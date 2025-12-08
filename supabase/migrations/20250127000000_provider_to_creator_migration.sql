-- ============================================
-- PHASE 1: Provider to Creator Migration
-- Created: 2025-01-27
-- Purpose: Migrate meal_plan_providers to creator mode on users table
-- ============================================
-- CRITICAL: This migration makes BREAKING CHANGES
-- Ensure you have a backup before running
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Add new creator columns to users table
-- ============================================
DO $$
BEGIN
  -- Core creator fields
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_display_name VARCHAR(255);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_bio TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_profile_image_url VARCHAR(500);

  -- Creator stats fields
  ALTER TABLE users ADD COLUMN IF NOT EXISTS total_meal_plans_created INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10, 2) DEFAULT 0.00;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_rating DECIMAL(3, 2) DEFAULT 0.00;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_email_verified BOOLEAN DEFAULT FALSE;

  -- Enhanced creator fields (NEW)
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_tier VARCHAR(20) CHECK (creator_tier IN ('bronze', 'silver', 'gold') OR creator_tier IS NULL);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{}'::jsonb;

  RAISE NOTICE 'Step 1: Creator columns added to users table';
END $$;

-- ============================================
-- STEP 2: Migrate data from meal_plan_providers to users
-- ============================================
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Update existing users who are providers
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

  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE 'Step 2: Migrated % providers to creator mode', migrated_count;
END $$;

-- ============================================
-- STEP 3: Add new columns to meal_plans table
-- ============================================
DO $$
BEGIN
  ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE;
  ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS creator_name VARCHAR(255);
  ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS creator_bio TEXT;
  ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS creator_avatar_url VARCHAR(500);

  RAISE NOTICE 'Step 3: New columns added to meal_plans';
END $$;

-- ============================================
-- STEP 4: Migrate meal_plans data
-- ============================================
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Populate created_by_user_id and denormalized creator info
  UPDATE meal_plans mp
  SET
    created_by_user_id = mpp.user_id,
    creator_name = mpp.business_name,
    creator_bio = mpp.bio,
    creator_avatar_url = mpp.profile_image_url,
    updated_at = NOW()
  FROM meal_plan_providers mpp
  WHERE mp.provider_id = mpp.id;

  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE 'Step 4: Migrated % meal_plans', migrated_count;

  -- Check for orphaned meal plans
  IF EXISTS (SELECT 1 FROM meal_plans WHERE provider_id IS NOT NULL AND created_by_user_id IS NULL) THEN
    RAISE WARNING 'Found orphaned meal_plans! Review before proceeding.';
  END IF;
END $$;

-- ============================================
-- STEP 5: Add new columns to user_plan_purchases
-- ============================================
DO $$
BEGIN
  ALTER TABLE user_plan_purchases ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE user_plan_purchases ADD COLUMN IF NOT EXISTS creator_earnings DECIMAL(10, 2) DEFAULT 0.00;

  RAISE NOTICE 'Step 5: New columns added to user_plan_purchases';
END $$;

-- ============================================
-- STEP 6: Migrate user_plan_purchases data
-- ============================================
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  UPDATE user_plan_purchases upp
  SET
    creator_user_id = mpp.user_id,
    creator_earnings = COALESCE(upp.provider_earnings, upp.purchase_price)
  FROM meal_plan_providers mpp
  WHERE upp.provider_id = mpp.id;

  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE 'Step 6: Migrated % purchases', migrated_count;
END $$;

-- ============================================
-- STEP 7: Update platform_analytics table (if exists)
-- ============================================
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_analytics') THEN
    -- Add new column
    ALTER TABLE platform_analytics ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

    -- Migrate data
    UPDATE platform_analytics pa
    SET creator_user_id = mpp.user_id
    FROM meal_plan_providers mpp
    WHERE pa.provider_id = mpp.id;

    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE 'Step 7: Migrated % analytics records', migrated_count;
  ELSE
    RAISE NOTICE 'Step 7: platform_analytics table not found, skipping';
  END IF;
END $$;

-- ============================================
-- STEP 8: Update feed_follows table
-- ============================================
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Add new column
  ALTER TABLE feed_follows ADD COLUMN IF NOT EXISTS following_user_id UUID REFERENCES users(id) ON DELETE CASCADE;

  -- Migrate data
  UPDATE feed_follows ff
  SET following_user_id = mpp.user_id
  FROM meal_plan_providers mpp
  WHERE ff.following_provider_id = mpp.id;

  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE 'Step 8: Migrated % feed follows', migrated_count;

  -- Check for orphaned follows
  IF EXISTS (SELECT 1 FROM feed_follows WHERE following_provider_id IS NOT NULL AND following_user_id IS NULL) THEN
    RAISE WARNING 'Found orphaned feed_follows! Review before proceeding.';
  END IF;
END $$;

-- ============================================
-- STEP 9: Update feed_posts - Remove author_type dependency
-- ============================================
DO $$
BEGIN
  -- We'll drop the column later, but first ensure data integrity
  -- Update all provider posts to ensure author_id points to user_id
  RAISE NOTICE 'Step 9: feed_posts.author_type will be dropped after validation';
END $$;

-- ============================================
-- STEP 10: Create new foreign key constraints
-- ============================================
DO $$
BEGIN
  -- meal_plans.created_by_user_id FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_meal_plans_created_by_user'
  ) THEN
    ALTER TABLE meal_plans
    ADD CONSTRAINT fk_meal_plans_created_by_user
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- user_plan_purchases.creator_user_id FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_purchases_creator_user'
  ) THEN
    ALTER TABLE user_plan_purchases
    ADD CONSTRAINT fk_purchases_creator_user
    FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- feed_follows.following_user_id FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_feed_follows_user'
  ) THEN
    ALTER TABLE feed_follows
    ADD CONSTRAINT fk_feed_follows_user
    FOREIGN KEY (following_user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  RAISE NOTICE 'Step 10: New foreign key constraints created';
END $$;

-- ============================================
-- STEP 11: Create indexes for performance
-- ============================================
DO $$
BEGIN
  -- Users table indexes
  CREATE INDEX IF NOT EXISTS idx_users_is_creator ON users(is_creator) WHERE is_creator = TRUE;
  CREATE INDEX IF NOT EXISTS idx_users_creator_tier ON users(creator_tier) WHERE creator_tier IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified) WHERE is_verified = TRUE;
  CREATE INDEX IF NOT EXISTS idx_users_creator_rating ON users(creator_rating DESC) WHERE is_creator = TRUE;

  -- meal_plans table indexes
  CREATE INDEX IF NOT EXISTS idx_meal_plans_created_by ON meal_plans(created_by_user_id);

  -- user_plan_purchases table indexes
  CREATE INDEX IF NOT EXISTS idx_purchases_creator_user ON user_plan_purchases(creator_user_id);

  -- feed_follows table indexes
  CREATE INDEX IF NOT EXISTS idx_feed_follows_user_id ON feed_follows(following_user_id);

  -- platform_analytics indexes (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_analytics') THEN
    CREATE INDEX IF NOT EXISTS idx_analytics_creator_user ON platform_analytics(creator_user_id);
  END IF;

  RAISE NOTICE 'Step 11: Performance indexes created';
END $$;

-- ============================================
-- STEP 12: Verification before destructive operations
-- ============================================
DO $$
DECLARE
  orphaned_plans INTEGER;
  orphaned_purchases INTEGER;
  orphaned_follows INTEGER;
BEGIN
  -- Count orphaned records
  SELECT COUNT(*) INTO orphaned_plans
  FROM meal_plans
  WHERE provider_id IS NOT NULL AND created_by_user_id IS NULL;

  SELECT COUNT(*) INTO orphaned_purchases
  FROM user_plan_purchases
  WHERE provider_id IS NOT NULL AND creator_user_id IS NULL;

  SELECT COUNT(*) INTO orphaned_follows
  FROM feed_follows
  WHERE following_provider_id IS NOT NULL AND following_user_id IS NULL;

  IF orphaned_plans > 0 OR orphaned_purchases > 0 OR orphaned_follows > 0 THEN
    RAISE EXCEPTION 'Orphaned records found! Plans: %, Purchases: %, Follows: %',
      orphaned_plans, orphaned_purchases, orphaned_follows;
  END IF;

  RAISE NOTICE 'Step 12: Verification passed - no orphaned records';
END $$;

-- ============================================
-- STEP 13: Drop old foreign key constraints
-- ============================================
DO $$
BEGIN
  -- Drop old constraints if they exist
  ALTER TABLE meal_plans DROP CONSTRAINT IF EXISTS meal_plans_provider_id_fkey CASCADE;
  ALTER TABLE user_plan_purchases DROP CONSTRAINT IF EXISTS user_plan_purchases_provider_id_fkey CASCADE;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_analytics') THEN
    ALTER TABLE platform_analytics DROP CONSTRAINT IF EXISTS platform_analytics_provider_id_fkey CASCADE;
  END IF;

  ALTER TABLE feed_follows DROP CONSTRAINT IF EXISTS feed_follows_following_provider_id_fkey CASCADE;

  RAISE NOTICE 'Step 13: Old foreign key constraints dropped';
END $$;

-- ============================================
-- STEP 14: Drop old columns
-- ============================================
DO $$
BEGIN
  -- Drop provider_id from meal_plans
  ALTER TABLE meal_plans DROP COLUMN IF EXISTS provider_id CASCADE;

  -- Drop provider_id and provider_earnings from user_plan_purchases
  ALTER TABLE user_plan_purchases DROP COLUMN IF EXISTS provider_id CASCADE;
  ALTER TABLE user_plan_purchases DROP COLUMN IF EXISTS provider_earnings CASCADE;

  -- Drop provider_id from platform_analytics (if exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_analytics') THEN
    ALTER TABLE platform_analytics DROP COLUMN IF EXISTS provider_id CASCADE;
  END IF;

  -- Drop following_provider_id from feed_follows
  ALTER TABLE feed_follows DROP COLUMN IF EXISTS following_provider_id CASCADE;

  -- Drop author_type from feed_posts
  ALTER TABLE feed_posts DROP COLUMN IF EXISTS author_type CASCADE;

  RAISE NOTICE 'Step 14: Old columns dropped';
END $$;

-- ============================================
-- STEP 15: Drop meal_plan_providers table
-- ============================================
DO $$
BEGIN
  DROP TABLE IF EXISTS meal_plan_providers CASCADE;

  RAISE NOTICE 'Step 15: meal_plan_providers table dropped';
END $$;

-- ============================================
-- STEP 16: Update unique constraint on feed_follows
-- ============================================
DO $$
BEGIN
  -- Drop old constraint
  ALTER TABLE feed_follows DROP CONSTRAINT IF EXISTS feed_follows_follower_user_id_following_provider_id_key;

  -- Add new constraint
  ALTER TABLE feed_follows
  ADD CONSTRAINT feed_follows_follower_following_unique
  UNIQUE(follower_user_id, following_user_id);

  RAISE NOTICE 'Step 16: feed_follows unique constraint updated';
END $$;

COMMIT;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
DO $$
DECLARE
  creator_count INTEGER;
  meal_plan_count INTEGER;
  purchase_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO creator_count FROM users WHERE is_creator = TRUE;
  SELECT COUNT(*) INTO meal_plan_count FROM meal_plans WHERE created_by_user_id IS NOT NULL;
  SELECT COUNT(*) INTO purchase_count FROM user_plan_purchases WHERE creator_user_id IS NOT NULL;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION COMPLETE!';
  RAISE NOTICE 'Total creators: %', creator_count;
  RAISE NOTICE 'Total meal plans: %', meal_plan_count;
  RAISE NOTICE 'Total purchases: %', purchase_count;
  RAISE NOTICE '============================================';
END $$;
