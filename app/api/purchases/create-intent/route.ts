import { NextRequest } from 'next/server'
import { CreatePaymentIntentSchema, validateBody } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { stripe, dollarsToCents, calculateProviderEarnings } from '@/lib/api/payments'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(CreatePaymentIntentSchema, body)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { meal_plan_id } = validation.data

    // Get meal plan details
    const { data: mealPlan, error: planError } = await supabaseAdmin
      .from('meal_plans')
      .select(`
        *,
        provider:meal_plan_providers(business_name)
      `)
      .eq('id', meal_plan_id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .eq('is_published', true)
      .single()

    if (planError || !mealPlan) {
      return ErrorResponses.notFound('Meal plan')
    }

    // Check if plan is free
    if (mealPlan.is_free) {
      return ErrorResponses.validation('Cannot purchase free meal plans')
    }

    // Check if user already purchased this plan
    const { data: existingPurchase } = await supabaseAdmin
      .from('user_plan_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('meal_plan_id', meal_plan_id)
      .eq('status', 'completed')
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (existingPurchase) {
      return ErrorResponses.conflict('Plan already purchased by user')
    }

    // Convert price to cents for Stripe
    const amountInCents = dollarsToCents(mealPlan.final_price)

    // Validate provider_id exists
    if (!mealPlan.provider_id) {
      return ErrorResponses.validation('Meal plan has no associated provider')
    }

    // Create mock payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        meal_plan_id: meal_plan_id,
        user_id: user.id,
        provider_id: mealPlan.provider_id
      }
    })

    if (!paymentIntent) {
      throw new Error('Failed to create payment intent')
    }

    return SuccessResponses.ok({
      client_secret: paymentIntent.client_secret,
      amount: amountInCents,
      meal_plan: {
        id: mealPlan.id,
        title: mealPlan.title,
        final_price: mealPlan.final_price,
        provider_name: mealPlan.provider?.business_name ?? 'Unknown Provider'
      }
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