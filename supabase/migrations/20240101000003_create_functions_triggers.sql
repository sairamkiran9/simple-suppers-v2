-- Simple Suppers - Database Functions and Triggers
-- Following the exact specification from docs/simple-suppers-database-schema

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON meal_plan_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON meal_plan_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON admin_pricing_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update provider statistics
CREATE OR REPLACE FUNCTION update_provider_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_earnings and total_plans for provider
    UPDATE meal_plan_providers
    SET
        total_earnings = (
            SELECT COALESCE(SUM(provider_earnings), 0)
            FROM user_plan_purchases
            WHERE provider_id = NEW.provider_id AND status = 'completed'
        ),
        total_plans = (
            SELECT COUNT(*)
            FROM meal_plans
            WHERE provider_id = NEW.provider_id AND is_active = true AND is_deleted = false
        ),
        updated_at = NOW()
    WHERE id = NEW.provider_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to purchases table
CREATE TRIGGER update_provider_stats_on_purchase
    AFTER INSERT OR UPDATE ON user_plan_purchases
    FOR EACH ROW EXECUTE FUNCTION update_provider_stats();

-- Function to update meal plan average rating
CREATE OR REPLACE FUNCTION update_meal_plan_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update average_rating and rating_count for meal plan
    UPDATE meal_plans
    SET
        average_rating = (
            SELECT COALESCE(ROUND(AVG(rating::numeric), 2), 0)
            FROM meal_plan_reviews
            WHERE meal_plan_id = COALESCE(NEW.meal_plan_id, OLD.meal_plan_id)
            AND is_active = true AND is_deleted = false
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM meal_plan_reviews
            WHERE meal_plan_id = COALESCE(NEW.meal_plan_id, OLD.meal_plan_id)
            AND is_active = true AND is_deleted = false
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.meal_plan_id, OLD.meal_plan_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply trigger to reviews table
CREATE TRIGGER update_meal_plan_rating_on_review
    AFTER INSERT OR UPDATE OR DELETE ON meal_plan_reviews
    FOR EACH ROW EXECUTE FUNCTION update_meal_plan_rating();