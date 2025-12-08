import { NextRequest } from 'next/server'
import { AdminUsersQuerySchema, validateQuery } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAdmin } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const user = await requireAdmin(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(AdminUsersQuerySchema, searchParams)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { user_type, is_active, search, limit, offset } = validation.data

    // Build query
    let query = supabaseAdmin
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
        total_meal_plans_created,
        total_earnings,
        creator_rating
      `, { count: 'exact' })
      .eq('is_deleted', false)

    // Apply filters
    if (user_type) {
      query = query.eq('user_type', user_type)
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset || 0, (offset || 0) + (limit || 20) - 1)

    if (error) {
      throw new Error('Failed to fetch users')
    }

    // Transform response data
    const responseData = (users || []).map((user: any) => {
      const baseUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        auth_provider: user.auth_provider,
        user_type: user.user_type,
        subscription_tier: user.subscription_tier,
        free_plans_used: user.free_plans_used,
        dietary_preferences: user.dietary_preferences,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      }

      // Add creator info if applicable
      if (user.is_creator) {
        return {
          ...baseUser,
          creator_info: {
            creator_display_name: user.creator_display_name,
            total_earnings: user.total_earnings,
            total_plans: user.total_meal_plans_created,
            creator_rating: user.creator_rating
          }
        }
      }

      return baseUser
    })

    return SuccessResponses.ok({
      users: responseData,
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