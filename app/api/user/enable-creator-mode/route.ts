import { NextRequest } from 'next/server'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Validation schema for enable creator mode request
const EnableCreatorModeSchema = z.object({
  creator_display_name: z.string().min(2, 'Display name must be at least 2 characters').max(255),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(1000),
  profile_image_url: z.string().url().optional().or(z.literal(''))
})

/**
 * POST /api/user/enable-creator-mode
 * Enable creator mode for the authenticated user
 *
 * Authentication: Required
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate request body
    const body = await request.json()
    const validation = EnableCreatorModeSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ')
      return ErrorResponses.validation(errors)
    }

    const { creator_display_name, bio, profile_image_url } = validation.data

    // Check if user is already a creator
    if (user.is_creator) {
      return ErrorResponses.conflict('You already have a creator profile')
    }

    // Update user to become a creator
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        is_creator: true,
        creator_display_name,
        creator_bio: bio,
        creator_profile_image_url: profile_image_url || null,
        creator_email_verified: false,
        total_earnings: 0,
        total_meal_plans_created: 0,
        creator_rating: 0,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', user.id)
      .select(`
        id,
        is_creator,
        creator_display_name,
        creator_bio,
        creator_profile_image_url,
        total_earnings,
        total_meal_plans_created,
        creator_rating,
        created_at,
        updated_at
      `)
      .single()

    if (error || !updatedUser) {
      console.error('Error creating creator profile:', error)
      throw new Error('Failed to create creator profile')
    }

    return SuccessResponses.created({
      creator: {
        id: updatedUser.id,
        creator_display_name: updatedUser.creator_display_name,
        creator_bio: updatedUser.creator_bio,
        creator_profile_image_url: updatedUser.creator_profile_image_url,
        is_creator: updatedUser.is_creator,
        total_earnings: updatedUser.total_earnings,
        total_meal_plans_created: updatedUser.total_meal_plans_created,
        creator_rating: updatedUser.creator_rating,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      },
      message: 'Successfully enabled creator mode!'
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

// Handle unsupported methods
export async function GET() {
  return ErrorResponses.methodNotAllowed()
}

export async function PUT() {
  return ErrorResponses.methodNotAllowed()
}

export async function DELETE() {
  return ErrorResponses.methodNotAllowed()
}

export async function PATCH() {
  return ErrorResponses.methodNotAllowed()
}
