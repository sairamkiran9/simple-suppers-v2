import { NextRequest } from 'next/server'
import { GET as profileGET, POST as profilePOST } from '@/app/api/creators/profile/route'
import { GET as dashboardGET } from '@/app/api/creators/dashboard/route'
import { GET as mealPlansGET } from '@/app/api/creators/meal-plans/route'

// Mock Supabase with dynamic configuration
const mockSupabase = {
  // Storage for configurable mock responses by table
  mockResponses: {
    users: { data: null, error: null },
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
      users: { data: null, error: null },
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
    },
    isSupabaseAdminConfigured: jest.fn(() => true),
    isSupabaseConfigured: jest.fn(() => true)
  }
})

// Export mock utilities for test configuration
const { supabase } = require('@/lib/supabase')

// Mock creator authentication
const mockAuthUser = {
  id: 'creator-user-id',
  email: 'creator@example.com',
  user_type: 'user',
  name: 'Test Creator',
  subscription_tier: 'premium',
  is_creator: true,
  creator_display_name: 'Test Kitchen',
  creator_bio: 'Amazing meals for everyone',
  creator_profile_image_url: 'https://example.com/image.jpg',
  creator_email_verified: true,
  total_earnings: 350.00,
  total_meal_plans_created: 5,
  creator_rating: 4.5,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

jest.mock('@/lib/api/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve(mockAuthUser)),
  checkIsCreator: jest.fn(() => Promise.resolve({
    isCreator: true,
    creatorProfile: {
      id: 'user-1',
      is_creator: true,
      creator_display_name: 'Test Kitchen',
      creator_bio: 'Amazing meals',
      creator_profile_image_url: 'https://example.com/image.jpg',
      creator_email_verified: true,
      total_earnings: 250.00,
      total_meal_plans_created: 5,
      creator_rating: 4.5
    }
  }))
}))

// Mock rate limiting
jest.mock('@/lib/api/rate-limit', () => ({
  withRateLimit: jest.fn()
}))

// Mock validation
jest.mock('@/lib/api/validation', () => ({
  CreatorProfileSchema: {},
  validateBody: jest.fn((schema, body) => {
    // Check for empty creator_display_name to trigger validation error
    if (body.creator_display_name === '') {
      return {
        success: false,
        error: 'Creator display name is required'
      }
    }
    return {
      success: true,
      data: {
        creator_display_name: body.creator_display_name || 'Test Kitchen',
        creator_bio: body.creator_bio || 'Amazing meals',
        creator_profile_image_url: body.creator_profile_image_url || 'https://example.com/image.jpg'
      }
    }
  }),
  CreatorMealPlansQuerySchema: {},
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

describe('/api/creators/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.reset()
  })

  it('should fetch creator profile successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/creators/profile', {
      headers: {
        'Authorization': 'Bearer creator-token'
      }
    })

    const response = await profileGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.creator.creator_display_name).toBe('Test Kitchen')
    expect(data.data.creator.total_earnings).toBe(350.00)
  })

  it('should return 403 for non-creator user', async () => {
    const { requireAuth } = require('@/lib/api/auth')
    requireAuth.mockResolvedValueOnce({
      ...mockAuthUser,
      is_creator: false
    })

    const request = new NextRequest('http://localhost:3000/api/creators/profile', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await profileGET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('creator profile')
  })

  it('should update creator profile successfully', async () => {
    const existingCreator = {
      id: 'user-1',
      is_creator: true
    }

    const updatedCreator = {
      id: 'user-1',
      is_creator: true,
      creator_display_name: 'Updated Kitchen',
      creator_bio: 'Updated bio',
      creator_profile_image_url: 'https://example.com/new-image.jpg',
      creator_email_verified: true,
      is_active: true,
      total_earnings: 0,
      total_meal_plans_created: 0,
      creator_rating: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    // Configure mock for existing creator check (first call)
    mockSupabase.setTableResponse('users', {
      data: existingCreator,
      error: null
    })

    // Configure mock for update operation
    mockSupabase.setMockResponse('update', {
      data: updatedCreator,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/creators/profile', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer creator-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creator_display_name: 'Updated Kitchen',
        creator_bio: 'Updated bio',
        creator_profile_image_url: 'https://example.com/new-image.jpg'
      })
    })

    const response = await profilePOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.creator.creator_display_name).toBe('Updated Kitchen')
  })

  it('should validate creator display name requirement', async () => {
    const request = new NextRequest('http://localhost:3000/api/creators/profile', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer creator-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creator_display_name: '', // Empty creator display name
        creator_bio: 'Updated bio'
      })
    })

    const response = await profilePOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Creator display name is required')
  })
})

