import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { handleAPIError, ErrorResponses, SuccessResponses, NotFoundError, AuthorizationError, ValidationError } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { UpdateMealPlanSchema, validateBody } from '@/lib/api/validation'

/**
 * PATCH /api/providers/meal-plans/[id]
 * Update an existing meal plan owned by the authenticated provider
 *
 * Authentication: Required (Provider only)
 * Authorization: Provider must own the meal plan
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication: Require authenticated provider
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Authorization: Check if user is a provider
    if (user.user_type !== 'provider') {
      return ErrorResponses.forbidden('Only providers can access this endpoint')
    }

    // Get provider profile
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('meal_plan_providers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (providerError || !provider) {
      throw new NotFoundError('Provider profile')
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(UpdateMealPlanSchema, body)

    if (!validation.success) {
      throw new ValidationError(validation.error)
    }

    const validatedData = validation.data

    // Check if meal plan exists and verify ownership
    const { data: existingMealPlan, error: fetchError } = await supabaseAdmin
      .from('meal_plans')
      .select('id, provider_id, is_deleted')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingMealPlan) {
      throw new NotFoundError('Meal plan')
    }

    // Check if meal plan is deleted
    if (existingMealPlan.is_deleted) {
      throw new NotFoundError('Meal plan')
    }

    // Verify ownership
    if (existingMealPlan.provider_id !== provider.id) {
      throw new AuthorizationError('You do not have permission to update this meal plan')
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }
    if (validatedData.category !== undefined) {
      updateData.category = validatedData.category
    }
    if (validatedData.dietary_tags !== undefined) {
      updateData.dietary_tags = validatedData.dietary_tags
    }
    if (validatedData.difficulty_level !== undefined) {
      updateData.difficulty_level = validatedData.difficulty_level
    }
    if (validatedData.is_published !== undefined) {
      updateData.is_published = validatedData.is_published
    }
    if (validatedData.is_active !== undefined) {
      updateData.is_active = validatedData.is_active
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update meal plan in database
    const { data: updatedMealPlan, error: updateError } = await supabaseAdmin
      .from('meal_plans')
      .update(updateData)
      .eq('id', params.id)
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
        is_published,
        is_active,
        is_featured,
        total_purchases,
        total_views,
        average_rating,
        rating_count,
        created_at,
        updated_at
      `)
      .single()

    if (updateError || !updatedMealPlan) {
      throw new Error('Failed to update meal plan')
    }

    return SuccessResponses.ok({
      meal_plan: updatedMealPlan
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * DELETE /api/providers/meal-plans/[id]
 * Soft delete a meal plan owned by the authenticated provider
 *
 * Authentication: Required (Provider only)
 * Authorization: Provider must own the meal plan
 *
 * Implementation: Soft delete by setting is_deleted=true, is_active=false, is_published=false
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication: Require authenticated provider
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Authorization: Check if user is a provider
    if (user.user_type !== 'provider') {
      return ErrorResponses.forbidden('Only providers can access this endpoint')
    }

    // Get provider profile
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('meal_plan_providers')
      .select('id, total_plans')
      .eq('user_id', user.id)
      .single()

    if (providerError || !provider) {
      throw new NotFoundError('Provider profile')
    }

    // Check if meal plan exists and verify ownership
    const { data: existingMealPlan, error: fetchError } = await supabaseAdmin
      .from('meal_plans')
      .select('id, provider_id, is_deleted')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingMealPlan) {
      throw new NotFoundError('Meal plan')
    }

    // Check if already deleted
    if (existingMealPlan.is_deleted) {
      return ErrorResponses.conflict('Meal plan is already deleted')
    }

    // Verify ownership
    if (existingMealPlan.provider_id !== provider.id) {
      throw new AuthorizationError('You do not have permission to delete this meal plan')
    }

    // Soft delete: set is_deleted=true, is_active=false, is_published=false
    const { error: deleteError } = await supabaseAdmin
      .from('meal_plans')
      .update({
        is_deleted: true,
        is_active: false,
        is_published: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (deleteError) {
      throw new Error('Failed to delete meal plan')
    }

    // Decrement provider's total_plans count
    await supabaseAdmin
      .from('meal_plan_providers')
      .update({
        total_plans: Math.max(0, provider.total_plans - 1)
      })
      .eq('id', provider.id)

    return SuccessResponses.ok({
      message: 'Meal plan deleted successfully',
      meal_plan_id: params.id
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

// Handle unsupported methods
export async function GET() {
  return ErrorResponses.methodNotAllowed('Method not allowed. Use GET /api/meal-plans/[id] instead')
}

export async function POST() {
  return ErrorResponses.methodNotAllowed()
}

export async function PUT() {
  return ErrorResponses.methodNotAllowed()
}
