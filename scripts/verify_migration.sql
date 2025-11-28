-- ============================================
-- VERIFICATION SCRIPT: Provider to Creator Migration
-- Created: 2025-01-27
-- Purpose: Verify migration was successful
-- ============================================

\echo '============================================'
\echo 'VERIFICATION QUERIES FOR MIGRATION'
\echo '============================================'
\echo ''

-- ============================================
-- PART 1: Table Existence Checks
-- ============================================
\echo '--- PART 1: Table Existence Checks ---'
\echo ''

-- Check that meal_plan_providers table is GONE
\echo 'Checking meal_plan_providers table is dropped...'
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'meal_plan_providers'
    )
    THEN '❌ FAIL: meal_plan_providers table still exists'
    ELSE '✅ PASS: meal_plan_providers table dropped'
  END AS result;

\echo ''

-- ============================================
-- PART 2: Column Existence Checks
-- ============================================
\echo '--- PART 2: Column Existence Checks ---'
\echo ''

-- Check users table has new creator columns
\echo 'Checking users table has creator columns...'
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('is_creator', 'creator_display_name', 'creator_bio', 'creator_profile_image_url', 'total_meal_plans_created', 'total_earnings', 'creator_rating', 'is_verified', 'creator_tier', 'social_media_links')
      GROUP BY table_name
      HAVING COUNT(*) = 10
    )
    THEN '✅ PASS: users table has all creator columns'
    ELSE '❌ FAIL: users table missing creator columns'
  END AS result;

\echo ''

-- Check meal_plans has created_by_user_id (not provider_id)
\echo 'Checking meal_plans has created_by_user_id...'
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'meal_plans'
      AND column_name = 'created_by_user_id'
    )
    THEN '✅ PASS: meal_plans has created_by_user_id'
    ELSE '❌ FAIL: meal_plans missing created_by_user_id'
  END AS result;

\echo ''

-- Check meal_plans does NOT have provider_id
\echo 'Checking meal_plans does NOT have provider_id...'
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'meal_plans'
      AND column_name = 'provider_id'
    )
    THEN '✅ PASS: meal_plans.provider_id removed'
    ELSE '❌ FAIL: meal_plans.provider_id still exists'
  END AS result;

\echo ''

-- Check user_plan_purchases has creator_user_id
\echo 'Checking user_plan_purchases has creator_user_id...'
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'user_plan_purchases'
      AND column_name = 'creator_user_id'
    )
    THEN '✅ PASS: user_plan_purchases has creator_user_id'
    ELSE '❌ FAIL: user_plan_purchases missing creator_user_id'
  END AS result;

\echo ''

-- Check feed_follows has following_user_id
\echo 'Checking feed_follows has following_user_id...'
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'feed_follows'
      AND column_name = 'following_user_id'
    )
    THEN '✅ PASS: feed_follows has following_user_id'
    ELSE '❌ FAIL: feed_follows missing following_user_id'
  END AS result;

\echo ''

-- Check feed_posts does NOT have author_type
\echo 'Checking feed_posts does NOT have author_type...'
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'feed_posts'
      AND column_name = 'author_type'
    )
    THEN '✅ PASS: feed_posts.author_type removed'
    ELSE '❌ FAIL: feed_posts.author_type still exists'
  END AS result;

\echo ''

-- ============================================
-- PART 3: Data Integrity Checks
-- ============================================
\echo '--- PART 3: Data Integrity Checks ---'
\echo ''

-- Check no orphaned meal_plans (all have valid created_by_user_id)
\echo 'Checking for orphaned meal_plans...'
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM meal_plans WHERE created_by_user_id IS NULL) = 0
    THEN '✅ PASS: No orphaned meal_plans'
    ELSE CONCAT('❌ FAIL: ', (SELECT COUNT(*) FROM meal_plans WHERE created_by_user_id IS NULL)::text, ' orphaned meal_plans found')
  END AS result;

\echo ''

-- Check no orphaned purchases
\echo 'Checking for orphaned purchases...'
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM user_plan_purchases WHERE creator_user_id IS NULL) = 0
    THEN '✅ PASS: No orphaned purchases'
    ELSE CONCAT('❌ FAIL: ', (SELECT COUNT(*) FROM user_plan_purchases WHERE creator_user_id IS NULL)::text, ' orphaned purchases found')
  END AS result;

\echo ''

-- Check all meal_plans.created_by_user_id references valid users
\echo 'Checking meal_plans foreign key integrity...'
SELECT
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM meal_plans mp
      LEFT JOIN users u ON mp.created_by_user_id = u.id
      WHERE u.id IS NULL
    ) = 0
    THEN '✅ PASS: All meal_plans reference valid users'
    ELSE CONCAT('❌ FAIL: ', (
      SELECT COUNT(*)
      FROM meal_plans mp
      LEFT JOIN users u ON mp.created_by_user_id = u.id
      WHERE u.id IS NULL
    )::text, ' meal_plans with invalid user references')
  END AS result;

\echo ''

-- ============================================
-- PART 4: Row Count Comparison
-- ============================================
\echo '--- PART 4: Row Count Comparison ---'
\echo '(Compare these to your pre-migration counts)'
\echo ''

\echo 'Table row counts:'
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'users (is_creator=true)', COUNT(*) FROM users WHERE is_creator = true
UNION ALL
SELECT 'meal_plans', COUNT(*) FROM meal_plans
UNION ALL
SELECT 'user_plan_purchases', COUNT(*) FROM user_plan_purchases
UNION ALL
SELECT 'feed_follows', COUNT(*) FROM feed_follows
UNION ALL
SELECT 'feed_posts', COUNT(*) FROM feed_posts
ORDER BY table_name;

\echo ''

-- ============================================
-- PART 5: Foreign Key Constraints
-- ============================================
\echo '--- PART 5: Foreign Key Constraints ---'
\echo ''

\echo 'Checking foreign key constraints exist...'
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('meal_plans', 'user_plan_purchases', 'feed_follows', 'platform_analytics')
  AND kcu.column_name IN ('created_by_user_id', 'creator_user_id', 'following_user_id')
ORDER BY tc.table_name, kcu.column_name;

\echo ''

-- ============================================
-- PART 6: Index Checks
-- ============================================
\echo '--- PART 6: Index Checks ---'
\echo ''

\echo 'Checking indexes exist...'
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%creator%'
    OR indexname LIKE '%created_by%'
    OR indexname LIKE '%following_user%'
  )
ORDER BY tablename, indexname;

\echo ''
\echo '============================================'
\echo 'VERIFICATION COMPLETE'
\echo '============================================'
