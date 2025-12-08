-- ============================================
-- DOCUMENT CURRENT STATE: Before Provider-to-Creator Migration
-- Created: 2025-01-27
-- Purpose: Capture current database state for comparison
-- ============================================

\echo '============================================'
\echo 'PRE-MIGRATION DATABASE STATE'
\echo 'Date:' `date`
\echo '============================================'
\echo ''

-- ============================================
-- PART 1: Table Row Counts
-- ============================================
\echo '--- PART 1: Table Row Counts ---'
\echo ''

SELECT 'meal_plan_providers' AS table_name, COUNT(*) AS row_count FROM meal_plan_providers
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'meal_plans', COUNT(*) FROM meal_plans
UNION ALL
SELECT 'meal_plan_days', COUNT(*) FROM meal_plan_days
UNION ALL
SELECT 'meals', COUNT(*) FROM meals
UNION ALL
SELECT 'user_plan_purchases', COUNT(*) FROM user_plan_purchases
UNION ALL
SELECT 'platform_analytics', COUNT(*) FROM platform_analytics
UNION ALL
SELECT 'feed_follows', COUNT(*) FROM feed_follows
UNION ALL
SELECT 'feed_posts', COUNT(*) FROM feed_posts
UNION ALL
SELECT 'feed_comments', COUNT(*) FROM feed_comments
UNION ALL
SELECT 'feed_likes', COUNT(*) FROM feed_likes
ORDER BY table_name;

\echo ''

-- ============================================
-- PART 2: Provider-Related Counts
-- ============================================
\echo '--- PART 2: Provider-Related Data ---'
\echo ''

\echo 'Total providers:'
SELECT COUNT(*) AS total_providers FROM meal_plan_providers;

\echo ''
\echo 'Providers with meal plans:'
SELECT COUNT(DISTINCT provider_id) AS providers_with_plans
FROM meal_plans
WHERE provider_id IS NOT NULL;

\echo ''
\echo 'Meal plans per provider:'
SELECT
  mpp.business_name,
  COUNT(mp.id) AS meal_plan_count
FROM meal_plan_providers mpp
LEFT JOIN meal_plans mp ON mp.provider_id = mpp.id
GROUP BY mpp.id, mpp.business_name
ORDER BY meal_plan_count DESC;

\echo ''
\echo 'Total earnings per provider:'
SELECT
  business_name,
  total_earnings
FROM meal_plan_providers
ORDER BY total_earnings DESC;

\echo ''

-- ============================================
-- PART 3: Foreign Key Relationships
-- ============================================
\echo '--- PART 3: Foreign Key Relationships ---'
\echo ''

\echo 'meal_plans.provider_id references:'
SELECT
  COUNT(*) AS total_meal_plans,
  COUNT(provider_id) AS with_provider_id,
  COUNT(*) - COUNT(provider_id) AS null_provider_id
FROM meal_plans;

\echo ''
\echo 'user_plan_purchases.provider_id references:'
SELECT
  COUNT(*) AS total_purchases,
  COUNT(provider_id) AS with_provider_id,
  COUNT(*) - COUNT(provider_id) AS null_provider_id
FROM user_plan_purchases;

\echo ''
\echo 'platform_analytics.provider_id references:'
SELECT
  COUNT(*) AS total_analytics,
  COUNT(provider_id) AS with_provider_id,
  COUNT(*) - COUNT(provider_id) AS null_provider_id
FROM platform_analytics;

\echo ''
\echo 'feed_follows.following_provider_id references:'
SELECT
  COUNT(*) AS total_follows,
  COUNT(following_provider_id) AS following_providers,
  COUNT(*) - COUNT(following_provider_id) AS null_provider_id
FROM feed_follows;

\echo ''

-- ============================================
-- PART 4: Feed Post Author Types
-- ============================================
\echo '--- PART 4: Feed Post Author Types ---'
\echo ''

\echo 'Feed posts by author type:'
SELECT
  author_type,
  COUNT(*) AS post_count
FROM feed_posts
GROUP BY author_type
ORDER BY post_count DESC;

\echo ''

-- ============================================
-- PART 5: Data Integrity Checks
-- ============================================
\echo '--- PART 5: Data Integrity Checks ---'
\echo ''

\echo 'Orphaned meal_plans (no valid provider_id):'
SELECT COUNT(*) AS orphaned_count
FROM meal_plans mp
LEFT JOIN meal_plan_providers mpp ON mp.provider_id = mpp.id
WHERE mp.provider_id IS NOT NULL AND mpp.id IS NULL;

\echo ''
\echo 'Orphaned purchases (no valid provider_id):'
SELECT COUNT(*) AS orphaned_count
FROM user_plan_purchases upp
LEFT JOIN meal_plan_providers mpp ON upp.provider_id = mpp.id
WHERE upp.provider_id IS NOT NULL AND mpp.id IS NULL;

\echo ''
\echo 'Providers without users:'
SELECT COUNT(*) AS orphaned_count
FROM meal_plan_providers mpp
LEFT JOIN users u ON mpp.user_id = u.id
WHERE u.id IS NULL;

\echo ''

-- ============================================
-- PART 6: Column Existence Verification
-- ============================================
\echo '--- PART 6: Current Column Structure ---'
\echo ''

\echo 'meal_plan_providers columns:'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'meal_plan_providers'
ORDER BY ordinal_position;

\echo ''
\echo 'users columns (current - should NOT have creator fields):'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name LIKE '%creator%'
ORDER BY ordinal_position;

\echo ''
\echo 'meal_plans columns (relevant):'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'meal_plans'
  AND column_name IN ('id', 'provider_id', 'created_by_user_id', 'title')
ORDER BY ordinal_position;

\echo ''

-- ============================================
-- PART 7: Summary Statistics
-- ============================================
\echo '--- PART 7: Summary Statistics ---'
\echo ''

\echo 'Overall summary:'
SELECT
  (SELECT COUNT(*) FROM meal_plan_providers) AS total_providers,
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM meal_plans) AS total_meal_plans,
  (SELECT COUNT(*) FROM user_plan_purchases) AS total_purchases,
  (SELECT COUNT(*) FROM feed_follows WHERE following_provider_id IS NOT NULL) AS total_provider_follows,
  (SELECT COUNT(*) FROM feed_posts WHERE author_type = 'provider') AS total_provider_posts;

\echo ''
\echo '============================================'
\echo 'PRE-MIGRATION STATE DOCUMENTED'
\echo 'Save this output for comparison after migration'
\echo '============================================'
