import { NextRequest } from 'next/server'
import { CreatePricingRuleSchema, validateBody } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { requireAdmin } from '@/lib/api/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const user = await requireAdmin(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Get all pricing rules
    const { data: pricingRules, error } = await supabaseAdmin!
      .from('admin_pricing_rules')
      .select(`
        id,
        duration_days,
        base_price_per_day,
        bulk_discount_percentage,
        final_price,
        provider_share_percentage,
        is_active,
        created_by,
        created_at,
        updated_at
      `)
      .order('duration_days', { ascending: true })

    if (error) {
      throw new Error('Failed to fetch pricing rules')
    }

    return SuccessResponses.ok({
      pricing_rules: pricingRules || []
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const user = await requireAdmin(request)

    // Apply rate limiting
    withRateLimit(request, user.id, user.user_type)

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(CreatePricingRuleSchema, body)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const {
      duration_days,
      base_price_per_day,
      bulk_discount_percentage,
      provider_share_percentage
    } = validation.data

    // Calculate final price with bulk discount
    const basePrice = duration_days * base_price_per_day
    const discount = basePrice * ((bulk_discount_percentage || 0) / 100)
    const final_price = basePrice - discount

    // Check if a rule for this duration already exists
    const { data: existingRule } = await supabaseAdmin!
      .from('admin_pricing_rules')
      .select('id')
      .eq('duration_days', duration_days)
      .eq('is_active', true)
      .single()

    if (existingRule) {
      return ErrorResponses.validation('A pricing rule for this duration already exists')
    }

    // Create new pricing rule
    const { data: pricingRule, error } = await (supabaseAdmin as any)
      .from('admin_pricing_rules')
      .insert({
        duration_days,
        base_price_per_day,
        bulk_discount_percentage,
        final_price,
        provider_share_percentage,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      throw new Error('Failed to create pricing rule')
    }

    return SuccessResponses.created({
      pricing_rule: {
        id: pricingRule.id,
        duration_days: pricingRule.duration_days,
        base_price_per_day: pricingRule.base_price_per_day,
        bulk_discount_percentage: pricingRule.bulk_discount_percentage,
        final_price: pricingRule.final_price,
        provider_share_percentage: pricingRule.provider_share_percentage,
        is_active: pricingRule.is_active,
        created_by: pricingRule.created_by,
        created_at: pricingRule.created_at,
        updated_at: pricingRule.updated_at
      }
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

// Handle unsupported methods
export async function PUT() {
  return ErrorResponses.validation('Method not allowed')
}

export async function DELETE() {
  return ErrorResponses.validation('Method not allowed')
}

export async function PATCH() {
  return ErrorResponses.validation('Method not allowed')
}