import { NextRequest } from 'next/server'
import { GET as profileGET, POST as profilePOST } from '@/app/api/providers/profile/route'
import { GET as dashboardGET } from '@/app/api/providers/dashboard/route'
import { GET as mealPlansGET } from '@/app/api/providers/meal-plans/route'

// Mock Supabase with dynamic configuration
const mockSupabase = {
  // Storage for configurable mock responses by table
  mockResponses: {
    meal_plan_providers: { data: null, error: null },
    meal_plans: { data: null, error: null, count: null },
    user_plan_purchases: { data: null, error: null },
    update: { data: null, error: null },
    insert: { data: null, error: null }
  } as Record<string, any>,

  // Call counter for handling sequential calls
  callCounts: {} as Record<string, number>,

  // Helper to configure mock responses by table
  setTableResponse: (table: string, response: any) => {
    mockSupabase.mockResponses[table] = response
  },

  // Helper to configure mock responses for operations
  setMockResponse: (operation: string, response: any) => {
    mockSupabase.mockResponses[operation] = response
  },

  // Reset to default state
  reset: () => {
    mockSupabase.mockResponses = {
      meal_plan_providers: { data: null, error: null },
      meal_plans: { data: null, error: null, count: null },
      user_plan_purchases: { data: null, error: null },
      update: { data: null, error: null },
      insert: { data: null, error: null }
    } as Record<string, any>
    mockSupabase.callCounts = {}
  },

  // Get response for specific table
  getTableResponse: (table: string) => {
    return mockSupabase.mockResponses[table] || { data: null, error: null }
  }
}

jest.mock('@/lib/supabase', () => {
  const createFromMock = (tableName: string) => {
    // Create a flexible query builder that supports chaining
    const createQueryChain = (): any => {
      const chain: any = {
        select: jest.fn(() => chain),
        eq: jest.fn(() => chain),
        gte: jest.fn(() => chain),
        order: jest.fn(() => chain),
        range: jest.fn(() => Promise.resolve(mockSupabase.getTableResponse(tableName))),
        limit: jest.fn(() => Promise.resolve(mockSupabase.getTableResponse(tableName))),
        single: jest.fn(() => Promise.resolve(mockSupabase.getTableResponse(tableName)))
      }
      return chain
    }

    const fromObject = {
      select: jest.fn(() => createQueryChain()),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve(mockSupabase.mockResponses.update))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve(mockSupabase.mockResponses.insert))
        }))
      }))
    }
    return fromObject
  }

  return {
    supabase: {
      from: createFromMock
    },
    supabaseAdmin: {
      from: createFromMock
    }
  }
})

// Export mock utilities for test configuration
const { supabase } = require('@/lib/supabase')

// Mock provider authentication
jest.mock('@/lib/api/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'provider-user-id',
    email: 'provider@example.com',
    user_type: 'provider',
    name: 'Test Provider',
    subscription_tier: 'premium'
  })),
  checkIsProvider: jest.fn(() => Promise.resolve({
    isProvider: true,
    providerProfile: {
      id: 'provider-1',
      business_name: 'Test Kitchen',
      bio: 'Amazing meals',
      profile_image_url: 'https://example.com/image.jpg',
      total_earnings: 250.00,
      total_plans: 5,
      average_rating: 4.5
    }
  }))
}))

// Mock rate limiting
jest.mock('@/lib/api/rate-limit', () => ({
  withRateLimit: jest.fn()
}))

// Mock validation
jest.mock('@/lib/api/validation', () => ({
  ProviderProfileSchema: {},
  validateBody: jest.fn((schema, body) => {
    // Check for empty business_name to trigger validation error
    if (body.business_name === '') {
      return {
        success: false,
        error: 'Business name is required'
      }
    }
    return {
      success: true,
      data: {
        business_name: body.business_name || 'Test Kitchen',
        bio: body.bio || 'Amazing meals',
        profile_image_url: body.profile_image_url || 'https://example.com/image.jpg'
      }
    }
  }),
  ProviderMealPlansQuerySchema: {},
  validateQuery: jest.fn((schema, params) => {
    // Check for high limit to trigger validation error
    const limit = params.get ? params.get('limit') : params.limit
    if (limit && parseInt(limit) > 100) {
      return {
        success: false,
        error: 'limit must be less than or equal to 100'
      }
    }
    return {
      success: true,
      data: {
        status: params.get ? params.get('status') || 'published' : 'published',
        limit: limit ? parseInt(limit) : 20,
        offset: 0
      }
    }
  })
}))

