import { NextRequest } from 'next/server'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { cancelPurchase, trackEvent } from '@/lib/database-utils'
import { supabaseAdmin } from '@/lib/supabase'

interface Params {
  id: string
}

/**
 * POST /api/purchases/[id]/cancel
 *
 * Cancels an active subscription by setting is_active to false.
 * Users can only cancel their own subscriptions.
 */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    console.log('[Cancel Purchase] Starting request for purchase ID:', params.id)

    // Require authentication
    const user = await requireAuth(request)
    console.log('[Cancel Purchase] User authenticated:', user.id)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    const { id: purchaseId } = params

    if (!purchaseId) {
      return ErrorResponses.validation('Purchase ID is required')
    }

    // Verify the purchase belongs to the user (using admin client for performance)
    console.log('[Cancel Purchase] Verifying purchase ownership...')
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('user_plan_purchases')
      .select('id, user_id, meal_plan_id, is_active')
      .eq('id', purchaseId)
      .single()

    if (purchaseError || !purchase) {
      console.log('[Cancel Purchase] Purchase not found. Error:', purchaseError)
      return ErrorResponses.notFound('Purchase')
    }

    // Check ownership
    if (purchase.user_id !== user.id) {
      console.log('[Cancel Purchase] User does not own this purchase')
      return ErrorResponses.forbidden('You do not have permission to cancel this purchase')
    }

    // Check if already inactive
    if (!purchase.is_active) {
      console.log('[Cancel Purchase] Purchase is already inactive')
      return ErrorResponses.conflict('This subscription has already been canceled')
    }

    // Cancel the purchase
    console.log('[Cancel Purchase] Canceling purchase...')
    const canceledPurchase = await cancelPurchase(purchaseId)

    // Track analytics event
    await trackEvent({
      event_type: 'cancel_subscription',
      user_id: user.id,
      meal_plan_id: purchase.meal_plan_id,
      metadata: {
        purchase_id: purchaseId
      }
    })

    console.log('[Cancel Purchase] Purchase canceled successfully')

    return SuccessResponses.ok({
      message: 'Subscription canceled successfully',
      purchase_id: canceledPurchase.id,
      is_active: canceledPurchase.is_active
    })

  } catch (error) {
    console.error('[Cancel Purchase] Error occurred:', error)
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
