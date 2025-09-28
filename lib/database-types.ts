// Database Types - Generated from Simple Suppers Database Schema
// Following the exact specification from docs/simple-suppers-database-schema

export interface User {
  id: string
  email: string
  name: string
  auth_provider: 'email' | 'google'
  user_type: 'user' | 'provider' | 'admin'
  subscription_tier: 'freemium' | 'premium'
  free_plans_used: number
  dietary_preferences: string[]
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface MealPlanProvider {
  id: string
  user_id: string
  business_name: string
  bio?: string
  profile_image_url?: string
  email_verified: boolean
  is_active: boolean
  is_deleted: boolean
  total_earnings: number
  total_plans: number
  average_rating: number
  created_at: string
  updated_at: string
}

export interface MealPlan {
  id: string
  provider_id: string
  title: string
  description: string
  duration_days: number
  duration_type: 'daily' | 'weekly' | 'monthly'
  suggested_price: number
  final_price: number
  category?: string
  dietary_tags: string[]
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  is_free: boolean
  is_featured: boolean
  is_published: boolean
  is_active: boolean
  is_deleted: boolean
  total_purchases: number
  total_views: number
  average_rating: number
  rating_count: number
  created_at: string
  updated_at: string
}

export interface MealPlanDay {
  id: string
  meal_plan_id: string
  day_number: number
  day_title?: string
  created_at: string
}

export interface Meal {
  id: string
  meal_plan_day_id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  meal_name: string
  description?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  servings: number
  ingredients: string // JSON array as text
  instructions: string
  image_url?: string
  nutritional_info?: any // JSONB
  created_at: string
}

export interface UserPlanPurchase {
  id: string
  user_id: string
  meal_plan_id: string
  provider_id: string
  purchase_price: number
  provider_earnings: number
  platform_fee: number
  stripe_payment_intent_id?: string
  status: 'pending' | 'completed' | 'refunded'
  purchased_at: string
  expires_at: string
  is_active: boolean
  created_at: string
}

export interface ShoppingList {
  id: string
  meal_plan_id: string
  user_id: string
  purchase_id: string
  ingredients_json: string
  list_type: 'auto' | 'custom'
  pdf_url?: string
  generated_at: string
}

export interface MealPlanReview {
  id: string
  meal_plan_id: string
  user_id: string
  purchase_id?: string
  rating: number
  review_text?: string
  is_verified_purchase: boolean
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface AdminPricingRule {
  id: string
  duration_days: number
  base_price_per_day: number
  bulk_discount_percentage: number
  final_price: number
  provider_share_percentage: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AdminActivityLog {
  id: string
  admin_user_id?: string
  action_type: string
  target_type?: string
  target_id?: string
  old_data?: any
  new_data?: any
  description?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface PlatformAnalytics {
  id: string
  event_type: string
  meal_plan_id?: string
  user_id?: string
  provider_id?: string
  session_id?: string
  metadata?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Joined types for common queries
export interface MealPlanWithProvider extends MealPlan {
  provider: MealPlanProvider
}

export interface MealPlanWithDaysAndMeals extends MealPlan {
  meal_plan_days: (MealPlanDay & {
    meals: Meal[]
  })[]
}

export interface UserWithProvider extends User {
  meal_plan_provider?: MealPlanProvider
}

export interface PurchaseWithPlan extends UserPlanPurchase {
  meal_plan: MealPlan
  provider: MealPlanProvider
}

export interface ReviewWithUser extends MealPlanReview {
  user: Pick<User, 'name'>
}

// Database utility types for Supabase
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      meal_plan_providers: {
        Row: MealPlanProvider
        Insert: Omit<MealPlanProvider, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MealPlanProvider, 'id' | 'created_at' | 'updated_at'>>
      }
      meal_plans: {
        Row: MealPlan
        Insert: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>>
      }
      meal_plan_days: {
        Row: MealPlanDay
        Insert: Omit<MealPlanDay, 'id' | 'created_at'>
        Update: Partial<Omit<MealPlanDay, 'id' | 'created_at'>>
      }
      meals: {
        Row: Meal
        Insert: Omit<Meal, 'id' | 'created_at'>
        Update: Partial<Omit<Meal, 'id' | 'created_at'>>
      }
      user_plan_purchases: {
        Row: UserPlanPurchase
        Insert: Omit<UserPlanPurchase, 'id' | 'created_at'>
        Update: Partial<Omit<UserPlanPurchase, 'id' | 'created_at'>>
      }
      shopping_lists: {
        Row: ShoppingList
        Insert: Omit<ShoppingList, 'id' | 'generated_at'>
        Update: Partial<Omit<ShoppingList, 'id' | 'generated_at'>>
      }
      meal_plan_reviews: {
        Row: MealPlanReview
        Insert: Omit<MealPlanReview, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MealPlanReview, 'id' | 'created_at' | 'updated_at'>>
      }
      admin_pricing_rules: {
        Row: AdminPricingRule
        Insert: Omit<AdminPricingRule, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AdminPricingRule, 'id' | 'created_at' | 'updated_at'>>
      }
      admin_activity_logs: {
        Row: AdminActivityLog
        Insert: Omit<AdminActivityLog, 'id' | 'created_at'>
        Update: Partial<Omit<AdminActivityLog, 'id' | 'created_at'>>
      }
      platform_analytics: {
        Row: PlatformAnalytics
        Insert: Omit<PlatformAnalytics, 'id' | 'created_at'>
        Update: Partial<Omit<PlatformAnalytics, 'id' | 'created_at'>>
      }
    }
  }
}