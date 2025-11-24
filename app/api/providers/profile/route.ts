import { NextRequest } from 'next/server'
import { ProviderProfileSchema, validateBody } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth, checkIsProvider } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Check if user is a provider
    const providerCheck = await checkIsProvider(user.id)
    if (!providerCheck.isProvider) {
      return ErrorResponses.forbidden('You need a provider profile to access this endpoint. Please become a provider first.')
    }

    // Get provider profile
    const { data: provider, error } = await supabaseAdmin
      .from('meal_plan_providers')
      .select(`
        id,
        business_name,
        bio,
        profile_image_url,
        email_verified,
        is_active,
        total_earnings,
        total_plans,
        average_rating,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .single()

    if (error || !provider) {
      // If no provider profile exists, return 404
      if (!provider || (error as any)?.message?.includes('No rows returned')) {
        return ErrorResponses.notFound('Provider profile')
      }
      throw new Error('Failed to fetch provider profile')
    }

    // Check if profile is complete
    const profileComplete = !!(
      provider.business_name &&
      provider.bio &&
      provider.email_verified
    )

    return SuccessResponses.ok({
      provider: {
        id: provider.id,
        business_name: provider.business_name,
        bio: provider.bio,
        profile_image_url: provider.profile_image_url,
        email_verified: provider.email_verified,
        is_active: provider.is_active,
        total_earnings: provider.total_earnings,
        total_plans: provider.total_plans,
        average_rating: provider.average_rating,
        created_at: provider.created_at,
        updated_at: provider.updated_at
      },
      profile_complete: profileComplete
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
    const providerCheck = await checkIsProvider(user.id)
    if (!providerCheck.isProvider) {
      return ErrorResponses.forbidden('You need a provider profile to access this endpoint. Please become a provider first.')
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(ProviderProfileSchema, body)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { business_name, bio, profile_image_url } = validation.data

    // Check if provider profile already exists
    const { data: existingProvider } = await supabaseAdmin
      .from('meal_plan_providers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let provider
    if (existingProvider) {
      // Update existing profile
      const { data: updatedProvider, error } = await supabaseAdmin
        .from('meal_plan_providers')
        .update({
          business_name,
          bio,
          profile_image_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw new Error('Failed to update provider profile')
      }
      provider = updatedProvider
    } else {
      // Create new provider profile
      const { data: newProvider, error } = await supabaseAdmin
        .from('meal_plan_providers')
        .insert({
          user_id: user.id,
          business_name,
          bio,
          profile_image_url,
          email_verified: false,
          is_active: true,
          is_deleted: false,
          total_earnings: 0,
          total_plans: 0,
          average_rating: 0
        })
        .select()
        .single()

      if (error) {
        throw new Error('Failed to create provider profile')
      }
      provider = newProvider
    }

    return SuccessResponses.ok({
      provider: {
        id: provider.id,
        business_name: provider.business_name,
        bio: provider.bio,
        profile_image_url: provider.profile_image_url,
        email_verified: provider.email_verified,
        is_active: provider.is_active,
        total_earnings: provider.total_earnings,
        total_plans: provider.total_plans,
        average_rating: provider.average_rating,
        created_at: provider.created_at,
        updated_at: provider.updated_at
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