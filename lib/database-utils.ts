import { supabase, supabaseAdmin, isSupabaseAdminConfigured } from './supabase'
import type {
  MealPlan,
  MealPlanWithCreator,
  MealPlanWithDaysAndMeals,
  User,
  UserPlanPurchase,
  MealPlanReview
} from './database-types'

// Meal Plans
export async function getMealPlans(filters?: {
  category?: string
  is_free?: boolean
  is_featured?: boolean
  creator_user_id?: string
}) {
  let query = supabase
    .from('meal_plans')
    .select(`
      *,
      creator:users!created_by_user_id(
        id,
        name,
        is_creator,
        creator_display_name,
        creator_profile_image_url,
        creator_bio,
        creator_rating,
        is_verified,
        creator_tier
      )
    `)
    .eq('is_published', true)
    .eq('is_active', true)
    .eq('is_deleted', false)

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.is_free !== undefined) {
    query = query.eq('is_free', filters.is_free)
  }
  if (filters?.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured)
  }
  if (filters?.creator_user_id) {
    query = query.eq('created_by_user_id', filters.creator_user_id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data as MealPlanWithCreator[]
}

export async function getMealPlanById(id: string) {
  const { data, error} = await supabaseAdmin
    .from('meal_plans')
    .select(`
      *,
      creator:users!created_by_user_id(
        id,
        name,
        is_creator,
        creator_display_name,
        creator_profile_image_url,
        creator_bio,
        creator_rating,
        is_verified,
        creator_tier
      ),
      meal_plan_days(
        *,
        meals(*)
      )
    `)
    .eq('id', id)
    .eq('is_published', true)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single()

  if (error) throw error
  return data as MealPlanWithDaysAndMeals
}

// User Management
export async function createUser(userData: Partial<User>) {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Admin client not available')
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(userData as any)
    .select(`
      id,
      email,
      name,
      auth_provider,
      user_type,
      subscription_tier,
      free_plans_used,
      dietary_preferences,
      is_active,
      is_deleted,
      created_at,
      updated_at,
      is_creator,
      creator_display_name,
      creator_bio,
      creator_profile_image_url,
      total_meal_plans_created,
      total_earnings,
      creator_rating,
      creator_email_verified,
      is_verified,
      creator_tier,
      social_media_links
    `)
    .single()

  if (error) throw error
  return data as User
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      auth_provider,
      user_type,
      subscription_tier,
      free_plans_used,
      dietary_preferences,
      is_active,
      is_deleted,
      created_at,
      updated_at,
      is_creator,
      creator_display_name,
      creator_bio,
      creator_profile_image_url,
      total_meal_plans_created,
      total_earnings,
      creator_rating,
      creator_email_verified,
      is_verified,
      creator_tier,
      social_media_links
    `)
    .eq('id', id)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single()

  if (error) throw error
  return data as User
}

// Creator Management
export async function enableCreatorMode(userId: string, creatorData: {
  creator_display_name: string
  creator_bio?: string
  creator_profile_image_url?: string
}) {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_creator: true,
      ...creatorData
    } as any)
    .eq('id', userId)
    .select(`
      id,
      email,
      name,
      auth_provider,
      user_type,
      subscription_tier,
      free_plans_used,
      dietary_preferences,
      is_active,
      is_deleted,
      created_at,
      updated_at,
      is_creator,
      creator_display_name,
      creator_bio,
      creator_profile_image_url,
      total_meal_plans_created,
      total_earnings,
      creator_rating,
      creator_email_verified,
      is_verified,
      creator_tier,
      social_media_links
    `)
    .single()

  if (error) throw error
  return data as User
}

export async function getCreatorProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      is_creator,
      creator_display_name,
      creator_bio,
      creator_profile_image_url,
      total_meal_plans_created,
      total_earnings,
      creator_rating,
      is_verified,
      creator_tier,
      social_media_links
    `)
    .eq('id', userId)
    .eq('is_creator', true)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single()

  if (error) return null
  return data as User
}

// Purchases
export async function createPurchase(purchaseData: Partial<UserPlanPurchase>) {
  console.log('[createPurchase] Starting purchase creation with data:', JSON.stringify(purchaseData, null, 2))

  if (!isSupabaseAdminConfigured()) {
    throw new Error('Admin client not available')
  }

  // Use admin client to bypass RLS policies since this is called from authenticated API routes
  const { data, error } = await supabaseAdmin
    .from('user_plan_purchases')
    .insert(purchaseData as any)
    .select(`
      id,
      user_id,
      meal_plan_id,
      creator_user_id,
      purchase_price,
      creator_earnings,
      platform_fee,
      stripe_payment_intent_id,
      status,
      purchased_at,
      expires_at,
      is_active,
      created_at
    `)
    .single()

  if (error) {
    console.error('[createPurchase] Error creating purchase:', error)
    throw error
  }

  console.log('[createPurchase] Purchase created successfully:', data)
  return data as UserPlanPurchase
}

