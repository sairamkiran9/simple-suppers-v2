import { NextRequest } from 'next/server'
import { PurchaseHistoryQuerySchema, validateQuery } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(PurchaseHistoryQuerySchema, searchParams)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { limit, offset } = validation.data

    // Get user's purchase history with pagination
    const { data: purchases, error, count } = await supabaseAdmin
      .from('user_plan_purchases')
      .select(`
        id,
        meal_plan_id,
        purchase_price,
        purchased_at,
        meal_plan:meal_plans(title),
        provider:meal_plan_providers(business_name)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('purchased_at', { ascending: false })
      .range(offset || 0, (offset || 0) + (limit || 10) - 1)

    if (error) {
      throw new Error('Failed to fetch purchase history')
    }

    // Calculate total spent
    const { data: allPurchases } = await supabaseAdmin
      .from('user_plan_purchases')
      .select('purchase_price')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    const totalSpent = allPurchases?.reduce((sum, purchase) => sum + purchase.purchase_price, 0) || 0

    // Transform response data
    const purchaseHistory = (purchases || []).map((purchase: any) => ({
      id: purchase.id,
      meal_plan_id: purchase.meal_plan_id,
      meal_plan_title: purchase.meal_plan?.title || 'Unknown Meal Plan',
      provider_name: purchase.provider?.business_name || 'Unknown Provider',
      purchase_price: purchase.purchase_price,
      purchased_at: purchase.purchased_at
    }))

    return SuccessResponses.ok({
      purchases: purchaseHistory,
      total: count || 0,
      total_spent: totalSpent
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

// Handle unsupported methods
export async function POST() {
  return ErrorResponses.validation('Method not allowed')
}

export async function PUT() {
  return ErrorResponses.validation('Method not allowed')
}

export async function DELETE() {
  return ErrorResponses.validation('Method not allowed')
}

export async function PATCH() {
  return ErrorResponses.validation('Method not allowed')
}