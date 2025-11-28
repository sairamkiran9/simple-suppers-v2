import { NextRequest } from 'next/server'
import { GET as dashboardGET } from '@/app/api/admin/dashboard/route'
import { GET as usersGET } from '@/app/api/admin/users/route'
import { GET as adminMealPlansGET } from '@/app/api/admin/meal-plans/route'
import { GET as pricingRulesGET, POST as pricingRulesPOST } from '@/app/api/admin/pricing-rules/route'

// Create mock responses
let mockResponses: any[] = []
let callIndex = 0

// Create comprehensive chainable mock for Supabase
const createChainableMock = (resolveValue?: any) => {
  const mock = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn(() => {
      if (resolveValue) {
        return Promise.resolve(resolveValue)
      }
      const response = mockResponses[callIndex] || { data: null, error: null }
      callIndex++
      return Promise.resolve(response)
    })
  }

  // Add a way to resolve the promise directly for non-single methods
  Object.defineProperty(mock, 'then', {
    get() {
      return (resolve: any) => {
        if (resolveValue) {
          resolve(resolveValue)
          return Promise.resolve(resolveValue)
        }
        const response = mockResponses[callIndex] || { data: null, error: null }
        callIndex++
        resolve(response)
        return Promise.resolve(response)
      }
    }
  })

  return mock
}

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => createChainableMock())
  },
  supabaseAdmin: {
    from: jest.fn(() => createChainableMock())
  },
  isSupabaseAdminConfigured: jest.fn(() => true),
  isSupabaseConfigured: jest.fn(() => true)
}))

// Mock admin authentication
jest.mock('@/lib/api/auth', () => ({
  requireAdmin: jest.fn(() => Promise.resolve({
    id: 'admin-user-id',
    email: 'admin@example.com',
    user_type: 'admin'
  }))
}))

// Mock rate limiting
jest.mock('@/lib/api/rate-limit', () => ({
  withRateLimit: jest.fn()
}))

describe('/api/admin/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResponses = []
    callIndex = 0
  })

  it('should fetch admin dashboard data successfully', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Setup mock responses in the order they'll be called
    mockResponses = [
      // Users count query
      { count: 150, data: null, error: null },
      // Providers count query
      { count: 25, data: null, error: null },
      // Meal plans count query
      { count: 100, data: null, error: null },
      // Purchases count query
      { count: 500, data: null, error: null },
      // Revenue data query
      {
        data: [
          { purchase_price: 35.00, platform_fee: 10.50 },
          { purchase_price: 25.00, platform_fee: 7.50 }
        ],
        error: null
      },
      // Recent users query
      { data: [], error: null },
      // Recent meal plans query
      { data: [], error: null },
      // Recent purchases query
      { data: [], error: null },
      // Monthly revenue query
      {
        data: [
          { purchase_price: 35.00, platform_fee: 10.50, purchased_at: '2024-01-15T10:00:00Z' }
        ],
        error: null
      }
    ]

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard', {
      headers: {
        'Authorization': 'Bearer admin-token'
      }
    })

    const response = await dashboardGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.overview).toBeDefined()
    expect(data.data.overview.total_users).toBe(150)
    expect(data.data.overview.total_providers).toBe(25)
    expect(data.data.overview.total_meal_plans).toBe(100)
    expect(data.data.overview.total_purchases).toBe(500)
    expect(data.data.overview.total_revenue).toBe(60.00)
    expect(data.data.overview.platform_revenue).toBe(18.00)
  })
})

