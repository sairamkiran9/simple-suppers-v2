// API Types - All API response types for Simple Suppers v2
// These types align with the API documentation in docs/api-documentation.md

// Re-export existing error types from the API errors module
export type { APIResponse, APISuccessResponse, APIErrorResponse } from './api/errors'

// ============================================================================
// Authentication Types
// ============================================================================

export interface ApiAuthUser {
  id: string
  email: string
  name: string
  user_type: string
}

export interface ApiSession {
  access_token: string
  refresh_token: string
}

export interface ApiAuthResponse {
  user: ApiAuthUser
  session: ApiSession
}

export interface ApiLoginResponse {
  user: ApiAuthUser
  token: string
}

// ============================================================================
// Meal Plan Types
// ============================================================================

export interface ApiMealPlanProvider {
  id?: string
  name?: string
  business_name?: string
  creator_display_name?: string
  profile_image_url?: string
  creator_profile_image_url?: string
  bio?: string
  creator_bio?: string
  rating?: number
  creator_rating?: number
}

export interface ApiMealPlan {
  id: string
  title: string
  description: string
  duration_days: number
  duration_type: string
  final_price: number
  category?: string
  dietary_tags: string[]
  difficulty_level: string
  is_free: boolean
  is_featured: boolean
  average_rating: number
  rating_count?: number
  total_purchases: number
  provider?: ApiMealPlanProvider
  preview_meals?: string[]
  user_has_subscribed?: boolean
  user_purchase_id?: string
}

export interface ApiMealPlansResponse {
  plans: ApiMealPlan[]
  total: number
  has_more?: boolean
  meal_plans?: ApiMealPlan[]
}

export interface ApiMeal {
  id?: string
  meal_type: string
  meal_name: string
  description?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  servings: number
  ingredients: string[]
  instructions: string
  image_url?: string
}

export interface ApiMealPlanDay {
  id?: string
  day_number: number
  day_title?: string
  meals: ApiMeal[]
}

export interface ApiMealPlanDetail {
  id: string
  title: string
  description: string
  duration_days: number
  duration_type?: string
  final_price: number
  category?: string
  dietary_tags?: string[]
  difficulty_level?: string
  is_free?: boolean
  provider?: ApiMealPlanProvider
  meal_plan_days: ApiMealPlanDay[]
  user_has_subscribed?: boolean
  user_purchase_id?: string
}

export interface ApiMealPlanDetailResponse {
  meal_plan: ApiMealPlanDetail
}

// ============================================================================
// User Types
// ============================================================================

export interface ApiUser {
  id: string
  email: string
  name: string
  user_type: string
  subscription_tier: string
  free_plans_used?: number
  dietary_preferences?: string[]
  is_active: boolean
  created_at?: string
}

export interface ApiUserProfile {
  user: ApiUser
}

export interface ApiPurchasedPlan {
  id: string
  title?: string
  provider_name?: string
  purchase_date?: string
  purchase_price?: number
  meal_plan?: {
    id: string
    title: string
    duration_days: number
  }
  purchased_at?: string
  expires_at?: string
}

export interface ApiFreePlan {
  id: string
  title: string
  provider_name: string
}

export interface ApiUserDashboard {
  user?: {
    name: string
    email: string
    subscription_tier: string
    free_plans_used: number
  }
  overview?: {
    total_purchases: number
    active_plans: number
    free_plans_remaining: number
  }
  purchased_plans: ApiPurchasedPlan[]
  free_plans: ApiFreePlan[]
  active_purchases?: ApiPurchasedPlan[]
  recommended_plans?: ApiMealPlan[]
  total_spent: number
}

// ============================================================================
// Purchase Types
// ============================================================================

export interface ApiPaymentIntent {
  id: string
  amount: number
  currency: string
  client_secret: string
}

export interface ApiPaymentIntentResponse {
  payment_intent: ApiPaymentIntent
  meal_plan: {
    id: string
    title: string
    final_price: number
  }
}

export interface ApiPurchase {
  id: string
  user_id: string
  meal_plan_id: string
  purchase_price: number
  status: string
  purchased_at: string
  expires_at: string
}

export interface ApiPurchaseConfirmation {
  purchase: ApiPurchase
}

export interface ApiPurchaseHistoryItem {
  id: string
  purchase_price: number
  purchased_at: string
  expires_at: string
  status: string
  meal_plan: {
    id: string
    title: string
    duration_days: number
  }
  provider: {
    business_name: string
  }
}

export interface ApiPurchaseHistory {
  purchases: ApiPurchaseHistoryItem[]
  total: number
}

// ============================================================================
// Shopping List Types
// ============================================================================

export interface ApiShoppingListIngredient {
  item: string
  quantity: string
  meals: string[]
}

export interface ApiShoppingListIngredients {
  [category: string]: ApiShoppingListIngredient[]
}

export interface ApiShoppingList {
  id: string
  meal_plan_id: string
  ingredients: ApiShoppingListIngredients
  generated_at: string
}

export interface ApiShoppingListResponse {
  shopping_list: ApiShoppingList
}

// ============================================================================
// Provider Types
// ============================================================================

export interface ApiProviderProfile {
  id: string
  user_id: string
  business_name: string
  bio?: string
  profile_image_url?: string
  email_verified: boolean
  is_active: boolean
  total_earnings: number
  total_plans: number
  average_rating: number
  created_at: string
}

