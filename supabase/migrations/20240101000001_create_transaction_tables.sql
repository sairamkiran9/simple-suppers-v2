-- Simple Suppers - Transaction and Engagement Tables Migration
-- Following the exact specification from docs/simple-suppers-database-schema

-- 6. User plan purchases (with 3-month expiry)
CREATE TABLE user_plan_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES meal_plan_providers(id) ON DELETE CASCADE,
    purchase_price DECIMAL(10,2) NOT NULL CHECK (purchase_price >= 0),
    provider_earnings DECIMAL(10,2) NOT NULL CHECK (provider_earnings >= 0),
    platform_fee DECIMAL(10,2) NOT NULL CHECK (platform_fee >= 0),
    stripe_payment_intent_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'refunded'
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_purchase_status CHECK (status IN ('pending', 'completed', 'refunded')),
    CONSTRAINT unique_active_purchase UNIQUE(user_id, meal_plan_id, is_active)
);

-- Indexes for purchases table
CREATE INDEX idx_purchases_user ON user_plan_purchases(user_id);
CREATE INDEX idx_purchases_plan ON user_plan_purchases(meal_plan_id);
CREATE INDEX idx_purchases_provider ON user_plan_purchases(provider_id);
CREATE INDEX idx_purchases_status ON user_plan_purchases(status);
CREATE INDEX idx_purchases_date ON user_plan_purchases(purchased_at DESC);
CREATE INDEX idx_purchases_expiry ON user_plan_purchases(expires_at);
CREATE INDEX idx_purchases_active ON user_plan_purchases(is_active);

-- 7. Generated shopping lists (stored for download/history)
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES user_plan_purchases(id) ON DELETE CASCADE,
    ingredients_json TEXT NOT NULL, -- JSON structure with categorized ingredients
    list_type VARCHAR(50) DEFAULT 'auto', -- 'auto', 'custom'
    pdf_url VARCHAR(500), -- URL to generated PDF in Supabase Storage
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_list_type CHECK (list_type IN ('auto', 'custom'))
);

-- Indexes for shopping lists
CREATE INDEX idx_shopping_lists_plan ON shopping_lists(meal_plan_id);
CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_purchase ON shopping_lists(purchase_id);
CREATE INDEX idx_shopping_lists_date ON shopping_lists(generated_at DESC);

-- 8. Reviews and ratings (only purchasers for premium plans, anyone for free plans)
CREATE TABLE meal_plan_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES user_plan_purchases(id) ON DELETE CASCADE, -- NULL for free plan reviews
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_review_per_user_plan UNIQUE(user_id, meal_plan_id)
);

-- Indexes for reviews table
CREATE INDEX idx_reviews_plan ON meal_plan_reviews(meal_plan_id);
CREATE INDEX idx_reviews_user ON meal_plan_reviews(user_id);
CREATE INDEX idx_reviews_rating ON meal_plan_reviews(rating);
CREATE INDEX idx_reviews_verified ON meal_plan_reviews(is_verified_purchase);
CREATE INDEX idx_reviews_active ON meal_plan_reviews(is_active, is_deleted);
CREATE INDEX idx_reviews_date ON meal_plan_reviews(created_at DESC);