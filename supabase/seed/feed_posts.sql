-- Sample feed posts for development/testing
-- Note: Replace UUIDs with actual user/provider IDs from your database

-- Insert sample feed posts (assuming provider IDs exist)
INSERT INTO feed_posts (author_id, author_type, post_type, title, content, tags, likes_count, comments_count)
VALUES
  -- Recipe tip posts
  ('00000000-0000-0000-0000-000000000001', 'provider', 'recipe_tip', 'Secret to Perfect Pasta', 'Always save pasta water! The starchy water helps your sauce stick better. Pro tip from a chef with 20 years experience. Use about 1/2 cup of pasta water and add it gradually to your sauce.', ARRAY['tips', 'pasta', 'italian'], 89, 21),
  
  ('00000000-0000-0000-0000-000000000002', 'provider', 'recipe_tip', 'Quick Marinade for Chicken', 'Mix olive oil, lemon juice, garlic, and herbs for an amazing 15-minute chicken marinade. Perfect for busy weeknights!', ARRAY['chicken', 'quick', 'marinade'], 67, 15),
  
  -- Meal plan promotions
  ('00000000-0000-0000-0000-000000000001', 'provider', 'meal_plan', 'Quick Weeknight Dinners', '7 delicious 30-minute meals perfect for busy families. Includes shopping list and prep tips! Each recipe serves 4 and uses common ingredients you can find at any grocery store.', ARRAY['quick', 'family-friendly', 'easy'], 120, 34),
  
  ('00000000-0000-0000-0000-000000000003', 'provider', 'meal_plan', 'Mediterranean Diet Made Easy', 'Discover the health benefits of Mediterranean cuisine with our 14-day meal plan. Fresh ingredients, bold flavors, and heart-healthy recipes.', ARRAY['mediterranean', 'healthy', 'diet'], 95, 28),
  
  -- Announcements
  ('00000000-0000-0000-0000-000000000002', 'provider', 'announcement', 'New Gluten-Free Plans Available!', 'Excited to announce my new line of celiac-safe meal plans. No cross-contamination worries! All recipes have been tested in a dedicated gluten-free kitchen.', ARRAY['gluten-free', 'announcement'], 156, 45),
  
  ('00000000-0000-0000-0000-000000000003', 'provider', 'announcement', 'Holiday Cooking Workshop', 'Join me for a virtual holiday cooking workshop this Saturday! We''ll make 3 festive dishes perfect for your holiday table. Link in bio to register.', ARRAY['workshop', 'holiday', 'cooking'], 78, 19);

-- Insert some sample likes (assuming user IDs exist)
INSERT INTO feed_likes (post_id, user_id)
SELECT 
  fp.id,
  '00000000-0000-0000-0000-000000000004'
FROM feed_posts fp
WHERE fp.title IN ('Secret to Perfect Pasta', 'Quick Weeknight Dinners');

-- Insert some sample comments (assuming user IDs exist)
INSERT INTO feed_comments (post_id, user_id, content)
SELECT 
  fp.id,
  '00000000-0000-0000-0000-000000000004',
  'This is such a great tip! I never thought to save the pasta water.'
FROM feed_posts fp
WHERE fp.title = 'Secret to Perfect Pasta';

INSERT INTO feed_comments (post_id, user_id, content)
SELECT 
  fp.id,
  '00000000-0000-0000-0000-000000000005',
  'Love this meal plan! My family has been enjoying these recipes all week.'
FROM feed_posts fp
WHERE fp.title = 'Quick Weeknight Dinners';