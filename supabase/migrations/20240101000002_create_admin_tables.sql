-- Simple Suppers - Admin and Analytics Tables Migration
-- Following the exact specification from docs/simple-suppers-database-schema

-- 9. Admin-controlled pricing rules (final pricing authority)
CREATE TABLE admin_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duration_days INTEGER NOT NULL UNIQUE CHECK (duration_days > 0),
    base_price_per_day DECIMAL(10,2) NOT NULL CHECK (base_price_per_day > 0),
    bulk_discount_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (bulk_discount_percentage >= 0 AND bulk_discount_percentage <= 100),
    final_price DECIMAL(10,2) NOT NULL CHECK (final_price > 0),
    provider_share_percentage DECIMAL(5,2) DEFAULT 70.00 CHECK (provider_share_percentage >= 0 AND provider_share_percentage <= 100),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pricing rules
CREATE INDEX idx_pricing_rules_duration ON admin_pricing_rules(duration_days);
CREATE INDEX idx_pricing_rules_active ON admin_pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_created_by ON admin_pricing_rules(created_by);

-- 10. Activity logs for admin actions (who did what when)
CREATE TABLE admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- 'create_user', 'delete_meal_plan', 'update_pricing', etc.
    target_type VARCHAR(100), -- 'user', 'meal_plan', 'provider', 'pricing_rule'
    target_id UUID, -- ID of the affected entity
    old_data JSONB, -- Previous state (for updates/deletes)
    new_data JSONB, -- New state (for creates/updates)
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for activity logs
CREATE INDEX idx_activity_logs_admin ON admin_activity_logs(admin_user_id);
CREATE INDEX idx_activity_logs_action ON admin_activity_logs(action_type);
CREATE INDEX idx_activity_logs_target ON admin_activity_logs(target_type, target_id);
CREATE INDEX idx_activity_logs_date ON admin_activity_logs(created_at DESC);

-- 11. Platform analytics (for future use, not MVP critical)
CREATE TABLE platform_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- 'view', 'purchase', 'download', 'search'
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES meal_plan_providers(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    metadata JSONB, -- Additional event data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics (partitioned by date for performance)
CREATE INDEX idx_analytics_event ON platform_analytics(event_type, created_at DESC);
CREATE INDEX idx_analytics_plan ON platform_analytics(meal_plan_id, created_at DESC);
CREATE INDEX idx_analytics_user ON platform_analytics(user_id, created_at DESC);
CREATE INDEX idx_analytics_provider ON platform_analytics(provider_id, created_at DESC);