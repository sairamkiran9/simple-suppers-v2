import { NextRequest } from 'next/server'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Validation schema for become provider request
const BecomeProviderSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters').max(255),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(1000),
  profile_image_url: z.string().url().optional().or(z.literal(''))
})

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate request body
    const body = await request.json()
    const validation = BecomeProviderSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ')
      return ErrorResponses.validation(errors)
    }

    const { business_name, bio, profile_image_url } = validation.data

    // Check if user already has a provider profile
    const { data: existingProvider } = await supabaseAdmin
      .from('meal_plan_providers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingProvider) {
      return ErrorResponses.conflict('You already have a provider profile')
    }

    // Create provider profile
    const { data: provider, error } = await supabaseAdmin
      .from('meal_plan_providers')
      .insert({
        user_id: user.id,
        business_name,
        bio,
        profile_image_url: profile_image_url || null,
        email_verified: false,
        is_active: true,
        is_deleted: false,
        total_earnings: 0,
        total_plans: 0,
        average_rating: 0
      })
      .select()
      .single()

    if (error || !provider) {
      console.error('Error creating provider profile:', error)
      throw new Error('Failed to create provider profile')
    }

    // Optionally update user_type to 'provider' for backward compatibility
    // You can uncomment this if you want to change the user_type
    // await supabaseAdmin
    //   .from('users')
    //   .update({ user_type: 'provider' })
    //   .eq('id', user.id)

    return SuccessResponses.created({
      provider: {
        id: provider.id,
        business_name: provider.business_name,
        bio: provider.bio,
        profile_image_url: provider.profile_image_url,
        is_active: provider.is_active,
        total_earnings: provider.total_earnings,
        total_plans: provider.total_plans,
        average_rating: provider.average_rating,
        created_at: provider.created_at,
        updated_at: provider.updated_at
      },
      message: 'Successfully became a provider!'
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
