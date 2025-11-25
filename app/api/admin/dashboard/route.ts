import { NextRequest } from 'next/server'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAdmin } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { UserPlanPurchase } from '@/lib/database-types'

// Type for the specific fields we're selecting from monthly revenue query
type MonthlyRevenuePurchase = Pick<UserPlanPurchase, 'purchase_price' | 'platform_fee' | 'purchased_at'>

// Helper to ensure supabaseAdmin is available
function ensureSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available - check SUPABASE_SECRET_KEY environment variable')
  }
  return supabaseAdmin
}

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const user = await requireAdmin(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Get platform statistics
    const [
      usersResult,
      providersResult,
      mealPlansResult,
      purchasesResult,
      revenueResult
    ] = await Promise.all([
      // Total users
      ensureSupabaseAdmin()
        .from('users')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
        .eq('is_deleted', false),

      // Total providers
      ensureSupabaseAdmin()
        .from('meal_plan_providers')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
        .eq('is_deleted', false),

      // Total meal plans
      ensureSupabaseAdmin()
        .from('meal_plans')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
        .eq('is_deleted', false),

      // Total purchases
      ensureSupabaseAdmin()
        .from('user_plan_purchases')
        .select('id', { count: 'exact' })
        .eq('status', 'completed'),

      // Total revenue
      ensureSupabaseAdmin()
        .from('user_plan_purchases')
        .select('purchase_price, platform_fee')
        .eq('status', 'completed')
    ])

    // Calculate metrics
    const totalUsers = usersResult.count || 0
    const totalProviders = providersResult.count || 0
    const totalMealPlans = mealPlansResult.count || 0
    const totalPurchases = purchasesResult.count || 0

    const totalRevenue = (revenueResult.data || []).reduce((sum: number, purchase: any) => sum + purchase.purchase_price, 0)
    const platformRevenue = (revenueResult.data || []).reduce((sum: number, purchase: any) => sum + purchase.platform_fee, 0)

    // Get recent activity
    const { data: recentUsers } = await ensureSupabaseAdmin()
      .from('users')
      .select('id, name, email, user_type, created_at')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: recentMealPlans } = await ensureSupabaseAdmin()
      .from('meal_plans')
      .select(`
        id,
        title,
        is_published,
        is_active,
        created_at,
        provider:meal_plan_providers(business_name)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: recentPurchases } = await ensureSupabaseAdmin()
      .from('user_plan_purchases')
      .select(`
        id,
        purchase_price,
        platform_fee,
        purchased_at,
        status,
        meal_plan:meal_plans(title),
        user:users(name, email)
      `)
      .order('purchased_at', { ascending: false })
      .limit(10)

    // Get monthly revenue data for charts
    const currentDate = new Date()
    const sixMonthsAgo = new Date(currentDate)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: monthlyRevenue } = await ensureSupabaseAdmin()
      .from('user_plan_purchases')
      .select('purchase_price, platform_fee, purchased_at')
      .eq('status', 'completed')
      .gte('purchased_at', sixMonthsAgo.toISOString())

    // Group revenue by month
    const monthlyData = ((monthlyRevenue || []) as MonthlyRevenuePurchase[]).reduce((acc: any, purchase) => {
      const month = new Date(purchase.purchased_at).toISOString().substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, platform: 0, purchases: 0 }
      }
      acc[month].total += purchase.purchase_price
      acc[month].platform += purchase.platform_fee
      acc[month].purchases += 1
      return acc
    }, {})

    return SuccessResponses.ok({
      overview: {
        total_users: totalUsers,
        total_providers: totalProviders,
        total_meal_plans: totalMealPlans,
        total_purchases: totalPurchases,
        total_revenue: totalRevenue,
        platform_revenue: platformRevenue
      },
      recent_activity: {
        users: (recentUsers || []).map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          user_type: user.user_type,
          created_at: user.created_at
        })),
        meal_plans: (recentMealPlans || []).map((plan: any) => ({
          id: plan.id,
          title: plan.title,
          provider_name: plan.provider?.business_name || 'Unknown Provider',
          is_published: plan.is_published,
          is_active: plan.is_active,
          created_at: plan.created_at
        })),
        purchases: (recentPurchases || []).map((purchase: any) => ({
          id: purchase.id,
          meal_plan_title: purchase.meal_plan?.title || 'Unknown Plan',
          customer_name: purchase.user?.name || 'Unknown Customer',
          customer_email: purchase.user?.email || 'Unknown Email',
          purchase_price: purchase.purchase_price,
          platform_fee: purchase.platform_fee,
          purchased_at: purchase.purchased_at,
          status: purchase.status
        }))
      },
      monthly_revenue: Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
        month,
        total_revenue: data.total,
        platform_revenue: data.platform,
        total_purchases: data.purchases
      }))
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