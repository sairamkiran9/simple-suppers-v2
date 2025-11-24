import { NextRequest } from 'next/server'
import { UpdateProfileSchema, validateBody } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(UpdateProfileSchema, body)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const updateData = validation.data

    // Add validation for empty updates
    if (!updateData.name && updateData.dietary_preferences === undefined) {
      return ErrorResponses.validation('At least one field must be provided for update')
    }

    // Build update payload properly
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (updateData.name) {
      updatePayload.name = updateData.name
    }

    if (updateData.dietary_preferences !== undefined) {
      updatePayload.dietary_preferences = updateData.dietary_preferences
    }

    // Update user profile in database with enhanced error logging
    // Using supabaseAdmin to bypass RLS since we already validated auth with requireAuth()
    if (!supabaseAdmin) {
      return ErrorResponses.internal('Admin client not available')
    }
    
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', user.id)
      .select('id, name, email, dietary_preferences')
      .single()

    if (error) {
      console.error('Supabase update error:', {
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        errorCode: error.code,
        userId: user.id,
        updatePayload
      })
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    if (!updatedUser) {
      console.error('No user data returned after update', { userId: user.id })
      return ErrorResponses.notFound('User')
    }

    return SuccessResponses.ok({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        dietary_preferences: updatedUser.dietary_preferences || []
      }
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

// Handle unsupported methods
export async function GET() {
  return ErrorResponses.validation('Method not allowed')
}

export async function POST() {
  return ErrorResponses.validation('Method not allowed')
}

export async function PUT() {
  return ErrorResponses.validation('Method not allowed')
}

export async function DELETE() {
  return ErrorResponses.validation('Method not allowed')
}