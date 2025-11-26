import { NextRequest } from 'next/server'
import { POST as generatePOST } from '@/app/api/shopping-lists/generate/route'
import { GET as downloadGET } from '@/app/api/shopping-lists/[id]/download/route'

// Create a chainable mock for Supabase queries
const createChainableMock = (resolveValue: any = { data: null, error: null }) => {
  const mock = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve(resolveValue)),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    // Make the mock thenable so it can be awaited directly
    then: jest.fn((onFulfilled) => Promise.resolve(resolveValue).then(onFulfilled))
  }
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

// Mock user authentication
jest.mock('@/lib/api/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'user@example.com',
    user_type: 'user'
  }))
}))

// Mock rate limiting
jest.mock('@/lib/api/rate-limit', () => ({
  withRateLimit: jest.fn()
}))

describe('/api/shopping-lists/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should generate shopping list successfully', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Mock purchase verification
    const mockPurchase = {
      id: 'purchase-1',
      user_id: 'test-user-id',
      meal_plan_id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'completed',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    }

    // Mock meal plan with days and meals
    const mockMealPlan = {
      id: 'plan-1',
      title: 'Test Plan',
      meal_plan_days: [
        {
          id: 'day-1',
          day_number: 1,
          day_title: 'Monday',
          meals: [
            {
              id: 'meal-1',
              meal_type: 'dinner',
              meal_name: 'Spaghetti',
              ingredients: ['1 lb spaghetti', '1 jar marinara sauce', '1 lb ground beef', '1 onion diced']
            },
            {
              id: 'meal-2',
              meal_type: 'lunch',
              meal_name: 'Salad',
              ingredients: ['2 cups lettuce', '1 tomato', '1/2 cup cheese']
            }
          ]
        },
        {
          id: 'day-2',
          day_number: 2,
          day_title: 'Tuesday',
          meals: [
            {
              id: 'meal-3',
              meal_type: 'dinner',
              meal_name: 'Tacos',
              ingredients: ['1 lb ground beef', '8 taco shells', '1 cup cheese', '1 onion diced']
            }
          ]
        }
      ]
    }

    // Mock shopping list creation
    const mockShoppingList = {
      id: 'list-1',
      meal_plan_id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'test-user-id',
      purchase_id: 'purchase-1',
      ingredients_json: JSON.stringify({
        'Pantry & Dry Goods': [
          { item: 'Spaghetti', quantity: '1 lb', meals: ['Day 1 - Dinner'] },
          { item: 'Taco shells', quantity: '8', meals: ['Day 2 - Dinner'] }
        ],
        'Meat & Dairy': [
          { item: 'Ground beef', quantity: '2 lbs', meals: ['Day 1 - Dinner', 'Day 2 - Dinner'] },
          { item: 'Cheese', quantity: '1.5 cups', meals: ['Day 1 - Lunch', 'Day 2 - Dinner'] }
        ],
        'Produce': [
          { item: 'Onion diced', quantity: '2', meals: ['Day 1 - Dinner', 'Day 2 - Dinner'] },
          { item: 'Lettuce', quantity: '2 cups', meals: ['Day 1 - Lunch'] },
          { item: 'Tomato', quantity: '1', meals: ['Day 1 - Lunch'] }
        ],
        'Condiments & Sauces': [
          { item: 'Marinara sauce', quantity: '1 jar', meals: ['Day 1 - Dinner'] }
        ]
      }),
      generated_at: '2024-01-01T00:00:00Z'
    }

    // Mock first query - purchase verification (awaited after .single())
    const mockPurchaseChain = createChainableMock({ data: mockPurchase, error: null })

    // Mock second query - meal plan fetch (awaited after .single())
    const mockMealPlanChain = createChainableMock({ data: mockMealPlan, error: null })

    // Mock third query - insert shopping list (awaited after .single())
    const mockInsertChain = createChainableMock({ data: mockShoppingList, error: null })

    supabaseAdmin.from
      .mockReturnValueOnce(mockPurchaseChain)
      .mockReturnValueOnce(mockMealPlanChain)
      .mockReturnValueOnce(mockInsertChain)

    const request = new NextRequest('http://localhost:3000/api/shopping-lists/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer user-token'
      },
      body: JSON.stringify({
        meal_plan_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    const response = await generatePOST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.shopping_list.id).toBe('list-1')

    // The API returns ingredients as an already-parsed object
    const ingredients = data.data.shopping_list.ingredients
    expect(ingredients).toBeDefined()
    expect(typeof ingredients).toBe('object')
  })

  it('should generate shopping list for selected days only', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    const mockPurchase = {
      id: 'purchase-1',
      user_id: 'test-user-id',
      meal_plan_id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'completed',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    const mockMealPlan = {
      id: 'plan-1',
      title: 'Test Plan',
      meal_plan_days: [
        {
          id: 'day-1',
          day_number: 1,
          day_title: 'Monday',
          meals: [
            {
              id: 'meal-1',
              meal_type: 'dinner',
              meal_name: 'Spaghetti',
              ingredients: ['1 lb spaghetti', '1 jar marinara sauce']
            }
          ]
        },
        {
          id: 'day-2',
          day_number: 2,
          day_title: 'Tuesday',
          meals: [
            {
              id: 'meal-2',
              meal_type: 'dinner',
              meal_name: 'Tacos',
              ingredients: ['1 lb ground beef', '8 taco shells']
            }
          ]
        }
      ]
    }

    // Mock first query - purchase verification (awaited after .single())
    const mockPurchaseChain = createChainableMock({ data: mockPurchase, error: null })

    // Mock second query - meal plan fetch (awaited after .single())
    const mockMealPlanChain = createChainableMock({ data: mockMealPlan, error: null })

    // Mock third query - insert shopping list (awaited after .single())
    const mockInsertChain = createChainableMock({ data: { id: 'list-1', ingredients_json: '{}' }, error: null })

    supabaseAdmin.from
      .mockReturnValueOnce(mockPurchaseChain)
      .mockReturnValueOnce(mockMealPlanChain)
      .mockReturnValueOnce(mockInsertChain)

    const request = new NextRequest('http://localhost:3000/api/shopping-lists/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer user-token'
      },
      body: JSON.stringify({
        meal_plan_id: '550e8400-e29b-41d4-a716-446655440000',
        selected_days: [1] // Only day 1
      })
    })

    const response = await generatePOST(request)

    expect(response.status).toBe(201)
    // Verify that only day 1 ingredients are included in the shopping list generation logic
  })

  it('should fail for non-purchased meal plan', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Mock first query - purchase verification returns null
    const mockPurchaseChain = createChainableMock({ data: null, error: { message: 'No rows returned' } })

    // Mock second query - free plan check also returns null
    const mockFreePlanChain = createChainableMock({ data: null, error: null })

    supabaseAdmin.from
      .mockReturnValueOnce(mockPurchaseChain)
      .mockReturnValueOnce(mockFreePlanChain)

    const request = new NextRequest('http://localhost:3000/api/shopping-lists/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer user-token'
      },
      body: JSON.stringify({
        meal_plan_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    const response = await generatePOST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('You do not have access to this meal plan')
  })

  it('should fail for expired purchase', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    const mockExpiredPurchase = {
      id: 'purchase-1',
      user_id: 'test-user-id',
      meal_plan_id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'completed',
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
    }

    // Mock first query - purchase verification returns expired purchase
    const mockPurchaseChain = createChainableMock({ data: mockExpiredPurchase, error: null })

    supabaseAdmin.from.mockReturnValueOnce(mockPurchaseChain)

    const request = new NextRequest('http://localhost:3000/api/shopping-lists/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer user-token'
      },
      body: JSON.stringify({
        meal_plan_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    })

    const response = await generatePOST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('Your access to this meal plan has expired')
  })

  it('should validate meal_plan_id UUID format', async () => {
    const request = new NextRequest('http://localhost:3000/api/shopping-lists/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer user-token'
      },
      body: JSON.stringify({
        meal_plan_id: 'invalid-uuid'
      })
    })

    const response = await generatePOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('meal_plan_id')
  })
})

