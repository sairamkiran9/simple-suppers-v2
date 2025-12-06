import { NextRequest } from 'next/server'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { getCurrentUser, checkMealPlanAccess } from '@/lib/api/auth'
import { getMealPlanById, updateMealPlanViews, trackEvent } from '@/lib/database-utils'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface Params {
  id: string
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = params

    // Get current user (optional for this endpoint)
    const user = await getCurrentUser(request)

    // Apply rate limiting
    withRateLimit(request, user?.id, user?.user_type)

    // Get meal plan from database
    const mealPlan = await getMealPlanById(id)

    if (!mealPlan) {
      return ErrorResponses.notFound('Meal plan')
    }

    // Track view
    await updateMealPlanViews(id)

    // Check user access level and subscription status
    let accessLevel: 'preview' | 'full' = 'preview'
    let userHasPurchased = false
    let userPurchaseId: string | undefined = undefined

    if (user) {
      const accessCheck = await checkMealPlanAccess(user.id, id)
      if (accessCheck.hasAccess) {
        accessLevel = 'full'
        userHasPurchased = accessCheck.accessType === 'purchased'
      }

      // Get user's active purchase for this plan (using admin client for performance)
      if (supabaseAdmin) {
        const { data: activePurchase } = await supabaseAdmin
          .from('user_plan_purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('meal_plan_id', id)
          .eq('is_active', true)
          .single()

        if (activePurchase) {
          userPurchaseId = activePurchase.id
        }
      }


    } else if (mealPlan.is_free) {
      // Free plans have full access for everyone
      accessLevel = 'full'
    }

    // Track analytics event
    if (user) {
      await trackEvent({
        event_type: 'view_meal_plan',
        user_id: user.id,
        meal_plan_id: id,
        metadata: {
          access_level: accessLevel,
          user_has_purchased: userHasPurchased
        }
      })
    }

    // Return preview or full data based on access level
    if (accessLevel === 'preview') {
      // Preview mode - limited meal plan days (first 2 days only)
      const previewDays = mealPlan.meal_plan_days.slice(0, 2).map(day => ({
        id: day.id,
        day_number: day.day_number,
        day_title: day.day_title,
        meals: day.meals.slice(0, 2).map(meal => ({
          id: meal.id,
          meal_type: meal.meal_type,
          meal_name: meal.meal_name,
          description: meal.description,
          prep_time_minutes: meal.prep_time_minutes,
          cook_time_minutes: meal.cook_time_minutes,
          servings: meal.servings,
          ingredients: typeof meal.ingredients === 'string'
            ? JSON.parse(meal.ingredients)
            : meal.ingredients,
          instructions: meal.instructions,
          image_url: meal.image_url
        }))
      }))

      return SuccessResponses.ok({
        id: mealPlan.id,
        title: mealPlan.title,
        description: mealPlan.description,
        duration_days: mealPlan.duration_days,
        duration_type: mealPlan.duration_type,
        final_price: mealPlan.final_price,
        category: mealPlan.category,
        dietary_tags: mealPlan.dietary_tags,
        difficulty_level: mealPlan.difficulty_level,
        is_free: mealPlan.is_free,
        provider: mealPlan.creator ? {
          id: mealPlan.creator.id,
          name: mealPlan.creator.creator_display_name || mealPlan.creator.name,
          creator_display_name: mealPlan.creator.creator_display_name,
          bio: mealPlan.creator.creator_bio,
          profile_image_url: mealPlan.creator.creator_profile_image_url,
          creator_profile_image_url: mealPlan.creator.creator_profile_image_url,
          rating: mealPlan.creator.creator_rating,
          creator_rating: mealPlan.creator.creator_rating,
          is_verified: mealPlan.creator.is_verified,
          tier: mealPlan.creator.creator_tier
        } : undefined,
        meal_plan_days: previewDays,
        user_has_subscribed: user ? !!userPurchaseId : undefined,
        user_purchase_id: user ? userPurchaseId : undefined
      })
    }

    // Full access mode - complete information
    const fullDays = mealPlan.meal_plan_days.map(day => ({
      id: day.id,
      day_number: day.day_number,
      day_title: day.day_title,
      meals: day.meals.map(meal => ({
        id: meal.id,
        meal_type: meal.meal_type,
        meal_name: meal.meal_name,
        description: meal.description,
        prep_time_minutes: meal.prep_time_minutes,
        cook_time_minutes: meal.cook_time_minutes,
        servings: meal.servings,
        ingredients: typeof meal.ingredients === 'string'
          ? JSON.parse(meal.ingredients)
          : meal.ingredients,
        instructions: meal.instructions,
        image_url: meal.image_url
      }))
    }))

    const response = SuccessResponses.ok({
      id: mealPlan.id,
      title: mealPlan.title,
      description: mealPlan.description,
      duration_days: mealPlan.duration_days,
      duration_type: mealPlan.duration_type,
      final_price: mealPlan.final_price,
      category: mealPlan.category,
      dietary_tags: mealPlan.dietary_tags,
      difficulty_level: mealPlan.difficulty_level,
      is_free: mealPlan.is_free,
      provider: mealPlan.creator ? {
        id: mealPlan.creator.id,
        name: mealPlan.creator.creator_display_name || mealPlan.creator.name,
        creator_display_name: mealPlan.creator.creator_display_name,
        bio: mealPlan.creator.creator_bio,
        creator_bio: mealPlan.creator.creator_bio,
        profile_image_url: mealPlan.creator.creator_profile_image_url,
        creator_profile_image_url: mealPlan.creator.creator_profile_image_url,
        rating: mealPlan.creator.creator_rating,
        creator_rating: mealPlan.creator.creator_rating,
        is_verified: mealPlan.creator.is_verified,
        tier: mealPlan.creator.creator_tier
      } : undefined,
      meal_plan_days: fullDays,
      user_has_subscribed: user ? !!userPurchaseId : undefined,
      user_purchase_id: user ? userPurchaseId : undefined
    })

    // Add browser-only cache header (no edge caching)
    // 10 minutes cache for meal plan details
    response.headers.set('Cache-Control', 'max-age=600, private')

    return response

  } catch (error) {
    return handleAPIError(error)
  }
}

// Handle unsupported methods
export async function POST() {
  return ErrorResponses.validation('Method not allowed')
}

export async function PUT() {
  return ErrorResponses.validation('Method not allowed')
}

export async function DELETE() {
  return ErrorResponses.validation('Method not allowed')
}

export async function PATCH() {
  return ErrorResponses.validation('Method not allowed')
}