describe('/api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResponses = []
    callIndex = 0
  })

  it('should fetch users successfully', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        auth_provider: 'email',
        user_type: 'user',
        subscription_tier: 'freemium',
        free_plans_used: 0,
        dietary_preferences: [],
        is_active: true,
        is_deleted: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'provider-1',
        email: 'provider1@example.com',
        name: 'Provider One',
        auth_provider: 'email',
        user_type: 'user',
        subscription_tier: 'freemium',
        free_plans_used: 0,
        dietary_preferences: [],
        is_active: true,
        is_deleted: false,
        is_creator: true,
        creator_display_name: 'Test Business',
        total_meal_plans_created: 5,
        total_earnings: 100.00,
        creator_rating: 4.5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]

    // Setup mock responses
    mockResponses = [
      // Users query with count
      { data: mockUsers, error: null, count: 2 }
    ]

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': 'Bearer admin-token'
      }
    })

    const response = await usersGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.users).toHaveLength(2)
    expect(data.data.total).toBe(2)

    // Check creator info is included
    const creatorUser = data.data.users.find((u: any) => u.creator_info)
    expect(creatorUser).toBeDefined()
    expect(creatorUser.creator_info).toBeDefined()
    expect(creatorUser.creator_info.creator_display_name).toBe('Test Business')
  })

  it('should filter users by type', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Setup mock responses
    mockResponses = [
      // Filtered users query
      { data: [], error: null, count: 0 }
    ]

    const request = new NextRequest('http://localhost:3000/api/admin/users?user_type=provider', {
      headers: {
        'Authorization': 'Bearer admin-token'
      }
    })

    const response = await usersGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.total).toBe(0)
  })

  it('should search users', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Setup mock responses
    mockResponses = [
      // Search results
      { data: [], error: null, count: 0 }
    ]

    const request = new NextRequest('http://localhost:3000/api/admin/users?search=john', {
      headers: {
        'Authorization': 'Bearer admin-token'
      }
    })

    const response = await usersGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.total).toBe(0)
  })
})

describe('/api/admin/pricing-rules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResponses = []
    callIndex = 0
  })

  it('should fetch pricing rules successfully', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    const mockPricingRules = [
      {
        id: 'rule-1',
        duration_days: 7,
        base_price_per_day: 6.00,
        bulk_discount_percentage: 15.00,
        final_price: 35.00,
        provider_share_percentage: 70.00,
        is_active: true,
        created_by: 'admin-user-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]

    // Setup mock response
    mockResponses = [
      {
        data: mockPricingRules,
        error: null
      }
    ]

    const request = new NextRequest('http://localhost:3000/api/admin/pricing-rules', {
      headers: {
        'Authorization': 'Bearer admin-token'
      }
    })

    const response = await pricingRulesGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.pricing_rules).toHaveLength(1)
    expect(data.data.pricing_rules[0].duration_days).toBe(7)
    expect(data.data.pricing_rules[0].final_price).toBe(35.00)
  })

  it('should create new pricing rule successfully', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Mock rule creation
    const mockNewRule = {
      id: 'rule-2',
      duration_days: 14,
      base_price_per_day: 6.00,
      bulk_discount_percentage: 25.00,
      final_price: 63.00,
      provider_share_percentage: 70.00,
      is_active: true,
      created_by: 'admin-user-id',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    // Setup mock responses
    mockResponses = [
      // Check for existing rule (should return error indicating no rows)
      { data: null, error: { message: 'No rows returned' } },
      // Create new rule
      { data: mockNewRule, error: null }
    ]

    const request = new NextRequest('http://localhost:3000/api/admin/pricing-rules', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token'
      },
      body: JSON.stringify({
        duration_days: 14,
        base_price_per_day: 6.00,
        bulk_discount_percentage: 25.00,
        provider_share_percentage: 70.00
      })
    })

    const response = await pricingRulesPOST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.pricing_rule.duration_days).toBe(14)
    expect(data.data.pricing_rule.final_price).toBe(63.00)
  })

  it('should prevent duplicate pricing rules', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Setup mock responses - existing rule found
    mockResponses = [
      // Check for existing rule (should return existing rule)
      { data: { id: 'existing-rule' }, error: null }
    ]

    const request = new NextRequest('http://localhost:3000/api/admin/pricing-rules', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token'
      },
      body: JSON.stringify({
        duration_days: 7,
        base_price_per_day: 6.00,
        bulk_discount_percentage: 15.00,
        provider_share_percentage: 70.00
      })
    })

    const response = await pricingRulesPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('A pricing rule for this duration already exists')
  })

  it('should validate pricing rule data', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/pricing-rules', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token'
      },
      body: JSON.stringify({
        duration_days: -1, // Invalid negative value
        base_price_per_day: 6.00,
        bulk_discount_percentage: 150.00, // Invalid percentage > 100
        provider_share_percentage: 70.00
      })
    })

    const response = await pricingRulesPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('duration_days')
  })
})
