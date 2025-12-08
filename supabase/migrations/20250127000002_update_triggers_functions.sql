-- ============================================
-- PHASE 3: Update Database Triggers & Functions
-- Created: 2025-01-27
-- Purpose: Update triggers and functions after provider-to-creator migration
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Drop old provider-related triggers
-- ============================================
DO $$
BEGIN
  -- Drop old provider stats trigger
  DROP TRIGGER IF EXISTS update_provider_stats_on_purchase ON user_plan_purchases;

  -- Drop old provider updated_at trigger (table no longer exists)
  -- DROP TRIGGER IF EXISTS update_providers_updated_at ON meal_plan_providers;

  RAISE NOTICE 'Step 1: Old provider triggers dropped';
END $$;

-- ============================================
-- STEP 2: Drop old provider-related functions
-- ============================================
DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_provider_stats() CASCADE;

  RAISE NOTICE 'Step 2: Old provider functions dropped';
END $$;

-- ============================================
-- STEP 3: Create new creator stats update function
-- ============================================
CREATE OR REPLACE FUNCTION update_creator_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_earnings and total_meal_plans_created for creator
  UPDATE users
  SET
    total_earnings = (
      SELECT COALESCE(SUM(creator_earnings), 0)
      FROM user_plan_purchases
      WHERE creator_user_id = NEW.creator_user_id
        AND status = 'completed'
    ),
    total_meal_plans_created = (
      SELECT COUNT(*)
      FROM meal_plans
      WHERE created_by_user_id = NEW.creator_user_id
        AND is_active = TRUE
        AND is_deleted = FALSE
    ),
    updated_at = NOW()
  WHERE id = NEW.creator_user_id
    AND is_creator = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: Create trigger for creator stats on purchase
-- ============================================
CREATE TRIGGER update_creator_stats_on_purchase
  AFTER INSERT OR UPDATE ON user_plan_purchases
  FOR EACH ROW
  WHEN (NEW.creator_user_id IS NOT NULL)
  EXECUTE FUNCTION update_creator_stats();

-- ============================================
-- STEP 5: Create function to update creator stats on meal plan changes
-- ============================================
CREATE OR REPLACE FUNCTION update_creator_stats_on_meal_plan()
RETURNS TRIGGER AS $$
DECLARE
  creator_id UUID;
BEGIN
  -- Get the creator_id from NEW or OLD record
  creator_id := COALESCE(NEW.created_by_user_id, OLD.created_by_user_id);

  IF creator_id IS NOT NULL THEN
    -- Update total_meal_plans_created for creator
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
    WHERE id = creator_id
      AND is_creator = TRUE;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: Create trigger for creator stats on meal plan changes
-- ============================================
CREATE TRIGGER update_creator_stats_on_meal_plan_change
  AFTER INSERT OR UPDATE OR DELETE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_stats_on_meal_plan();

-- ============================================
-- STEP 7: Create function to update creator rating
-- ============================================
CREATE OR REPLACE FUNCTION update_creator_rating()
RETURNS TRIGGER AS $$
DECLARE
  creator_id UUID;
BEGIN
  -- Get creator_id from the meal plan
  SELECT created_by_user_id INTO creator_id
  FROM meal_plans
  WHERE id = COALESCE(NEW.meal_plan_id, OLD.meal_plan_id);

  IF creator_id IS NOT NULL THEN
    -- Update creator_rating based on average of all their meal plan ratings
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
    WHERE id = creator_id
      AND is_creator = TRUE;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 8: Create trigger for creator rating updates
-- ============================================
CREATE TRIGGER update_creator_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON meal_plan_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_rating();

-- ============================================
-- STEP 9: Optional - Auto-create feed post when meal plan is published
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_feed_post_on_meal_plan_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create feed post if meal plan is newly published
  IF NEW.is_published = TRUE AND (OLD IS NULL OR OLD.is_published = FALSE) THEN
    -- Check if creator wants auto-posting (you can add a user preference later)
    INSERT INTO feed_posts (
      author_id,
      post_type,
      title,
      content,
      image_url,
      related_meal_plan_id,
      published_at
    ) VALUES (
      NEW.created_by_user_id,
      'meal_plan',
      NEW.title,
      LEFT(NEW.description, 500), -- Truncate to 500 chars
      NULL, -- You can add meal plan image if available
      NEW.id,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optionally enable this trigger (commented out by default)
-- CREATE TRIGGER auto_post_on_meal_plan_publish
--   AFTER INSERT OR UPDATE ON meal_plans
--   FOR EACH ROW
--   WHEN (NEW.is_published = TRUE)
--   EXECUTE FUNCTION auto_create_feed_post_on_meal_plan_publish();

-- ============================================
-- STEP 10: Verification
-- ============================================
DO $$
DECLARE
  function_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Count creator-related functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname LIKE '%creator%';

  -- Count creator-related triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.tgname LIKE '%creator%';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'TRIGGERS & FUNCTIONS MIGRATION COMPLETE!';
  RAISE NOTICE 'Creator functions created: %', function_count;
  RAISE NOTICE 'Creator triggers created: %', trigger_count;
  RAISE NOTICE '============================================';
END $$;

COMMIT;
