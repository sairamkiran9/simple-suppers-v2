import { NextRequest } from 'next/server'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { createPurchase, trackEvent } from '@/lib/database-utils'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/purchases/instant
 *
 * Simplified purchase endpoint that bypasses payment processing.
 * Creates a purchase record immediately for both free and paid plans.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Instant Purchase] Starting request...')

    // Require authentication
    const user = await requireAuth(request)
    console.log('[Instant Purchase] User authenticated:', user.id)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse request body
    const body = await request.json()
    const { meal_plan_id } = body
    console.log('[Instant Purchase] Meal plan ID:', meal_plan_id)

    if (!meal_plan_id) {
      return ErrorResponses.validation('meal_plan_id is required')
    }

    // Get meal plan and creator details
    console.log('[Instant Purchase] Fetching meal plan...')
    const { data: mealPlan, error: planError } = await supabaseAdmin
      .from('meal_plans')
      .select(`
        id,
        title,
        description,
        duration_days,
        final_price,
        is_free,
        created_by_user_id,
        creator:users!created_by_user_id(id, name, creator_display_name)
      `)
      .eq('id', meal_plan_id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .eq('is_published', true)
      .single()

    if (planError || !mealPlan) {
      console.log('[Instant Purchase] Meal plan not found. Error:', planError)
      return ErrorResponses.notFound('Meal plan')
    }
    console.log('[Instant Purchase] Meal plan found:', mealPlan.title)

    // Check if user already purchased this plan
    const { data: existingPurchase } = await supabaseAdmin
      .from('user_plan_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('meal_plan_id', meal_plan_id)
      .eq('is_active', true)
      .single()

    if (existingPurchase) {
      console.log('[Instant Purchase] User already has an active subscription for this plan')
      return ErrorResponses.conflict(
        'You are already subscribed to this meal plan. Visit your dashboard to view your active subscriptions.'
      )
    }

    // Calculate earnings (70% to provider, 30% platform fee)
    const purchasePrice = mealPlan.is_free ? 0 : mealPlan.final_price
    const providerEarnings = purchasePrice * 0.70
    const platformFee = purchasePrice * 0.30
    console.log('[Instant Purchase] Creating purchase. Price:', purchasePrice)

    // Validate creator_user_id exists
    if (!mealPlan.created_by_user_id) {
      return ErrorResponses.validation('Meal plan has no associated creator')
    }

    // Create purchase record
    const purchase = await createPurchase({
      user_id: user.id,
      meal_plan_id: meal_plan_id,
      creator_user_id: mealPlan.created_by_user_id,
      purchase_price: purchasePrice,
      creator_earnings: providerEarnings,
      platform_fee: platformFee,
      stripe_payment_intent_id: undefined,
      status: 'completed',
      purchased_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + (mealPlan.duration_days * 24 * 60 * 60 * 1000)).toISOString(),
      is_active: true
    })

    // Track analytics event
    await trackEvent({
      event_type: 'purchase',
      user_id: user.id,
      meal_plan_id: meal_plan_id,
      creator_user_id: mealPlan.created_by_user_id,
      metadata: {
        purchase_price: purchasePrice,
        creator_earnings: providerEarnings,
        purchase_type: 'instant'
      }
    })

    console.log('[Instant Purchase] Purchase created successfully:', purchase.id)

    return SuccessResponses.ok({
      purchase_id: purchase.id,
      meal_plan_id: meal_plan_id,
      meal_plan_title: mealPlan.title,
      purchase_price: purchasePrice,
      access_granted: true,
      message: mealPlan.is_free
        ? 'Free plan added to your account!'
        : 'Meal plan purchased successfully!'
    })

  } catch (error) {
    console.error('[Instant Purchase] Error occurred:', error)
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
