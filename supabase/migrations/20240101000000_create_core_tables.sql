-- Simple Suppers - Core Database Tables Migration
-- Following the exact specification from docs/simple-suppers-database-schema

-- 1. Users table (supports both customers and providers in single account)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    auth_provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google'
    user_type VARCHAR(50) DEFAULT 'user', -- 'user', 'provider', 'admin'
    subscription_tier VARCHAR(50) DEFAULT 'freemium', -- 'freemium', 'premium'
    free_plans_used INTEGER DEFAULT 0,
    dietary_preferences TEXT[], -- Array of dietary preferences
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_active ON users(is_active, is_deleted);
CREATE INDEX idx_users_subscription ON users(subscription_tier);

-- 2. Meal plan providers (extended profile for users who create content)
CREATE TABLE meal_plan_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_image_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_plans INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_active_provider_per_user UNIQUE(user_id)
);

-- Indexes for providers table
CREATE INDEX idx_providers_user_id ON meal_plan_providers(user_id);
CREATE INDEX idx_providers_active ON meal_plan_providers(is_active, is_deleted);
CREATE INDEX idx_providers_earnings ON meal_plan_providers(total_earnings DESC);

-- 3. Meal plans (flexible duration: daily, weekly, monthly)
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES meal_plan_providers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    duration_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    suggested_price DECIMAL(10,2) NOT NULL, -- Provider's suggested price
    final_price DECIMAL(10,2) NOT NULL, -- Admin-set final price
    category VARCHAR(100), -- 'breakfast', 'dinner', 'healthy', 'budget', etc.
    dietary_tags TEXT[], -- ['gluten-free', 'vegan', 'keto', 'low-carb']
    difficulty_level VARCHAR(50) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
    is_free BOOLEAN DEFAULT false, -- For freemium plans
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    total_purchases INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_duration_type CHECK (duration_type IN ('daily', 'weekly', 'monthly'))
);

-- Indexes for meal plans table
CREATE INDEX idx_meal_plans_provider ON meal_plans(provider_id);
CREATE INDEX idx_meal_plans_active ON meal_plans(is_active, is_deleted, is_published);
CREATE INDEX idx_meal_plans_category ON meal_plans(category);
CREATE INDEX idx_meal_plans_free ON meal_plans(is_free);
CREATE INDEX idx_meal_plans_featured ON meal_plans(is_featured);
CREATE INDEX idx_meal_plans_duration ON meal_plans(duration_type, duration_days);
CREATE INDEX idx_meal_plans_price ON meal_plans(final_price);
CREATE INDEX idx_meal_plans_rating ON meal_plans(average_rating DESC);
CREATE INDEX idx_meal_plans_popularity ON meal_plans(total_purchases DESC);
CREATE INDEX idx_meal_plans_dietary_tags ON meal_plans USING gin(dietary_tags);

-- 4. Meal plan days (flexible structure for any duration)
CREATE TABLE meal_plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number > 0),
    day_title VARCHAR(100), -- 'Monday', 'Day 1', 'Week 1 - Monday', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_day_per_plan UNIQUE(meal_plan_id, day_number)
);

-- Indexes for meal plan days
CREATE INDEX idx_meal_plan_days_plan ON meal_plan_days(meal_plan_id, day_number);

-- 5. Individual meals within a day
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_day_id UUID REFERENCES meal_plan_days(id) ON DELETE CASCADE,
    meal_type VARCHAR(50) NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
    meal_name VARCHAR(255) NOT NULL,
    description TEXT,
    prep_time_minutes INTEGER CHECK (prep_time_minutes >= 0),
    cook_time_minutes INTEGER CHECK (cook_time_minutes >= 0),
    servings INTEGER DEFAULT 1 CHECK (servings > 0),
    ingredients TEXT NOT NULL, -- JSON array as text: ["1 cup rice", "2 tbsp oil"]
    instructions TEXT NOT NULL,
    image_url VARCHAR(500),
    nutritional_info JSONB, -- Optional: {"calories": 350, "protein": 25}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))
);

-- Indexes for meals table
CREATE INDEX idx_meals_day ON meals(meal_plan_day_id);
CREATE INDEX idx_meals_type ON meals(meal_type);