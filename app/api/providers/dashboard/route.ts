import { NextRequest } from 'next/server'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAuth } from '@/lib/api/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Check if user is a provider
    if (user.user_type !== 'provider') {
      return ErrorResponses.forbidden('Only providers can access this endpoint')
    }

    // Get provider profile
    const { data: provider } = await supabase
      .from('meal_plan_providers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!provider) {
      return ErrorResponses.notFound('Provider profile')
    }

    // Get provider's meal plans
    const { data: mealPlans } = await supabase
      .from('meal_plans')
      .select(`
        id,
        title,
        is_published,
        is_active,
        total_purchases,
        total_views,
        average_rating,
        final_price,
        created_at
      `)
      .eq('provider_id', provider.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    // Get recent purchases
    const { data: recentPurchases } = await supabase
      .from('user_plan_purchases')
      .select(`
        id,
        purchase_price,
        provider_earnings,
        purchased_at,
        status,
        meal_plan:meal_plans(title),
        user:users(name, email)
      `)
      .eq('provider_id', provider.id)
      .eq('status', 'completed')
      .order('purchased_at', { ascending: false })
      .limit(10)

    // Calculate analytics
    const totalMealPlans = mealPlans?.length || 0
    const publishedPlans = mealPlans?.filter(plan => plan.is_published && plan.is_active).length || 0
    const draftPlans = mealPlans?.filter(plan => !plan.is_published).length || 0
    const totalViews = mealPlans?.reduce((sum, plan) => sum + plan.total_views, 0) || 0
    const totalSales = mealPlans?.reduce((sum, plan) => sum + plan.total_purchases, 0) || 0

    // Calculate earnings for current month
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const { data: monthlyEarnings } = await supabase
      .from('user_plan_purchases')
      .select('provider_earnings')
      .eq('provider_id', provider.id)
      .eq('status', 'completed')
      .gte('purchased_at', currentMonth.toISOString())

    const currentMonthEarnings = monthlyEarnings?.reduce((sum, purchase) => sum + purchase.provider_earnings, 0) || 0

    // Get top performing meal plans
    const topPlans = mealPlans
      ?.filter(plan => plan.is_published && plan.is_active)
      .sort((a, b) => b.total_purchases - a.total_purchases)
      .slice(0, 5)
      .map(plan => ({
        id: plan.id,
        title: plan.title,
        total_purchases: plan.total_purchases,
        total_views: plan.total_views,
        average_rating: plan.average_rating,
        final_price: plan.final_price
      })) || []

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
        average_rating: provider.average_rating
      },
      analytics: {
        total_meal_plans: totalMealPlans,
        published_plans: publishedPlans,
        draft_plans: draftPlans,
        total_views: totalViews,
        total_sales: totalSales,
        current_month_earnings: currentMonthEarnings,
        all_time_earnings: provider.total_earnings
      },
      recent_purchases: (recentPurchases || []).map((purchase: any) => ({
        id: purchase.id,
        meal_plan_title: purchase.meal_plan?.title || 'Unknown Plan',
        customer_name: purchase.user?.name || 'Unknown Customer',
        customer_email: purchase.user?.email || 'Unknown Email',
        purchase_price: purchase.purchase_price,
        provider_earnings: purchase.provider_earnings,
        purchased_at: purchase.purchased_at,
        status: purchase.status
      })),
      top_performing_plans: topPlans
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