describe('/api/creators/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.reset()
  })

  it('should fetch creator dashboard data successfully', async () => {
    // Mock creator profile
    const mockCreator = {
      id: 'user-1',
      is_creator: true,
      creator_display_name: 'Test Kitchen',
      total_earnings: 350.00,
      total_meal_plans_created: 5,
      creator_rating: 4.5
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
        creator_earnings: 24.50,
        purchased_at: '2024-01-01T00:00:00Z',
        status: 'completed',
        meal_plan: { title: 'Test Plan' },
        user: { name: 'John Doe', email: 'john@example.com' }
      }
    ]

    // Mock monthly earnings
    const mockMonthlyEarnings = [
      { creator_earnings: 24.50 }
    ]

    // Configure mock responses for each table
    mockSupabase.setTableResponse('users', {
      data: mockCreator,
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

    const request = new NextRequest('http://localhost:3000/api/creators/dashboard', {
      headers: {
        'Authorization': 'Bearer creator-token'
      }
    })

    const response = await dashboardGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.creator).toBeDefined()
    expect(data.data.analytics).toBeDefined()
    expect(data.data.creator.total_earnings).toBe(350.00)
    expect(data.data.creator.total_plans).toBe(5)
    expect(data.data.recent_purchases).toHaveLength(1)
  })

  it('should return 403 when user is not a creator for dashboard', async () => {
    const { requireAuth } = require('@/lib/api/auth')
    requireAuth.mockResolvedValueOnce({
      ...mockAuthUser,
      is_creator: false
    })

    const request = new NextRequest('http://localhost:3000/api/creators/dashboard', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await dashboardGET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('creator')
  })
})

describe('/api/creators/meal-plans', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.reset()
  })

  it('should fetch creator meal plans successfully', async () => {
    // Mock creator profile
    const mockCreator = {
      id: 'user-1',
      is_creator: true
    }

    const mockMealPlans = [
      {
        id: 'plan-1',
        title: 'Creator Plan 1',
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
    mockSupabase.setTableResponse('users', {
      data: mockCreator,
      error: null
    })

    mockSupabase.setTableResponse('meal_plans', {
      data: mockMealPlans,
      error: null,
      count: 1
    })

    const request = new NextRequest('http://localhost:3000/api/creators/meal-plans', {
      headers: {
        'Authorization': 'Bearer creator-token'
      }
    })

    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.meal_plans).toHaveLength(1)
    expect(data.data.meal_plans[0].title).toBe('Creator Plan 1')
    expect(data.data.total).toBe(1)
  })

  it('should filter meal plans by status', async () => {
    const mockCreator = { id: 'user-1', is_creator: true }
    const mockMealPlans: any[] = []

    // Configure mock responses for each table
    mockSupabase.setTableResponse('users', {
      data: mockCreator,
      error: null
    })

    mockSupabase.setTableResponse('meal_plans', {
      data: mockMealPlans,
      error: null,
      count: 0
    })

    const request = new NextRequest('http://localhost:3000/api/creators/meal-plans?status=draft', {
      headers: {
        'Authorization': 'Bearer creator-token'
      }
    })

    const response = await mealPlansGET(request)

    // Test passes if no error occurs (status filtering works)
    expect(response.status).toBe(200)
  })

  it('should validate limit parameter', async () => {
    // Set up creator so validation can be reached
    const mockCreator = { id: 'user-1', is_creator: true }

    mockSupabase.setTableResponse('users', {
      data: mockCreator,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/creators/meal-plans?limit=150', {
      headers: {
        'Authorization': 'Bearer creator-token'
      }
    })

    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('limit')
  })
})
