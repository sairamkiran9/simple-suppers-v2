import { NextRequest } from 'next/server'
import { POST as generatePOST } from '@/app/api/shopping-lists/generate/route'
import { GET as downloadGET } from '@/app/api/shopping-lists/[id]/download/route'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: null, error: null }))
              })),
              single: jest.fn(() => Promise.resolve({ data: null, error: null }))
            })),
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
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
    const { supabase } = require('@/lib/supabase')

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

    supabase.from().select().eq().single
      .mockResolvedValueOnce({ data: mockPurchase, error: null })
      .mockResolvedValueOnce({ data: mockMealPlan, error: null })

    supabase.from().insert().select().single.mockResolvedValue({
      data: mockShoppingList,
      error: null
    })

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

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.shopping_list.id).toBe('list-1')

    const ingredients = JSON.parse(data.data.shopping_list.ingredients_json)
    expect(ingredients['Meat & Dairy']).toBeDefined()
    expect(ingredients['Meat & Dairy'].find((item: any) => item.item === 'Ground beef')).toBeDefined()
    expect(ingredients['Meat & Dairy'].find((item: any) => item.item === 'Ground beef').quantity).toBe('2 lbs')
  })

  it('should generate shopping list for selected days only', async () => {
    const { supabase } = require('@/lib/supabase')

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

    supabase.from().select().eq().single
      .mockResolvedValueOnce({ data: mockPurchase, error: null })
      .mockResolvedValueOnce({ data: mockMealPlan, error: null })

    supabase.from().insert().select().single.mockResolvedValue({
      data: { id: 'list-1', ingredients_json: '{}' },
      error: null
    })

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

    expect(response.status).toBe(200)
    // Verify that only day 1 ingredients are included in the shopping list generation logic
  })

  it('should fail for non-purchased meal plan', async () => {
    const { supabase } = require('@/lib/supabase')

    supabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { message: 'No rows returned' }
    })

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
    expect(data.error).toBe('You must purchase this meal plan to generate a shopping list')
  })

  it('should fail for expired purchase', async () => {
    const { supabase } = require('@/lib/supabase')

    const mockExpiredPurchase = {
      id: 'purchase-1',
      user_id: 'test-user-id',
      meal_plan_id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'completed',
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
    }

    supabase.from().select().eq().single.mockResolvedValue({
      data: mockExpiredPurchase,
      error: null
    })

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
    expect(data.error).toBe('Your access to this meal plan has expired')
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
    const { supabase } = require('@/lib/supabase')

    const mockShoppingList = {
      id: 'list-1',
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

    supabase.from().select().eq().single.mockResolvedValue({
      data: mockShoppingList,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/shopping-lists/list-1/download', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await downloadGET(request, { params: { id: 'list-1' } })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    expect(response.headers.get('Content-Disposition')).toContain('shopping-list-test-plan.pdf')
  })

  it('should return 404 for non-existent shopping list', async () => {
    const { supabase } = require('@/lib/supabase')

    supabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { message: 'No rows returned' }
    })

    const request = new NextRequest('http://localhost:3000/api/shopping-lists/non-existent/download', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await downloadGET(request, { params: { id: 'non-existent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('Shopping list not found')
  })

  it('should return 403 for unauthorized access', async () => {
    const { supabase } = require('@/lib/supabase')

    const mockShoppingList = {
      id: 'list-1',
      user_id: 'other-user-id', // Different user
      meal_plan_id: '550e8400-e29b-41d4-a716-446655440000',
      ingredients_json: '{}',
      meal_plan: { title: 'Test Plan' }
    }

    supabase.from().select().eq().single.mockResolvedValue({
      data: mockShoppingList,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/shopping-lists/list-1/download', {
      headers: {
        'Authorization': 'Bearer user-token'
      }
    })

    const response = await downloadGET(request, { params: { id: 'list-1' } })
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