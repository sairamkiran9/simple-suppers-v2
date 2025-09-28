-- Simple Suppers - Sample Data Migration
-- Following the exact specification from docs/simple-suppers-database-schema

-- Create admin user
INSERT INTO users (id, email, name, user_type) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@simplesuppers.com', 'Admin User', 'admin');

-- Default pricing rules
INSERT INTO admin_pricing_rules (duration_days, base_price_per_day, bulk_discount_percentage, final_price, provider_share_percentage, created_by) VALUES
(1, 6.00, 0.00, 6.00, 70.00, '550e8400-e29b-41d4-a716-446655440000'),
(7, 6.00, 15.00, 35.00, 70.00, '550e8400-e29b-41d4-a716-446655440000'),
(14, 6.00, 25.00, 63.00, 70.00, '550e8400-e29b-41d4-a716-446655440000'),
(30, 6.00, 30.00, 126.00, 70.00, '550e8400-e29b-41d4-a716-446655440000');

-- Sample users who are also providers
INSERT INTO users (id, email, name, user_type) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'mom5kitchen@gmail.com', 'Sarah Johnson', 'provider'),
('550e8400-e29b-41d4-a716-446655440002', 'healthycampus@gmail.com', 'Mike Chen', 'provider'),
('550e8400-e29b-41d4-a716-446655440003', 'busymom@gmail.com', 'Jennifer Williams', 'provider');

-- Sample providers
INSERT INTO meal_plan_providers (id, user_id, business_name, bio, email_verified) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Mom of Five Kitchen', 'Practical meals for busy families on a budget. Real solutions from a real mom.', true),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Healthy Campus Chef', 'Nutritious, dorm-friendly meals for college students with dietary restrictions.', true),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Busy Mom Solutions', '30-minute meals that kids will actually eat. No more dinner battles!', true);

-- Sample meal plans
INSERT INTO meal_plans (id, provider_id, title, description, duration_days, duration_type, suggested_price, final_price, category, dietary_tags, is_free, is_featured) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Quick & Cheap Weekly Meals', '7 dinners and 7 lunch ideas, all under $15 total cost per day. Perfect for families on a tight budget.', 7, 'weekly', 40.00, 35.00, 'budget-friendly', '{"family", "budget", "quick"}', false, true),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Gluten-Free College Meals', 'Dorm-kitchen approved meals for celiac and gluten-sensitive students. Simple, nutritious, and affordable.', 7, 'weekly', 40.00, 35.00, 'dietary', '{"gluten-free", "dorm-friendly", "budget", "college"}', false, false),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '30-Minute Family Dinners', 'Quick dinners that kids will actually eat - all under 30 minutes prep and cook time.', 7, 'weekly', 40.00, 35.00, 'family', '{"quick", "family", "kid-friendly"}', false, true),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', 'Emergency Meal Plans', '3 super quick meals for those crazy days when you forgot to plan dinner.', 3, 'daily', 20.00, 18.00, 'emergency', '{"quick", "emergency", "simple"}', true, false);

-- Sample meal plan days for first plan
INSERT INTO meal_plan_days (id, meal_plan_id, day_number, day_title) VALUES
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 1, 'Monday'),
('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 2, 'Tuesday'),
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 3, 'Wednesday'),
('850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440001', 4, 'Thursday'),
('850e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440001', 5, 'Friday'),
('850e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440001', 6, 'Saturday'),
('850e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440001', 7, 'Sunday');

-- Sample meals for Monday (first plan)
INSERT INTO meals (meal_plan_day_id, meal_type, meal_name, description, prep_time_minutes, cook_time_minutes, servings, ingredients, instructions) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'lunch', 'Simple Pasta Salad', 'Easy pasta salad perfect for lunch prep', 15, 10, 4, '["1 lb pasta", "1/2 cup olive oil", "1/4 cup vinegar", "1 cup cherry tomatoes", "1/2 cup cheese"]', '1. Cook pasta according to package directions. 2. Mix oil and vinegar. 3. Combine all ingredients. 4. Chill before serving.'),
('850e8400-e29b-41d4-a716-446655440001', 'dinner', 'Spaghetti with Meat Sauce', 'Classic family dinner that everyone loves', 10, 30, 6, '["1 lb spaghetti", "1 lb ground beef", "1 jar marinara sauce", "1 onion diced", "2 cloves garlic", "Parmesan cheese"]', '1. Brown ground beef with onions and garlic. 2. Add marinara sauce and simmer 20 minutes. 3. Cook spaghetti according to package directions. 4. Serve with cheese.');

-- Sample meals for Tuesday (first plan)
INSERT INTO meals (meal_plan_day_id, meal_type, meal_name, description, prep_time_minutes, cook_time_minutes, servings, ingredients, instructions) VALUES
('850e8400-e29b-41d4-a716-446655440002', 'lunch', 'Chicken Salad', 'Quick chicken salad using leftover chicken', 10, 0, 4, '["2 cups cooked chicken", "1/2 cup mayo", "1 celery stalk diced", "1/4 cup grapes", "Salt and pepper"]', '1. Dice cooked chicken. 2. Mix with mayo, celery, and grapes. 3. Season with salt and pepper. 4. Serve on bread or crackers.'),
('850e8400-e29b-41d4-a716-446655440002', 'dinner', 'Chicken Stir Fry', 'Fast and healthy dinner with vegetables', 15, 10, 4, '["1 lb chicken breast", "2 cups mixed vegetables", "2 tbsp soy sauce", "1 tbsp oil", "2 cups rice"]', '1. Cook rice. 2. Heat oil in large pan. 3. Cook chicken until done. 4. Add vegetables and stir fry. 5. Add soy sauce and serve over rice.');

-- Sample regular users
INSERT INTO users (id, email, name, user_type, subscription_tier, free_plans_used) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'john.dad@gmail.com', 'John Davis', 'user', 'freemium', 1),
('550e8400-e29b-41d4-a716-446655440011', 'maria.student@university.edu', 'Maria Santos', 'user', 'freemium', 2),
('550e8400-e29b-41d4-a716-446655440012', 'sarah.mom@gmail.com', 'Sarah Miller', 'user', 'premium', 0);

-- Sample purchases
INSERT INTO user_plan_purchases (user_id, meal_plan_id, provider_id, purchase_price, provider_earnings, platform_fee, status) VALUES
('550e8400-e29b-41d4-a716-446655440010', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 35.00, 24.50, 10.50, 'completed'),
('550e8400-e29b-41d4-a716-446655440012', '750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 35.00, 24.50, 10.50, 'completed');

-- Sample reviews
INSERT INTO meal_plan_reviews (meal_plan_id, user_id, purchase_id, rating, review_text, is_verified_purchase) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM user_plan_purchases WHERE user_id = '550e8400-e29b-41d4-a716-446655440010' LIMIT 1), 5, 'Amazing value! Fed my family for a week under budget. The pasta salad was a hit!', true),
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440011', NULL, 4, 'Great for emergency dinners. Simple ingredients I always have on hand.', false);