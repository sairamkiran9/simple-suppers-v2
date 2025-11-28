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
  // Creator fields
  is_creator: boolean
  creator_display_name?: string
  creator_bio?: string
  creator_profile_image_url?: string
  total_meal_plans_created: number
  total_earnings: number
  creator_rating: number
  creator_email_verified: boolean
  // Enhanced creator fields
  is_verified: boolean
  creator_tier?: 'bronze' | 'silver' | 'gold' | null
  social_media_links?: Record<string, string> // JSONB
}

// MealPlanProvider interface removed - creators are now part of User interface

export interface MealPlan {
  id: string
  created_by_user_id: string
  creator_name?: string // Denormalized for performance
  creator_bio?: string // Denormalized for performance
  creator_avatar_url?: string // Denormalized for performance
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
  creator_user_id: string
  purchase_price: number
  creator_earnings: number
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
  creator_user_id?: string
  session_id?: string
  metadata?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Feed Types
export interface FeedPost {
  id: string
  author_id: string
  // author_type removed - determine from users.is_creator instead
  post_type: 'meal_plan' | 'recipe_tip' | 'announcement'
  title: string
  content: string
  image_url: string | null
  related_meal_plan_id: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  views_count: number
  tags: string[]
  is_pinned: boolean
  is_featured: boolean
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  published_at: string
}

export interface FeedLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface FeedComment {
  id: string
  post_id: string
  user_id: string
  content: string
  parent_comment_id: string | null
  likes_count: number
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface FeedCommentLike {
  id: string
  comment_id: string
  user_id: string
  created_at: string
}

export interface FeedFollow {
  id: string
  follower_user_id: string
  following_user_id: string // Updated from following_provider_id
  created_at: string
}

export interface FeedShare {
  id: string
  post_id: string
  user_id: string | null
  share_platform: string | null
  created_at: string
}

// Extended feed types with joined data
export interface FeedPostWithAuthor extends FeedPost {
  author: {
    id: string
    name: string
    email: string
    user_type: string
    // Creator info (if author is a creator)
    is_creator: boolean
    creator_display_name?: string
    creator_profile_image_url?: string | null
    creator_bio?: string | null
    is_verified?: boolean
    creator_tier?: 'bronze' | 'silver' | 'gold' | null
  }
  meal_plan?: {
    id: string
    title: string
    final_price: number
    suggested_price: number
    is_free: boolean
  }
  user_has_liked: boolean
  user_is_following: boolean
}

export interface FeedCommentWithAuthor extends FeedComment {
  author: {
    id: string
    name: string
  }
  user_has_liked: boolean
}

// Joined types for common queries
export interface MealPlanWithCreator extends MealPlan {
  creator: Pick<User, 'id' | 'name' | 'is_creator' | 'creator_display_name' | 'creator_profile_image_url' | 'creator_bio' | 'creator_rating' | 'is_verified' | 'creator_tier'>
}

export interface MealPlanWithDaysAndMeals extends MealPlan {
  creator: Pick<User, 'id' | 'name' | 'is_creator' | 'creator_display_name' | 'creator_profile_image_url' | 'creator_bio' | 'creator_rating' | 'is_verified' | 'creator_tier'>
  meal_plan_days: (MealPlanDay & {
    meals: Meal[]
  })[]
}

// UserWithProvider interface removed - creator info is now in User interface

export interface PurchaseWithPlan extends UserPlanPurchase {
  meal_plan: MealPlan
  creator: Pick<User, 'id' | 'name' | 'is_creator' | 'creator_display_name' | 'creator_profile_image_url' | 'creator_rating'>
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
      // meal_plan_providers table removed - creators are now part of users
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
      feed_posts: {
        Row: FeedPost
        Insert: Omit<FeedPost, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FeedPost, 'id' | 'created_at' | 'updated_at'>>
      }
      feed_likes: {
        Row: FeedLike
        Insert: Omit<FeedLike, 'id' | 'created_at'>
        Update: Partial<Omit<FeedLike, 'id' | 'created_at'>>
      }
      feed_comments: {
        Row: FeedComment
        Insert: Omit<FeedComment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FeedComment, 'id' | 'created_at' | 'updated_at'>>
      }
      feed_comment_likes: {
        Row: FeedCommentLike
        Insert: Omit<FeedCommentLike, 'id' | 'created_at'>
        Update: Partial<Omit<FeedCommentLike, 'id' | 'created_at'>>
      }
      feed_follows: {
        Row: FeedFollow
        Insert: Omit<FeedFollow, 'id' | 'created_at'>
        Update: Partial<Omit<FeedFollow, 'id' | 'created_at'>>
      }
      feed_shares: {
        Row: FeedShare
        Insert: Omit<FeedShare, 'id' | 'created_at'>
        Update: Partial<Omit<FeedShare, 'id' | 'created_at'>>
      }
    }
  }
}