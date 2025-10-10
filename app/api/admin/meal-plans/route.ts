import { NextRequest } from 'next/server'
import { AdminMealPlansQuerySchema, validateQuery } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAdmin } from '@/lib/api/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const user = await requireAdmin(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(AdminMealPlansQuerySchema, searchParams)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { status, provider_id, search, limit, offset } = validation.data

    // Build query
    let query = supabase
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
        is_deleted,
        total_purchases,
        total_views,
        average_rating,
        rating_count,
        created_at,
        updated_at,
        provider:meal_plan_providers(id, business_name, user_id)
      `, { count: 'exact' })

    // Apply filters
    if (status === 'published') {
      query = query.eq('is_published', true).eq('is_active', true).eq('is_deleted', false)
    } else if (status === 'draft') {
      query = query.eq('is_published', false).eq('is_deleted', false)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false).eq('is_deleted', false)
    } else if (status === 'deleted') {
      query = query.eq('is_deleted', true)
    } else {
      // Default to non-deleted plans
      query = query.eq('is_deleted', false)
    }

    if (provider_id) {
      query = query.eq('provider_id', provider_id)
    }

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    const { data: mealPlans, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset || 0, (offset || 0) + (limit || 20) - 1)

    if (error) {
      throw new Error('Failed to fetch meal plans')
    }

    // Transform response data
    const responseData = (mealPlans || []).map((plan: any) => ({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      duration_days: plan.duration_days,
      duration_type: plan.duration_type,
      suggested_price: plan.suggested_price,
      final_price: plan.final_price,
      category: plan.category,
      dietary_tags: plan.dietary_tags,
      difficulty_level: plan.difficulty_level,
      is_free: plan.is_free,
      is_featured: plan.is_featured,
      is_published: plan.is_published,
      is_active: plan.is_active,
      is_deleted: plan.is_deleted,
      total_purchases: plan.total_purchases,
      total_views: plan.total_views,
      average_rating: plan.average_rating,
      rating_count: plan.rating_count,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      provider: {
        id: plan.provider?.id,
        business_name: plan.provider?.business_name || 'Unknown Provider',
        user_id: plan.provider?.user_id
      }
    }))

    return SuccessResponses.ok({
      meal_plans: responseData,
      total: count || 0
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