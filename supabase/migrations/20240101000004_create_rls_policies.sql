-- Simple Suppers - Row Level Security Policies
-- Following the exact specification from docs/simple-suppers-database-schema

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

-- Public read access for user profiles (needed for app functionality)
CREATE POLICY users_public_read ON users FOR SELECT USING (
    is_active = true AND is_deleted = false
);

-- Enable RLS on meal_plan_providers
ALTER TABLE meal_plan_providers ENABLE ROW LEVEL SECURITY;

-- Providers can read their own data
CREATE POLICY providers_select_own ON meal_plan_providers FOR SELECT USING (
    user_id = auth.uid()
);

-- Providers can update their own profile
CREATE POLICY providers_update_own ON meal_plan_providers FOR UPDATE USING (
    user_id = auth.uid()
);

-- Users can insert their own provider profile
CREATE POLICY providers_insert_own ON meal_plan_providers FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Everyone can read active provider profiles (for public display)
CREATE POLICY providers_public_select ON meal_plan_providers FOR SELECT USING (
    is_active = true AND is_deleted = false
);

-- Remove admin policy for now to avoid recursion issues

-- Enable RLS on meal plans
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read published, active meal plans
CREATE POLICY meal_plans_public_select ON meal_plans FOR SELECT USING (
    is_published = true AND is_active = true AND is_deleted = false
);

-- Providers can manage their own meal plans
CREATE POLICY meal_plans_provider_manage ON meal_plans FOR ALL USING (
    provider_id IN (
        SELECT id FROM meal_plan_providers
        WHERE user_id = auth.uid()
        AND is_active = true
        AND is_deleted = false
    )
);

-- Remove admin policy for now to avoid recursion issues

-- Enable RLS on meal_plan_days
ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;

-- Everyone can read days for published meal plans
CREATE POLICY meal_plan_days_public_select ON meal_plan_days FOR SELECT USING (
    meal_plan_id IN (
        SELECT id FROM meal_plans
        WHERE is_published = true AND is_active = true AND is_deleted = false
    )
);

-- Providers can manage days for their own meal plans
CREATE POLICY meal_plan_days_provider_manage ON meal_plan_days FOR ALL USING (
    meal_plan_id IN (
        SELECT mp.id FROM meal_plans mp
        JOIN meal_plan_providers mpp ON mp.provider_id = mpp.id
        WHERE mpp.user_id = auth.uid()
        AND mpp.is_active = true AND mpp.is_deleted = false
    )
);

-- Enable RLS on meals
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Everyone can read meals for published meal plans
CREATE POLICY meals_public_select ON meals FOR SELECT USING (
    meal_plan_day_id IN (
        SELECT mpd.id FROM meal_plan_days mpd
        JOIN meal_plans mp ON mpd.meal_plan_id = mp.id
        WHERE mp.is_published = true AND mp.is_active = true AND mp.is_deleted = false
    )
);

-- Providers can manage meals for their own meal plans
CREATE POLICY meals_provider_manage ON meals FOR ALL USING (
    meal_plan_day_id IN (
        SELECT mpd.id FROM meal_plan_days mpd
        JOIN meal_plans mp ON mpd.meal_plan_id = mp.id
        JOIN meal_plan_providers mpp ON mp.provider_id = mpp.id
        WHERE mpp.user_id = auth.uid()
        AND mpp.is_active = true AND mpp.is_deleted = false
    )
);

-- Enable RLS on purchases
ALTER TABLE user_plan_purchases ENABLE ROW LEVEL SECURITY;

-- Users can read their own purchases
CREATE POLICY purchases_user_select ON user_plan_purchases FOR SELECT USING (
    user_id = auth.uid()
);

-- Users can create their own purchases
CREATE POLICY purchases_user_insert ON user_plan_purchases FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Providers can read purchases of their plans
CREATE POLICY purchases_provider_select ON user_plan_purchases FOR SELECT USING (
    provider_id IN (
        SELECT id FROM meal_plan_providers
        WHERE user_id = auth.uid()
        AND is_active = true
        AND is_deleted = false
    )
);

-- Enable RLS on shopping lists
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- Users can read their own shopping lists
CREATE POLICY shopping_lists_user_select ON shopping_lists FOR SELECT USING (
    user_id = auth.uid()
);

-- Users can create their own shopping lists
CREATE POLICY shopping_lists_user_insert ON shopping_lists FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Enable RLS on reviews
ALTER TABLE meal_plan_reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read active reviews
CREATE POLICY reviews_public_select ON meal_plan_reviews FOR SELECT USING (
    is_active = true AND is_deleted = false
);

-- Users can create their own reviews
CREATE POLICY reviews_user_insert ON meal_plan_reviews FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Users can update their own reviews
CREATE POLICY reviews_user_update ON meal_plan_reviews FOR UPDATE USING (
    user_id = auth.uid()
);

-- Enable RLS on admin tables (admin-only access)
ALTER TABLE admin_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can access pricing rules
CREATE POLICY pricing_rules_admin_only ON admin_pricing_rules FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND user_type = 'admin'
        AND is_active = true
        AND is_deleted = false
    )
);

-- Only admins can access activity logs
CREATE POLICY activity_logs_admin_only ON admin_activity_logs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND user_type = 'admin'
        AND is_active = true
        AND is_deleted = false
    )
);

-- Platform analytics - read access for admins and providers (their own data)
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

-- Admins can read all analytics
CREATE POLICY analytics_admin_all ON platform_analytics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND user_type = 'admin'
        AND is_active = true
        AND is_deleted = false
    )
);

-- Providers can read analytics for their own plans
CREATE POLICY analytics_provider_own ON platform_analytics FOR SELECT USING (
    provider_id IN (
        SELECT id FROM meal_plan_providers
        WHERE user_id = auth.uid()
        AND is_active = true
        AND is_deleted = false
    )
);