import { NextRequest } from 'next/server'
import { PATCH as profilePATCH } from '@/app/api/user/profile/route'
import { GET as dashboardGET } from '@/app/api/user/dashboard/route'

// Create a chainable mock for Supabase queries
const createChainableMock = () => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis()
})

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn()
    },
    from: jest.fn(() => createChainableMock())
  }
}))

// Mock user authentication
jest.mock('@/lib/api/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'user@example.com',
    user_type: 'user',
    name: 'Test User',
    subscription_tier: 'freemium'
  }))
}))

// Mock rate limiting
jest.mock('@/lib/api/rate-limit', () => ({
  withRateLimit: jest.fn()
}))

// Mock database utils
jest.mock('@/lib/database-utils', () => ({
  getUserPurchases: jest.fn(() => Promise.resolve([])),
  createPurchase: jest.fn(),
  trackEvent: jest.fn()
}))

describe('/api/user/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update user profile successfully', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    const mockUser = {
      id: 'test-user-id',
      email: 'user@example.com',
      name: 'John Doe Updated',
      user_type: 'user',
      subscription_tier: 'freemium',
      free_plans_used: 1,
      dietary_preferences: ['vegetarian', 'gluten-free'],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single.mockResolvedValue({
      data: mockUser,
      error: null
    } as any)
    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer user-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'John Doe Updated'
      })
    })

    const response = await profilePATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user.name).toBe('John Doe Updated')
  })

  it('should return validation error for invalid data', async () => {
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer user-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: '' // Invalid - empty name
      })
    })

    const response = await profilePATCH(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should require authentication', async () => {
    const { requireAuth } = require('@/lib/api/auth')
    const { AuthenticationError } = require('@/lib/api/errors')

    requireAuth.mockRejectedValue(new AuthenticationError('Authentication required'))

    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Test' })
    })

    const response = await profilePATCH(request)

    expect(response.status).toBe(401)
  })

  it('should update user profile successfully', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    const updatedUser = {
      id: 'test-user-id',
      email: 'user@example.com',
      name: 'John Smith',
      dietary_preferences: ['vegan', 'low-carb'],
      updated_at: '2024-01-02T00:00:00Z'
    }

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single.mockResolvedValue({
      data: updatedUser,
      error: null
    } as any)
    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer user-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'John Smith',
        dietary_preferences: ['vegan', 'low-carb']
      })
    })

    const response = await profilePATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user.name).toBe('John Smith')
    expect(data.data.user.dietary_preferences).toEqual(['vegan', 'low-carb'])
  })

  it('should validate name length', async () => {
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer user-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: '', // Empty name
        dietary_preferences: ['vegetarian']
      })
    })

    const response = await profilePATCH(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('name')
  })

  it('should handle partial updates', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    const updatedUser = {
      id: 'test-user-id',
      name: 'John Smith',
      email: 'user@example.com',
      dietary_preferences: ['vegetarian'] // unchanged
    }

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single.mockResolvedValue({
      data: updatedUser,
      error: null
    } as any)
    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer user-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'John Smith'
        // dietary_preferences not provided - should not be updated
      })
    })

    const response = await profilePATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user.name).toBe('John Smith')
  })

  it('should validate dietary preferences format', async () => {
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer user-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'John Smith',
        dietary_preferences: 'not-an-array' // Should be array
      })
    })

    const response = await profilePATCH(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should handle database errors during update', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    } as any)
    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer user-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'John Smith'
      })
    })

    const response = await profilePATCH(request)

    expect(response.status).toBe(500)
  })
})

