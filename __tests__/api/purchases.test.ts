import { NextRequest } from 'next/server'
import { POST as createIntentPOST } from '@/app/api/purchases/create-intent/route'
import { POST as confirmPOST } from '@/app/api/purchases/confirm/route'
import { GET as historyGET } from '@/app/api/purchases/history/route'

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

// Mock authentication
jest.mock('@/lib/api/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'test@example.com',
    user_type: 'user',
    name: 'Test User',
    subscription_tier: 'freemium'
  }))
}))

// Mock rate limiting
jest.mock('@/lib/api/rate-limit', () => ({
  withRateLimit: jest.fn()
}))

// Mock payment processing
jest.mock('@/lib/api/payments', () => ({
  createPaymentIntent: jest.fn(),
  verifyPaymentIntent: jest.fn()
}))

describe('/api/purchases/create-intent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create payment intent successfully', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')
    const { createPaymentIntent } = require('@/lib/api/payments')

    // Mock meal plan fetch
    const mockMealPlan = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Plan',
      final_price: 35.00,
      provider_id: 'provider-1',
      is_active: true,
      is_deleted: false,
      is_published: true
    }

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single.mockResolvedValue({
      data: mockMealPlan,
      error: null
    } as any)
    supabase.from.mockReturnValue(mockChain)

    // Mock payment intent creation
    createPaymentIntent.mockResolvedValue({
      id: 'pi_mock_12345',
      amount: 3500,
      currency: 'usd',
      client_secret: 'pi_mock_12345_secret_xyz'
    })

    const request = new NextRequest('http://localhost:3000/api/purchases/create-intent', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meal_plan_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    const response = await createIntentPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.client_secret).toBeDefined()
    expect(data.client_secret).toContain('pi_mock_12345_secret_xyz')
    expect(data.amount).toBe(3500) // $35.00 in cents
    expect(data.meal_plan.title).toBe('Test Plan')
  })

  it('should fail for non-existent meal plan', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single.mockResolvedValue({
      data: null,
      error: { message: 'No rows returned' }
    } as any)
    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/purchases/create-intent', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meal_plan_id: 'non-existent'
      })
    })

    const response = await createIntentPOST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Meal plan not found')
  })

  it('should fail for inactive meal plan', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    const mockMealPlan = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Plan',
      final_price: 35.00,
      provider_id: 'provider-1',
      is_active: false,
      is_deleted: false,
      is_published: true
    }

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    // Since the query filters for is_active: true, this will return nothing
    mockChain.single.mockResolvedValue({ data: null, error: null } as any)
    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/purchases/create-intent', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meal_plan_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    const response = await createIntentPOST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Meal plan not found')
  })

  it('should fail for deleted meal plan', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    const mockMealPlan = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Plan',
      final_price: 35.00,
      provider_id: 'provider-1',
      is_active: true,
      is_deleted: true,
      is_published: true
    }

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    // Since the query filters for is_deleted: false, this will return nothing
    mockChain.single.mockResolvedValue({ data: null, error: null } as any)
    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/purchases/create-intent', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meal_plan_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    const response = await createIntentPOST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Meal plan not found')
  })

  it('should fail for free meal plan', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    const mockMealPlan = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Free Plan',
      final_price: 0.00,
      is_free: true,
      provider_id: 'provider-1',
      is_active: true,
      is_deleted: false,
      is_published: true
    }

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.single.mockResolvedValue({
      data: mockMealPlan,
      error: null
    } as any)
    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/purchases/create-intent', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meal_plan_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    const response = await createIntentPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Cannot purchase free meal plans')
  })

  it('should validate meal_plan_id UUID format', async () => {
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    const request = new NextRequest('http://localhost:3000/api/purchases/create-intent', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meal_plan_id: 'invalid-uuid'
      })
    })

    const response = await createIntentPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.errors).toBeDefined()
  })

  it('should require authentication', async () => {
    const { requireAuth } = require('@/lib/api/auth')
    const { AuthenticationError } = require('@/lib/api/errors')

    requireAuth.mockRejectedValue(new AuthenticationError('Authentication required'))

    const request = new NextRequest('http://localhost:3000/api/purchases/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meal_plan_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    const response = await createIntentPOST(request)

    expect(response.status).toBe(401)
  })
})