export async function getUserPurchases(userId: string) {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Admin client not available')
  }

  // Use admin client to bypass RLS policies since this is called from authenticated API routes
  const { data, error } = await supabaseAdmin
    .from('user_plan_purchases')
    .select(`
      id,
      user_id,
      meal_plan_id,
      creator_user_id,
      purchase_price,
      creator_earnings,
      platform_fee,
      stripe_payment_intent_id,
      status,
      purchased_at,
      expires_at,
      is_active,
      created_at,
      meal_plan:meal_plans(*),
      creator:users!creator_user_id(
        id,
        name,
        is_creator,
        creator_display_name,
        creator_profile_image_url,
        creator_rating
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('purchased_at', { ascending: false })

  if (error) throw error
  return data
}

export async function checkUserAccess(userId: string, mealPlanId: string) {
  const { data, error } = await supabase
    .from('user_plan_purchases')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('meal_plan_id', mealPlanId)
    .eq('status', 'completed')
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (error) return false
  return !!data
}

export async function cancelPurchase(purchaseId: string) {
  console.log('[cancelPurchase] Canceling purchase:', purchaseId)

  if (!isSupabaseAdminConfigured()) {
    throw new Error('Admin client not available')
  }

  // Use admin client to bypass RLS policies since this is called from authenticated API routes
  const { data, error } = await supabaseAdmin
    .from('user_plan_purchases')
    .update({
      is_active: false
    })
    .eq('id', purchaseId)
    .select(`
      id,
      user_id,
      meal_plan_id,
      creator_user_id,
      purchase_price,
      creator_earnings,
      platform_fee,
      stripe_payment_intent_id,
      status,
      purchased_at,
      expires_at,
      is_active,
      created_at
    `)
    .single()

  if (error) {
    console.error('[cancelPurchase] Error canceling purchase:', error)
    throw error
  }

  console.log('[cancelPurchase] Purchase canceled successfully:', data)
  return data as UserPlanPurchase
}

export async function getUserActivePurchase(userId: string, mealPlanId: string) {
  const { data, error } = await supabase
    .from('user_plan_purchases')
    .select('id, meal_plan_id')
    .eq('user_id', userId)
    .eq('meal_plan_id', mealPlanId)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

// Reviews
export async function createReview(reviewData: Partial<MealPlanReview>) {
  const { data, error } = await supabase
    .from('meal_plan_reviews')
    .insert(reviewData as any)
    .select()
    .single()

  if (error) throw error
  return data as MealPlanReview
}

export async function getMealPlanReviews(mealPlanId: string) {
  const { data, error } = await supabase
    .from('meal_plan_reviews')
    .select(`
      *,
      user:users(name)
    `)
    .eq('meal_plan_id', mealPlanId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Analytics
export async function trackEvent(eventData: {
  event_type: string
  meal_plan_id?: string
  user_id?: string
  creator_user_id?: string
  session_id?: string
  metadata?: any
}) {
  if (!isSupabaseAdminConfigured()) {
    console.warn('Admin client not available for analytics tracking')
    return
  }

  // Use admin client to bypass RLS policies for analytics tracking
  const { error } = await supabaseAdmin
    .from('platform_analytics')
    .insert(eventData)

  if (error) console.error('Analytics tracking error:', error)
}

// Admin functions
export async function getPricingRules() {
  const { data, error } = await supabase
    .from('admin_pricing_rules')
    .select('*')
    .eq('is_active', true)
    .order('duration_days')

  if (error) throw error
  return data
}

export async function updateMealPlanViews(mealPlanId: string) {
  // First get current views count
  const { data: currentData } = await supabase
    .from('meal_plans')
    .select('total_views')
    .eq('id', mealPlanId)
    .single()

  if (currentData) {
    const { error } = await supabase
      .from('meal_plans')
      .update({
        total_views: (currentData.total_views || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', mealPlanId)

    if (error) console.error('Error updating views:', error)
  }
}

// Search functionality
export async function searchMealPlans(searchTerm: string) {
  const { data, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      creator:users!created_by_user_id(
        id,
        name,
        is_creator,
        creator_display_name,
        creator_profile_image_url,
        creator_bio,
        creator_rating,
        is_verified,
        creator_tier
      )
    `)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
    .eq('is_published', true)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('total_purchases', { ascending: false })

  if (error) throw error
  return data as MealPlanWithCreator[]
}