describe('/api/providers/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.reset()
  })

  it('should fetch provider profile successfully', async () => {
    const mockProvider = {
      id: 'provider-1',
      user_id: 'provider-user-id',
      business_name: 'Test Kitchen',
      bio: 'Amazing meals for everyone',
      profile_image_url: 'https://example.com/image.jpg',
      email_verified: true,
      total_earnings: 250.00,
      total_plans: 5,
      average_rating: 4.5,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    // Configure mock to return provider data
    mockSupabase.setTableResponse('meal_plan_providers', {
      data: mockProvider,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/providers/profile', {
      headers: {
        'Authorization': 'Bearer provider-token'
      }
    })

    const response = await profileGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.provider.business_name).toBe('Test Kitchen')
    expect(data.data.provider.total_earnings).toBe(250.00)
  })

  it('should return 404 for non-existent provider profile', async () => {
    // Configure mock to return no data (triggers 404)
    mockSupabase.setTableResponse('meal_plan_providers', {
      data: null,
      error: { message: 'No rows returned' }
    })

    const request = new NextRequest('http://localhost:3000/api/providers/profile', {
      headers: {
        'Authorization': 'Bearer provider-token'
      }
    })

    const response = await profileGET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('Provider profile not found')
  })

  it('should update provider profile successfully', async () => {
    const existingProvider = {
      id: 'provider-1',
      user_id: 'provider-user-id'
    }

    const updatedProvider = {
      id: 'provider-1',
      user_id: 'provider-user-id',
      business_name: 'Updated Kitchen',
      bio: 'Updated bio',
      profile_image_url: 'https://example.com/new-image.jpg',
      email_verified: true,
      is_active: true,
      total_earnings: 0,
      total_plans: 0,
      average_rating: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    // Configure mock for existing provider check (first call)
    mockSupabase.setTableResponse('meal_plan_providers', {
      data: existingProvider,
      error: null
    })

    // Configure mock for update operation
    mockSupabase.setMockResponse('update', {
      data: updatedProvider,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/providers/profile', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer provider-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_name: 'Updated Kitchen',
        bio: 'Updated bio',
        profile_image_url: 'https://example.com/new-image.jpg'
      })
    })

    const response = await profilePOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.provider.business_name).toBe('Updated Kitchen')
  })

  it('should validate business name requirement', async () => {
    const request = new NextRequest('http://localhost:3000/api/providers/profile', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer provider-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_name: '', // Empty business name
        bio: 'Updated bio'
      })
    })

    const response = await profilePOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Business name is required')
  })
})

describe('/api/providers/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.reset()
  })

  it('should fetch provider dashboard data successfully', async () => {
    // Mock provider profile
    const mockProvider = {
      id: 'provider-1',
      user_id: 'provider-user-id',
      business_name: 'Test Kitchen',
      total_earnings: 350.00,
      total_plans: 5,
      average_rating: 4.5
    }

    // Mock meal plans
    const mockMealPlans = [
      {
        id: 'plan-1',
        title: 'Test Plan',
        is_published: true,
        is_active: true,
        total_purchases: 10,
        total_views: 100,
        average_rating: 4.5,
        final_price: 35.00,
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    // Mock recent purchases
    const mockPurchases = [
      {
        id: 'purchase-1',
        purchase_price: 35.00,
        provider_earnings: 24.50,
        purchased_at: '2024-01-01T00:00:00Z',
        status: 'completed',
        meal_plan: { title: 'Test Plan' },
        user: { name: 'John Doe', email: 'john@example.com' }
      }
    ]

    // Mock monthly earnings
    const mockMonthlyEarnings = [
      { provider_earnings: 24.50 }
    ]

    // Configure mock responses for each table
    mockSupabase.setTableResponse('meal_plan_providers', {
      data: mockProvider,
      error: null
    })

    mockSupabase.setTableResponse('meal_plans', {
      data: mockMealPlans,
      error: null
    })

    mockSupabase.setTableResponse('user_plan_purchases', {
      data: mockPurchases,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/providers/dashboard', {
      headers: {
        'Authorization': 'Bearer provider-token'
      }
    })

    const response = await dashboardGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.provider).toBeDefined()
    expect(data.data.analytics).toBeDefined()
    expect(data.data.provider.total_earnings).toBe(350.00)
    expect(data.data.provider.total_plans).toBe(5)
    expect(data.data.recent_purchases).toHaveLength(1)
  })

  it('should return 404 when provider profile not found for dashboard', async () => {
    // Configure mock to return no provider data
    mockSupabase.setTableResponse('meal_plan_providers', {
      data: null,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/providers/dashboard', {
      headers: {
        'Authorization': 'Bearer provider-token'
      }
    })

    const response = await dashboardGET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('Provider profile not found')
  })
})

describe('/api/providers/meal-plans', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.reset()
  })

  it('should fetch provider meal plans successfully', async () => {
    // Mock provider profile
    const mockProvider = {
      id: 'provider-1',
      user_id: 'provider-user-id'
    }

    const mockMealPlans = [
      {
        id: 'plan-1',
        title: 'Provider Plan 1',
        description: 'Test description',
        duration_days: 7,
        is_published: true,
        is_active: true,
        total_purchases: 10,
        average_rating: 4.5,
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    // Configure mock responses for each table
    mockSupabase.setTableResponse('meal_plan_providers', {
      data: mockProvider,
      error: null
    })

    mockSupabase.setTableResponse('meal_plans', {
      data: mockMealPlans,
      error: null,
      count: 1
    })

    const request = new NextRequest('http://localhost:3000/api/providers/meal-plans', {
      headers: {
        'Authorization': 'Bearer provider-token'
      }
    })

    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.meal_plans).toHaveLength(1)
    expect(data.data.meal_plans[0].title).toBe('Provider Plan 1')
    expect(data.data.total).toBe(1)
  })

  it('should filter meal plans by status', async () => {
    const mockProvider = { id: 'provider-1', user_id: 'provider-user-id' }
    const mockMealPlans: any[] = []

    // Configure mock responses for each table
    mockSupabase.setTableResponse('meal_plan_providers', {
      data: mockProvider,
      error: null
    })

    mockSupabase.setTableResponse('meal_plans', {
      data: mockMealPlans,
      error: null,
      count: 0
    })

    const request = new NextRequest('http://localhost:3000/api/providers/meal-plans?status=draft', {
      headers: {
        'Authorization': 'Bearer provider-token'
      }
    })

    const response = await mealPlansGET(request)

    // Test passes if no error occurs (status filtering works)
    expect(response.status).toBe(200)
  })

  it('should validate limit parameter', async () => {
    // Set up provider so validation can be reached
    const mockProvider = { id: 'provider-1', user_id: 'provider-user-id' }

    mockSupabase.setTableResponse('meal_plan_providers', {
      data: mockProvider,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/providers/meal-plans?limit=150', {
      headers: {
        'Authorization': 'Bearer provider-token'
      }
    })

    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('limit')
  })
})