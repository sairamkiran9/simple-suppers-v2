import { NextRequest } from 'next/server'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { getUserPurchases } from '@/lib/database-utils'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Get user's purchased plans
    const purchases = await getUserPurchases(user.id) || []

    // Get free plans that user has accessed
    const { data: freePlans } = await supabase
      .from('meal_plans')
      .select(`
        id,
        title,
        provider:meal_plan_providers(business_name)
      `)
      .eq('is_free', true)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .eq('is_published', true)

    // Calculate total spent
    const totalSpent = purchases
      .filter(purchase => purchase?.status === 'completed')
      .reduce((sum, purchase) => sum + (purchase?.purchase_price || 0), 0)

    // Transform purchased plans for response
    const purchasedPlans = purchases
      .filter(purchase => purchase?.meal_plan && purchase?.provider)
      .map(purchase => ({
        id: purchase.meal_plan.id,
        title: purchase.meal_plan.title,
        provider_name: purchase.provider.business_name,
        purchase_date: purchase.purchased_at,
        purchase_price: purchase.purchase_price
      }))

    // Transform free plans for response
    const freePhansData = (freePlans || []).map((plan: any) => ({
      id: plan.id,
      title: plan.title,
      provider_name: plan.provider?.business_name || 'Unknown Provider'
    }))

    return SuccessResponses.ok({
      user: {
        name: user.name,
        email: user.email,
        subscription_tier: user.subscription_tier,
        free_plans_used: user.subscription_tier === 'freemium' ?
          Math.min(purchasedPlans.filter(p => p.purchase_price === 0).length, 3) : 0
      },
      purchased_plans: purchasedPlans,
      free_plans: freePhansData,
      total_spent: totalSpent
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

// Handle unsupported methods
export async function POST() {
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