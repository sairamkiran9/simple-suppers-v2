import { NextRequest } from 'next/server'
import { CreateMealPlanSchema, validateBody, ProviderMealPlansQuerySchema, validateQuery } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Check if user is a provider
    if (user.user_type !== 'provider') {
      return ErrorResponses.forbidden('Only providers can access this endpoint')
    }

    // Get provider profile
    const { data: provider } = await supabaseAdmin
      .from('meal_plan_providers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!provider) {
      return ErrorResponses.notFound('Provider profile')
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(ProviderMealPlansQuerySchema, searchParams)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { status, limit, offset } = validation.data

    // Build query
    let query = supabaseAdmin
      .from('meal_plans')
      .select(`
        id,
        title,
        description,
        duration_days,
        duration_type,
        suggested_price,
        final_price,
        category,
        dietary_tags,
        difficulty_level,
        is_free,
        is_featured,
        is_published,
        is_active,
        total_purchases,
        total_views,
        average_rating,
        rating_count,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('provider_id', provider.id)
      .eq('is_deleted', false)

    // Apply status filter
    if (status === 'published') {
      query = query.eq('is_published', true).eq('is_active', true)
    } else if (status === 'draft') {
      query = query.eq('is_published', false)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Apply pagination and ordering
    const { data: mealPlans, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset || 0, (offset || 0) + (limit || 20) - 1)

    if (error) {
      throw new Error('Failed to fetch meal plans')
    }

    return SuccessResponses.ok({
      meal_plans: mealPlans || [],
      total: count || 0
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Check if user is a provider
    if (user.user_type !== 'provider') {
      return ErrorResponses.forbidden('Only providers can access this endpoint')
    }

    // Get provider profile
    const { data: provider } = await supabaseAdmin
      .from('meal_plan_providers')
      .select('id, total_plans')
      .eq('user_id', user.id)
      .single()

    if (!provider) {
      return ErrorResponses.notFound('Provider profile')
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(CreateMealPlanSchema, body)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const {
      title,
      description,
      duration_days,
      duration_type,
      suggested_price,
      category,
      dietary_tags,
      difficulty_level,
      is_free,
      meal_plan_days
    } = validation.data

    // Calculate final price (mock pricing logic)
    const final_price = is_free ? 0 : suggested_price * 0.95 // 5% platform discount

    // Create meal plan
    const { data: mealPlan, error: mealPlanError } = await supabaseAdmin
      .from('meal_plans')
      .insert({
        provider_id: provider.id,
        title,
        description,
        duration_days,
        duration_type,
        suggested_price,
        final_price,
        category,
        dietary_tags,
        difficulty_level,
        is_free,
        is_featured: false,
        is_published: false,
        is_active: true,
        is_deleted: false,
        total_purchases: 0,
        total_views: 0,
        average_rating: 0,
        rating_count: 0
      })
      .select()
      .single()

    if (mealPlanError) {
      throw new Error('Failed to create meal plan')
    }

    // Create meal plan days and meals
    for (const dayData of meal_plan_days) {
      const { data: mealPlanDay, error: dayError } = await supabaseAdmin
        .from('meal_plan_days')
        .insert({
          meal_plan_id: mealPlan.id,
          day_number: dayData.day_number,
          day_title: dayData.day_title
        })
        .select()
        .single()

      if (dayError) {
        throw new Error('Failed to create meal plan day')
      }

      // Create meals for this day
      for (const mealData of dayData.meals) {
        const { error: mealError } = await supabaseAdmin
          .from('meals')
          .insert({
            meal_plan_day_id: mealPlanDay.id,
            meal_type: mealData.meal_type,
            meal_name: mealData.meal_name,
            description: mealData.description,
            prep_time_minutes: mealData.prep_time_minutes,
            cook_time_minutes: mealData.cook_time_minutes,
            servings: mealData.servings,
            ingredients: JSON.stringify(mealData.ingredients),
            instructions: mealData.instructions,
            image_url: mealData.image_url,
            nutritional_info: mealData.nutritional_info
          })

        if (mealError) {
          throw new Error('Failed to create meal')
        }
      }
    }

    // Update provider total_plans count
    await supabaseAdmin
      .from('meal_plan_providers')
      .update({
        total_plans: (provider.total_plans || 0) + 1
      })
      .eq('id', provider.id)

    return SuccessResponses.created({
      meal_plan: {
        id: mealPlan.id,
        title: mealPlan.title,
        description: mealPlan.description,
        duration_days: mealPlan.duration_days,
        duration_type: mealPlan.duration_type,
        suggested_price: mealPlan.suggested_price,
        final_price: mealPlan.final_price,
        category: mealPlan.category,
        dietary_tags: mealPlan.dietary_tags,
        difficulty_level: mealPlan.difficulty_level,
        is_free: mealPlan.is_free,
        is_published: mealPlan.is_published,
        is_active: mealPlan.is_active,
        created_at: mealPlan.created_at
      }
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

// Handle unsupported methods
export async function PUT() {
  return ErrorResponses.methodNotAllowed()
}

export async function DELETE() {
  return ErrorResponses.methodNotAllowed()
}

export async function PATCH() {
  return ErrorResponses.methodNotAllowed()
}