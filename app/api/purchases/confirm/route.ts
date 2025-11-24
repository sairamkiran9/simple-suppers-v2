import { NextRequest } from 'next/server'
import { ConfirmPurchaseSchema, validateBody } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { stripe, calculateProviderEarnings, centsToDollars } from '@/lib/api/payments'
import { createPurchase, trackEvent } from '@/lib/database-utils'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(ConfirmPurchaseSchema, body)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { payment_intent_id, meal_plan_id } = validation.data

    // Retrieve payment intent from mock Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

    if (!paymentIntent) {
      return ErrorResponses.notFound('Payment intent')
    }

    // Confirm the payment (mock)
    const confirmedPayment = await stripe.paymentIntents.confirm(payment_intent_id)

    if (!confirmedPayment || confirmedPayment.status !== 'succeeded') {
      return ErrorResponses.payment('Payment verification failed')
    }

    // Get meal plan and provider details
    const { data: mealPlan, error: planError } = await supabaseAdmin
      .from('meal_plans')
      .select(`
        *,
        provider:meal_plan_providers(*)
      `)
      .eq('id', meal_plan_id)
      .single()

    if (planError || !mealPlan) {
      return ErrorResponses.notFound('Meal plan')
    }

    // Calculate earnings
    const totalAmount = centsToDollars(confirmedPayment.amount)
    const { providerEarnings, platformFee } = calculateProviderEarnings(
      confirmedPayment.amount,
      70 // 70% to provider, 30% platform fee
    )

    // Create purchase record
    const purchase = await createPurchase({
      user_id: user.id,
      meal_plan_id: meal_plan_id,
      provider_id: mealPlan.provider_id,
      purchase_price: totalAmount,
      provider_earnings: centsToDollars(providerEarnings),
      platform_fee: centsToDollars(platformFee),
      stripe_payment_intent_id: payment_intent_id,
      status: 'completed',
      purchased_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + (3 * 30 * 24 * 60 * 60 * 1000)).toISOString(), // 3 months
      is_active: true
    })

    // Track analytics event
    await trackEvent({
      event_type: 'purchase',
      user_id: user.id,
      meal_plan_id: meal_plan_id,
      provider_id: mealPlan.provider_id,
      metadata: {
        purchase_price: totalAmount,
        provider_earnings: centsToDollars(providerEarnings),
        payment_intent_id: payment_intent_id
      }
    })

    return SuccessResponses.ok({
      purchase_id: purchase.id,
      meal_plan_id: meal_plan_id,
      access_granted: true
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