describe('/api/purchases/history', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch purchase history successfully', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    const mockPurchases = [
      {
        id: 'purchase-1',
        meal_plan_id: '550e8400-e29b-41d4-a716-446655440000',
        purchase_price: 35.00,
        purchased_at: '2024-01-01T00:00:00Z',
        meal_plan: {
          title: 'Test Plan'
        },
        provider: {
          business_name: 'Test Provider'
        }
      },
      {
        id: 'purchase-2',
        meal_plan_id: 'plan-2',
        purchase_price: 25.00,
        purchased_at: '2023-12-01T00:00:00Z',
        meal_plan: {
          title: 'Another Plan'
        },
        provider: {
          business_name: 'Another Provider'
        }
      }
    ]

    const mockTotalSpentData = [
      { purchase_price: 35.00 },
      { purchase_price: 25.00 }
    ]

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    // Mock the first query (with pagination and joins)
    const mockChain1 = createChainableMock()
    mockChain1.range.mockResolvedValue({
      data: mockPurchases,
      error: null,
      count: 2
    })

    // Mock the second query (for total spent calculation)
    const mockChain2 = createChainableMock()
    mockChain2.select.mockResolvedValue({
      data: mockTotalSpentData,
      error: null
    })

    // Return different mocks for different calls
    supabase.from.mockReturnValueOnce(mockChain1).mockReturnValueOnce(mockChain2)

    const request = new NextRequest('http://localhost:3000/api/purchases/history', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })

    const response = await historyGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.purchases).toHaveLength(2)
    expect(data.purchases[0].meal_plan_title).toBe('Test Plan')
    expect(data.total).toBe(2)
    expect(data.total_spent).toBe(60.00)
  })

  it('should handle pagination correctly', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    // Mock the first query (with pagination)
    const mockChain1 = createChainableMock()
    mockChain1.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0
    })

    // Mock the second query (for total spent)
    const mockChain2 = createChainableMock()
    mockChain2.select.mockResolvedValue({
      data: [],
      error: null
    })

    supabase.from.mockReturnValueOnce(mockChain1).mockReturnValueOnce(mockChain2)

    const request = new NextRequest('http://localhost:3000/api/purchases/history?limit=5&offset=10', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })

    const response = await historyGET(request)

    expect(response.status).toBe(200)
    expect(mockChain1.range).toHaveBeenCalledWith(10, 14) // offset to offset+limit-1
  })

  it('should validate limit parameter', async () => {
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    const request = new NextRequest('http://localhost:3000/api/purchases/history?limit=150', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })

    const response = await historyGET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.errors).toBeDefined()
  })

  it('should handle empty purchase history', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    // Mock the first query (with pagination)
    const mockChain1 = createChainableMock()
    mockChain1.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0
    })

    // Mock the second query (for total spent)
    const mockChain2 = createChainableMock()
    mockChain2.select.mockResolvedValue({
      data: [],
      error: null
    })

    supabase.from.mockReturnValueOnce(mockChain1).mockReturnValueOnce(mockChain2)

    const request = new NextRequest('http://localhost:3000/api/purchases/history', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })

    const response = await historyGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.purchases).toHaveLength(0)
    expect(data.total).toBe(0)
    expect(data.total_spent).toBe(0)
  })


  it('should require authentication', async () => {
    const { requireAuth } = require('@/lib/api/auth')
    const { AuthenticationError } = require('@/lib/api/errors')

    requireAuth.mockRejectedValue(new AuthenticationError('Authentication required'))

    const request = new NextRequest('http://localhost:3000/api/purchases/history')

    const response = await historyGET(request)

    expect(response.status).toBe(401)
  })

  it('should handle database errors gracefully', async () => {
    const { supabase } = require('@/lib/supabase')
    const { requireAuth } = require('@/lib/api/auth')

    requireAuth.mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_type: 'user'
    })

    const mockChain = createChainableMock()
    mockChain.range.mockRejectedValue(new Error('Database error'))
    supabase.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/purchases/history', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })

    const response = await historyGET(request)

    expect(response.status).toBe(500)
  })
})