-- ============================================
-- PHASE 2: Recreate RLS Policies for Creator Model
-- Created: 2025-01-27
-- Purpose: Update Row-Level Security policies after provider-to-creator migration
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Drop old provider-related policies
-- ============================================
DO $$
BEGIN
  -- Drop meal_plan_providers policies (table no longer exists)
  DROP POLICY IF EXISTS providers_select_own ON meal_plan_providers;
  DROP POLICY IF EXISTS providers_update_own ON meal_plan_providers;
  DROP POLICY IF EXISTS providers_insert_own ON meal_plan_providers;
  DROP POLICY IF EXISTS providers_public_select ON meal_plan_providers;

  RAISE NOTICE 'Step 1: Old provider policies dropped';
END $$;

-- ============================================
-- STEP 2: Update users table policies for creators
-- ============================================
DO $$
BEGIN
  -- Add policy for public to read creator profiles
  DROP POLICY IF EXISTS users_read_creator_profiles ON users;
  CREATE POLICY users_read_creator_profiles ON users
    FOR SELECT
    USING (
      is_creator = TRUE
      AND is_active = TRUE
      AND is_deleted = FALSE
    );

  -- Add policy for creators to update their creator profile
  DROP POLICY IF EXISTS users_update_creator_profile ON users;
  CREATE POLICY users_update_creator_profile ON users
    FOR UPDATE
    USING (auth.uid() = id AND is_creator = TRUE);

  RAISE NOTICE 'Step 2: Creator-related user policies created';
END $$;

-- ============================================
-- STEP 3: Update meal_plans policies
-- ============================================
DO $$
BEGIN
  -- Drop old provider-based policy
  DROP POLICY IF EXISTS meal_plans_provider_manage ON meal_plans;

  -- Create new creator-based policy
  CREATE POLICY meal_plans_creator_manage ON meal_plans
    FOR ALL
    USING (
      created_by_user_id = auth.uid()
      AND created_by_user_id IN (
        SELECT id FROM users
        WHERE is_creator = TRUE
        AND is_active = TRUE
        AND is_deleted = FALSE
      )
    );

  RAISE NOTICE 'Step 3: meal_plans policies updated for creators';
END $$;

-- ============================================
-- STEP 4: Update meal_plan_days policies
-- ============================================
DO $$
BEGIN
  -- Drop old provider-based policy
  DROP POLICY IF EXISTS meal_plan_days_provider_manage ON meal_plan_days;

  -- Create new creator-based policy
  CREATE POLICY meal_plan_days_creator_manage ON meal_plan_days
    FOR ALL
    USING (
      meal_plan_id IN (
        SELECT mp.id FROM meal_plans mp
        WHERE mp.created_by_user_id = auth.uid()
        AND mp.created_by_user_id IN (
          SELECT id FROM users
          WHERE is_creator = TRUE
          AND is_active = TRUE
          AND is_deleted = FALSE
        )
      )
    );

  RAISE NOTICE 'Step 4: meal_plan_days policies updated for creators';
END $$;

-- ============================================
-- STEP 5: Update meals policies
-- ============================================
DO $$
BEGIN
  -- Drop old provider-based policy
  DROP POLICY IF EXISTS meals_provider_manage ON meals;

  -- Create new creator-based policy
  CREATE POLICY meals_creator_manage ON meals
    FOR ALL
    USING (
      meal_plan_day_id IN (
        SELECT mpd.id FROM meal_plan_days mpd
        JOIN meal_plans mp ON mpd.meal_plan_id = mp.id
        WHERE mp.created_by_user_id = auth.uid()
        AND mp.created_by_user_id IN (
          SELECT id FROM users
          WHERE is_creator = TRUE
          AND is_active = TRUE
          AND is_deleted = FALSE
        )
      )
    );

  RAISE NOTICE 'Step 5: meals policies updated for creators';
END $$;

-- ============================================
-- STEP 6: Update user_plan_purchases policies
-- ============================================
DO $$
BEGIN
  -- Drop old provider-based policy
  DROP POLICY IF EXISTS purchases_provider_select ON user_plan_purchases;

  -- Create new creator-based policy
  CREATE POLICY purchases_creator_select ON user_plan_purchases
    FOR SELECT
    USING (
      creator_user_id = auth.uid()
      AND creator_user_id IN (
        SELECT id FROM users
        WHERE is_creator = TRUE
        AND is_active = TRUE
        AND is_deleted = FALSE
      )
    );

  RAISE NOTICE 'Step 6: user_plan_purchases policies updated for creators';
END $$;

-- ============================================
-- STEP 7: Update platform_analytics policies (if table exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_analytics') THEN
    -- Drop old provider-based policy
    DROP POLICY IF EXISTS analytics_provider_own ON platform_analytics;

    -- Create new creator-based policy
    CREATE POLICY analytics_creator_own ON platform_analytics
      FOR SELECT
      USING (
        creator_user_id = auth.uid()
        AND creator_user_id IN (
          SELECT id FROM users
          WHERE is_creator = TRUE
          AND is_active = TRUE
          AND is_deleted = FALSE
        )
      );

    RAISE NOTICE 'Step 7: platform_analytics policies updated for creators';
  ELSE
    RAISE NOTICE 'Step 7: platform_analytics table not found, skipping';
  END IF;
END $$;

-- ============================================
-- STEP 8: Create policies for creator-only operations
-- ============================================
DO $$
BEGIN
  -- Policy: Only creators can create meal plans
  DROP POLICY IF EXISTS meal_plans_creator_insert ON meal_plans;
  CREATE POLICY meal_plans_creator_insert ON meal_plans
    FOR INSERT
    WITH CHECK (
      created_by_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND is_creator = TRUE
        AND is_active = TRUE
        AND is_deleted = FALSE
      )
    );

  RAISE NOTICE 'Step 8: Creator-only insert policies created';
END $$;

-- ============================================
-- STEP 9: Test policies (verification)
-- ============================================
DO $$
BEGIN
  -- Verify key policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'meal_plans' AND policyname = 'meal_plans_creator_manage'
  ) THEN
    RAISE EXCEPTION 'meal_plans_creator_manage policy not found!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'users_read_creator_profiles'
  ) THEN
    RAISE EXCEPTION 'users_read_creator_profiles policy not found!';
  END IF;

  RAISE NOTICE 'Step 9: Policy verification passed';
END $$;

COMMIT;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'RLS POLICIES MIGRATION COMPLETE!';
  RAISE NOTICE 'Total active policies: %', policy_count;
  RAISE NOTICE '============================================';
END $$;