describe('/api/user/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch user dashboard data successfully', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    // Mock user profile
    const mockUser = {
      id: 'test-user-id',
      free_plans_used: 1,
      subscription_tier: 'freemium'
    }

    // Mock active purchases
    const mockActivePurchases = [
      {
        id: 'purchase-1',
        meal_plan_id: 'plan-1',
        purchased_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-04-01T00:00:00Z',
        meal_plan: {
          id: 'plan-1',
          title: 'Active Plan',
          duration_days: 7,
          category: 'family'
        }
      }
    ]

    // Mock recommended plans
    const mockRecommendedPlans = [
      {
        id: 'plan-2',
        title: 'Recommended Plan',
        description: 'Great for you',
        final_price: 25.00,
        category: 'healthy',
        dietary_tags: ['vegetarian'],
        is_featured: true,
        average_rating: 4.8,
        provider: {
          business_name: 'Healthy Kitchen'
        }
      }
    ]

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single
      .mockResolvedValueOnce({ data: mockUser, error: null } as any)

    mockChain.order.mockReturnThis()
    mockChain.limit
      .mockResolvedValueOnce({ data: mockActivePurchases, error: null })
      .mockResolvedValueOnce({ data: mockRecommendedPlans, error: null })

    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/user/dashboard', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await dashboardGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.overview).toBeDefined()
    expect(data.data.overview.free_plans_remaining).toBe(2) // 3 total - 1 used
    expect(data.data.overview.active_plans).toBe(1)
    expect(data.data.active_purchases).toHaveLength(1)
    expect(data.data.active_purchases[0].meal_plan.title).toBe('Active Plan')
    expect(data.data.recommended_plans).toHaveLength(1)
    expect(data.data.recommended_plans[0].title).toBe('Recommended Plan')
  })

  it('should handle premium user with unlimited plans', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    const mockUser = {
      id: 'test-user-id',
      free_plans_used: 5,
      subscription_tier: 'premium'
    }

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single
      .mockResolvedValueOnce({ data: mockUser, error: null } as any)

    mockChain.order.mockReturnThis()
    mockChain.limit
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/user/dashboard', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await dashboardGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.overview.free_plans_remaining).toBe('unlimited')
  })

  it('should handle user with no active purchases', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    const mockUser = {
      id: 'test-user-id',
      free_plans_used: 0,
      subscription_tier: 'freemium'
    }

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single
      .mockResolvedValueOnce({ data: mockUser, error: null } as any)

    mockChain.order.mockReturnThis()
    mockChain.limit
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/user/dashboard', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await dashboardGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.overview.active_plans).toBe(0)
    expect(data.data.overview.free_plans_remaining).toBe(3)
    expect(data.data.active_purchases).toHaveLength(0)
  })

  it('should require authentication', async () => {
    const { requireAuth } = require('@/lib/api/auth')
    const { AuthenticationError } = require('@/lib/api/errors')

    requireAuth.mockRejectedValue(new AuthenticationError('Authentication required'))

    const request = new NextRequest('http://localhost:3000/api/user/dashboard')

    const response = await dashboardGET(request)

    expect(response.status).toBe(401)
  })

  it('should handle database errors gracefully', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single.mockRejectedValue(new Error('Database error'))
    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/user/dashboard', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await dashboardGET(request)

    expect(response.status).toBe(500)
  })

  it('should calculate total purchases correctly', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    const mockUser = {
      id: 'test-user-id',
      free_plans_used: 2,
      subscription_tier: 'freemium'
    }

    // Mock purchases history count
    const mockPurchases = Array.from({ length: 5 }, (_, i) => ({
      id: `purchase-${i}`,
      status: 'completed'
    }))

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'user@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single
      .mockResolvedValueOnce({ data: mockUser, error: null } as any)

    // Mock for counting total purchases
    mockChain.select.mockReturnThis()
    mockChain.eq.mockReturnThis()
    mockChain.order.mockReturnThis()
    mockChain.limit
      .mockResolvedValueOnce({ data: [], error: null }) // active purchases
      .mockResolvedValueOnce({ data: [], error: null }) // recommended plans

    // Mock separate call for total purchase count
    const countMockChain = createChainableMock()
    countMockChain.select.mockResolvedValue({ count: 5, error: null })

    supabase.from
      .mockReturnValueOnce(mockChain)  // user profile
      .mockReturnValueOnce(mockChain)  // active purchases
      .mockReturnValueOnce(mockChain)  // recommended plans
      .mockReturnValueOnce(countMockChain) // total purchases count

    const request = new NextRequest('http://localhost:3000/api/user/dashboard', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await dashboardGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.overview.total_purchases).toBe(5)
  })
})