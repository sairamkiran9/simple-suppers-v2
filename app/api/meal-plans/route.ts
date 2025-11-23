import { NextRequest } from 'next/server'
import { MealPlanQuerySchema, validateQuery } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { getCurrentUser } from '@/lib/api/auth'
import { getMealPlans, trackEvent } from '@/lib/database-utils'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get current user (optional for this endpoint)
    const user = await getCurrentUser(request)

    // Apply rate limiting
    withRateLimit(request, user?.id, user?.user_type)

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(MealPlanQuerySchema, searchParams)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const {
      category,
      duration_type,
      min_price,
      max_price,
      dietary_tags,
      search,
      is_free,
      limit,
      offset
    } = validation.data

    // Parse dietary tags if provided
    const parsedDietaryTags = dietary_tags ? dietary_tags.split(',').map(tag => tag.trim()) : undefined

    // Build filters object
    const filters: any = {}
    if (category) filters.category = category
    if (duration_type) filters.duration_type = duration_type
    if (is_free !== undefined) filters.is_free = is_free

    // Get meal plans from database
    const mealPlans = await getMealPlans(filters)

    // Apply additional filtering that's not handled by the database utils
    let filteredPlans = mealPlans

    // Price filtering
    if (min_price !== undefined || max_price !== undefined) {
      filteredPlans = filteredPlans.filter(plan => {
        if (min_price !== undefined && plan.final_price < min_price) return false
        if (max_price !== undefined && plan.final_price > max_price) return false
        return true
      })
    }

    // Dietary tags filtering
    if (parsedDietaryTags && parsedDietaryTags.length > 0) {
      filteredPlans = filteredPlans.filter(plan =>
        parsedDietaryTags.some(tag =>
          plan.dietary_tags.some(planTag =>
            planTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      )
    }

    // Search filtering
    if (search) {
      const searchLower = search.toLowerCase()
      filteredPlans = filteredPlans.filter(plan =>
        plan.title.toLowerCase().includes(searchLower) ||
        plan.description.toLowerCase().includes(searchLower) ||
        plan.category?.toLowerCase().includes(searchLower) ||
        plan.provider.business_name.toLowerCase().includes(searchLower)
      )
    }

    // Calculate total before pagination
    const total = filteredPlans.length

    // Apply pagination
    const paginatedPlans = filteredPlans.slice(offset || 0, (offset || 0) + (limit || 20))

    // Get user's active purchases if authenticated (using admin client for performance)
    let userPurchases: Map<string, string> = new Map()
    if (user) {
      const { data: purchases } = await supabaseAdmin
        .from('user_plan_purchases')
        .select('id, meal_plan_id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (purchases) {
        userPurchases = new Map(purchases.map((p: { meal_plan_id: string; id: string }) => [p.meal_plan_id, p.id]))
      }
    }

    // Transform response to match API spec
    const responseData = paginatedPlans.map(plan => ({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      duration_days: plan.duration_days,
      duration_type: plan.duration_type,
      final_price: plan.final_price,
      category: plan.category,
      dietary_tags: plan.dietary_tags,
      difficulty_level: plan.difficulty_level,
      is_free: plan.is_free,
      is_featured: plan.is_featured,
      average_rating: plan.average_rating,
      total_purchases: plan.total_purchases,
      provider: {
        name: plan.provider.business_name,
        profile_image_url: plan.provider.profile_image_url
      },
      preview_meals: [], // We'll populate this with sample meal names
      user_has_subscribed: user ? userPurchases.has(plan.id) : undefined,
      user_purchase_id: user ? userPurchases.get(plan.id) : undefined
    }))

    // Track analytics event if user is present
    if (user) {
      await trackEvent({
        event_type: 'browse_meal_plans',
        user_id: user.id,
        metadata: {
          filters,
          search,
          results_count: responseData.length
        }
      })
    }

    return SuccessResponses.ok({
      meal_plans: responseData,
      total,
      has_more: ((offset || 0) + (limit || 20)) < total
    })

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