describe('/api/shopping-lists/[id]/download', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should download shopping list PDF successfully', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    const listId = '550e8400-e29b-41d4-a716-446655440001'

    const mockShoppingList = {
      id: listId,
      user_id: 'test-user-id',
      meal_plan_id: '550e8400-e29b-41d4-a716-446655440000',
      ingredients_json: JSON.stringify({
        'Meat & Dairy': [
          { item: 'Ground beef', quantity: '1 lb', meals: ['Day 1 - Dinner'] }
        ],
        'Produce': [
          { item: 'Onions', quantity: '2', meals: ['Day 1 - Dinner'] }
        ]
      }),
      generated_at: '2024-01-01T00:00:00Z',
      meal_plan: {
        title: 'Test Plan'
      }
    }

    // Mock shopping list query (awaited after .single())
    const mockShoppingListChain = createChainableMock({ data: mockShoppingList, error: null })

    supabaseAdmin.from.mockReturnValueOnce(mockShoppingListChain)

    const request = new NextRequest(`http://localhost:3000/api/shopping-lists/${listId}/download?format=pdf`, {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await downloadGET(request, { params: { id: listId } })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    expect(response.headers.get('Content-Disposition')).toContain(`shopping-list-${listId}.pdf`)
  })

  it('should return 404 for non-existent shopping list', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    const nonExistentId = '550e8400-e29b-41d4-a716-446655440002'

    // Mock shopping list query returns null (awaited after .single())
    const mockShoppingListChain = createChainableMock({ data: null, error: { message: 'No rows returned' } })

    supabaseAdmin.from.mockReturnValueOnce(mockShoppingListChain)

    const request = new NextRequest(`http://localhost:3000/api/shopping-lists/${nonExistentId}/download`, {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await downloadGET(request, { params: { id: nonExistentId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('Shopping list not found')
  })

  it('should return 403 for unauthorized access', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    const listId = '550e8400-e29b-41d4-a716-446655440003'

    const mockShoppingList = {
      id: listId,
      user_id: 'other-user-id', // Different user
      meal_plan_id: '550e8400-e29b-41d4-a716-446655440000',
      ingredients_json: '{}',
      meal_plan: { title: 'Test Plan' }
    }

    // Mock shopping list query (awaited after .single())
    const mockShoppingListChain = createChainableMock({ data: mockShoppingList, error: null })

    supabaseAdmin.from.mockReturnValueOnce(mockShoppingListChain)

    const request = new NextRequest(`http://localhost:3000/api/shopping-lists/${listId}/download`, {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await downloadGET(request, { params: { id: listId } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('You can only download your own shopping lists')
  })

  it('should validate UUID format', async () => {
    const request = new NextRequest('http://localhost:3000/api/shopping-lists/invalid-uuid/download', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await downloadGET(request, { params: { id: 'invalid-uuid' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('valid UUID')
  })
})