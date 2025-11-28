import { NextRequest } from 'next/server'
import { CreatorProfileSchema, validateBody } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/creators/profile
 * Get creator profile information
 *
 * Authentication: Required (Creator only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Check if user is a creator
    if (!user.is_creator) {
      return ErrorResponses.forbidden('You need a creator profile to access this endpoint. Please become a creator first.')
    }

    // Check if profile is complete
    const profileComplete = !!(
      user.creator_display_name &&
      user.creator_bio &&
      user.creator_email_verified
    )

    return SuccessResponses.ok({
      creator: {
        id: user.id,
        name: user.name,
        creator_display_name: user.creator_display_name,
        creator_bio: user.creator_bio,
        creator_profile_image_url: user.creator_profile_image_url,
        creator_email_verified: user.creator_email_verified,
        is_active: user.is_active,
        total_earnings: user.total_earnings,
        total_meal_plans_created: user.total_meal_plans_created,
        creator_rating: user.creator_rating,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      profile_complete: profileComplete
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * POST /api/creators/profile
 * Update creator profile information
 *
 * Authentication: Required (Creator only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(CreatorProfileSchema, body)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { creator_display_name, bio, profile_image_url } = validation.data

    // Update user to be a creator with profile info
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        is_creator: true,
        creator_display_name,
        creator_bio: bio,
        creator_profile_image_url: profile_image_url,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', user.id)
      .select(`
        id,
        name,
        email,
        is_creator,
        creator_display_name,
        creator_bio,
        creator_profile_image_url,
        creator_email_verified,
        is_active,
        total_earnings,
        total_meal_plans_created,
        creator_rating,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      throw new Error('Failed to update creator profile')
    }

    return SuccessResponses.ok({
      creator: {
        id: updatedUser.id,
        name: updatedUser.name,
        creator_display_name: updatedUser.creator_display_name,
        creator_bio: updatedUser.creator_bio,
        creator_profile_image_url: updatedUser.creator_profile_image_url,
        creator_email_verified: updatedUser.creator_email_verified,
        is_active: updatedUser.is_active,
        total_earnings: updatedUser.total_earnings,
        total_meal_plans_created: updatedUser.total_meal_plans_created,
        creator_rating: updatedUser.creator_rating,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
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
