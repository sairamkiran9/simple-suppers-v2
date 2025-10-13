-- Fix unique_active_purchase constraint to allow multiple inactive purchases
-- Only enforce uniqueness for active purchases

-- Drop the old constraint that includes is_active in the uniqueness check
ALTER TABLE user_plan_purchases DROP CONSTRAINT unique_active_purchase;

-- Create a partial unique index that only applies when is_active = true
-- This allows multiple canceled/inactive purchases but only ONE active subscription per user per meal plan
CREATE UNIQUE INDEX unique_active_purchase ON user_plan_purchases(user_id, meal_plan_id)
WHERE is_active = true;