export interface ApiProviderProfileResponse {
  provider: ApiProviderProfile
}

export interface ApiProviderDashboard {
  provider: {
    id: string
    business_name: string
    bio: string | null
    profile_image_url: string | null
    email_verified: boolean
    is_active: boolean
    total_earnings: number
    total_plans: number
    average_rating: number
  }
  analytics: {
    total_meal_plans: number
    published_plans: number
    draft_plans: number
    total_views: number
    total_sales: number
    current_month_earnings: number
    all_time_earnings: number
  }
  recent_purchases: Array<{
    id: string
    meal_plan_title: string
    customer_name: string
    customer_email: string
    purchase_price: number
    provider_earnings: number
    purchased_at: string
    status: string
  }>
  top_performing_plans: Array<{
    id: string
    title: string
    total_purchases: number
    total_views: number
    average_rating: number
    final_price: number
  }>
}

export interface ApiProviderMealPlansResponse {
  meal_plans: ApiMealPlan[]
  total: number
}

// ============================================================================
// Creator Types (new - replacing Provider types)
// ============================================================================

export interface ApiCreatorProfile {
  id: string
  name: string
  creator_display_name: string
  creator_bio: string
  creator_profile_image_url: string | null
  creator_email_verified: boolean
  is_active: boolean | null
  total_earnings: number
  total_meal_plans_created: number
  creator_rating: number
  created_at: string | null
  updated_at: string | null
}

export interface ApiCreatorProfileResponse {
  creator: ApiCreatorProfile
}

export interface ApiCreatorDashboard {
  creator: {
    id: string
    name: string
    creator_display_name: string | null
    creator_bio: string | null
    creator_profile_image_url: string | null
    creator_email_verified: boolean | null
    is_active: boolean | null
    total_earnings: number | null
    total_plans: number | null
    creator_rating: number | null
  }
  analytics: {
    total_meal_plans: number
    published_plans: number
    draft_plans: number
    total_views: number
    total_sales: number
    current_month_earnings: number
    all_time_earnings: number
  }
  recent_purchases: Array<{
    id: string
    meal_plan_title: string
    customer_name: string
    customer_email: string
    purchase_price: number
    creator_earnings: number
    purchased_at: string
    status: string
  }>
  top_performing_plans: Array<{
    id: string
    title: string
    total_purchases: number
    total_views: number
    average_rating: number
    final_price: number
  }>
}

export interface ApiCreatorMealPlansResponse {
  meal_plans: ApiMealPlan[]
  total: number
}

export interface UpdateCreatorProfileRequest {
  creator_display_name?: string
  bio?: string
  profile_image_url?: string
}

// ============================================================================
// Admin Types
// ============================================================================

export interface ApiAdminDashboard {
  overview: {
    total_users: number
    total_providers: number
    total_meal_plans: number
    total_purchases: number
    total_revenue: number
    platform_revenue: number
  }
  recent_activity?: {
    users: any[]
    meal_plans: any[]
    purchases: any[]
  }
  monthly_revenue?: {
    month: string
    total_revenue: number
    platform_revenue: number
    total_purchases: number
  }[]
}

export interface ApiAdminUsersResponse {
  users: ApiUser[]
  total: number
}

export interface ApiAdminMealPlansResponse {
  meal_plans: ApiMealPlan[]
  total: number
}

export interface ApiPricingRule {
  id: string
  duration_days: number
  base_price_per_day: number
  bulk_discount_percentage: number
  final_price: number
  provider_share_percentage: number
  is_active: boolean
  created_at: string
}

export interface ApiPricingRulesResponse {
  pricing_rules: ApiPricingRule[]
}

// ============================================================================
// Request Body Types
// ============================================================================

export interface RegisterRequest {
  email: string
  password: string
  name: string
  user_type: 'user' | 'provider'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateUserProfileRequest {
  name?: string
  dietary_preferences?: string[]
}

export interface UpdateProviderProfileRequest {
  business_name?: string
  bio?: string
  profile_image_url?: string
}

export interface CreatePaymentIntentRequest {
  meal_plan_id: string
}

export interface ConfirmPurchaseRequest {
  payment_intent_id: string
  meal_plan_id: string
}

export interface GenerateShoppingListRequest {
  meal_plan_id: string
  selected_days?: number[]
}

export interface CreatePricingRuleRequest {
  duration_days: number
  base_price_per_day: number
  bulk_discount_percentage: number
  provider_share_percentage: number
}

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface MealPlanQueryParams {
  category?: string
  duration_type?: string
  min_price?: number
  max_price?: number
  dietary_tags?: string
  search?: string
  is_free?: boolean
  limit?: number
  offset?: number
}

export interface PurchaseHistoryQueryParams {
  limit?: number
  offset?: number
}

export interface ProviderMealPlansQueryParams {
  status?: 'all' | 'published' | 'draft' | 'inactive'
  limit?: number
  offset?: number
}

export interface AdminUsersQueryParams {
  user_type?: 'user' | 'provider'
  is_active?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface AdminMealPlansQueryParams {
  status?: 'all' | 'published' | 'draft' | 'inactive' | 'deleted'
  provider_id?: string
  search?: string
  limit?: number
  offset?: number
}
