import { NextRequest } from 'next/server'
import { GET as mealPlansGET } from '@/app/api/meal-plans/route'
import { GET as mealPlanGET } from '@/app/api/meal-plans/[id]/route'

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
  in: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis()
})

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn()
    },
    from: jest.fn(() => createChainableMock())
  },
  isSupabaseAdminConfigured: jest.fn(() => true),
  isSupabaseConfigured: jest.fn(() => true)
}))

// Mock rate limiting
jest.mock('@/lib/api/rate-limit', () => ({
  withRateLimit: jest.fn()
}))

// Mock auth utilities
jest.mock('@/lib/api/auth', () => ({
  getCurrentUser: jest.fn(),
  requireAuth: jest.fn(),
  checkMealPlanAccess: jest.fn()
}))

// Mock database utils
jest.mock('@/lib/database-utils', () => ({
  getMealPlans: jest.fn(),
  getMealPlanById: jest.fn(),
  updateMealPlanViews: jest.fn(),
  trackEvent: jest.fn()
}))

describe('/api/meal-plans', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should get meal plans successfully without authentication', async () => {
    const { getMealPlans } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)

    const mockMealPlans = [
      {
        id: 'plan-1',
        title: 'Quick Family Meals',
        description: 'Easy family dinners for busy weeknights',
        duration_days: 7,
        duration_type: 'weekly',
        final_price: 35.00,
        category: 'family',
        dietary_tags: ['family-friendly', 'quick'],
        difficulty_level: 'beginner',
        is_free: false,
        is_featured: true,
        average_rating: 4.5,
        total_purchases: 50,
        provider: {
          business_name: 'Mom\'s Kitchen',
          profile_image_url: 'https://example.com/image.jpg'
        }
      }
    ]

    getMealPlans.mockResolvedValue(mockMealPlans)

    const request = new NextRequest('http://localhost:3000/api/meal-plans')
    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.meal_plans).toHaveLength(1)
    expect(data.data.meal_plans[0].title).toBe('Quick Family Meals')
    expect(data.data.total).toBe(1)
  })

  it('should filter meal plans by category', async () => {
    const { getMealPlans } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)
    getMealPlans.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/meal-plans?category=family')
    const response = await mealPlansGET(request)

    expect(response.status).toBe(200)
    expect(getMealPlans).toHaveBeenCalledWith({ category: 'family' })
  })

  it('should filter meal plans by price range', async () => {
    const { getMealPlans } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)

    const mockMealPlans = [
      {
        id: 'plan-1',
        title: 'Budget Meals',
        final_price: 25.00,
        provider: { business_name: 'Test' },
        dietary_tags: []
      },
      {
        id: 'plan-2',
        title: 'Premium Meals',
        final_price: 55.00,
        provider: { business_name: 'Test' },
        dietary_tags: []
      }
    ]

    getMealPlans.mockResolvedValue(mockMealPlans)

    const request = new NextRequest('http://localhost:3000/api/meal-plans?min_price=20&max_price=40')
    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.meal_plans).toHaveLength(1)
    expect(data.data.meal_plans[0].title).toBe('Budget Meals')
  })

  it('should filter meal plans by dietary tags', async () => {
    const { getMealPlans } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)

    const mockMealPlans = [
      {
        id: 'plan-1',
        title: 'Vegetarian Meals',
        final_price: 30.00,
        provider: { business_name: 'Test' },
        dietary_tags: ['vegetarian', 'healthy']
      },
      {
        id: 'plan-2',
        title: 'Meat Lovers',
        final_price: 35.00,
        provider: { business_name: 'Test' },
        dietary_tags: ['high-protein']
      }
    ]

    getMealPlans.mockResolvedValue(mockMealPlans)

    const request = new NextRequest('http://localhost:3000/api/meal-plans?dietary_tags=vegetarian')
    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.meal_plans).toHaveLength(1)
    expect(data.data.meal_plans[0].title).toBe('Vegetarian Meals')
  })

  it('should search meal plans by text', async () => {
    const { getMealPlans } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)

    const mockMealPlans = [
      {
        id: 'plan-1',
        title: 'Quick Family Meals',
        description: 'Fast dinners for families',
        category: 'family',
        final_price: 30.00,
        provider: { business_name: 'Test Kitchen' },
        dietary_tags: []
      },
      {
        id: 'plan-2',
        title: 'Gourmet Dinners',
        description: 'Elegant evening meals',
        category: 'gourmet',
        final_price: 50.00,
        provider: { business_name: 'Fine Dining Co' },
        dietary_tags: []
      }
    ]

    getMealPlans.mockResolvedValue(mockMealPlans)

    const request = new NextRequest('http://localhost:3000/api/meal-plans?search=family')
    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.meal_plans).toHaveLength(1)
    expect(data.data.meal_plans[0].title).toBe('Quick Family Meals')
  })

  it('should handle pagination correctly', async () => {
    const { getMealPlans } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)

    const mockMealPlans = Array.from({ length: 25 }, (_, i) => ({
      id: `plan-${i}`,
      title: `Meal Plan ${i}`,
      final_price: 30.00,
      provider: { business_name: 'Test' },
      dietary_tags: []
    }))

    getMealPlans.mockResolvedValue(mockMealPlans)

    const request = new NextRequest('http://localhost:3000/api/meal-plans?limit=10&offset=5')
    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.meal_plans).toHaveLength(10)
    expect(data.data.total).toBe(25)
    expect(data.data.has_more).toBe(true)
  })

  it('should track analytics event for authenticated users', async () => {
    const { getMealPlans, trackEvent } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      user_type: 'user'
    }

    getCurrentUser.mockResolvedValue(mockUser)
    getMealPlans.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/meal-plans?category=family')
    await mealPlansGET(request)

    expect(trackEvent).toHaveBeenCalledWith({
      event_type: 'browse_meal_plans',
      user_id: 'user-1',
      metadata: {
        filters: { category: 'family' },
        search: undefined,
        results_count: 0
      }
    })
  })

  it('should filter free meal plans', async () => {
    const { getMealPlans } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)
    getMealPlans.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/meal-plans?is_free=true')
    await mealPlansGET(request)

    expect(getMealPlans).toHaveBeenCalledWith({ is_free: true })
  })

  it('should handle invalid query parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/meal-plans?limit=invalid')
    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should validate limit parameter maximum', async () => {
    const { getMealPlans } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)
    getMealPlans.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/meal-plans?limit=150')
    const response = await mealPlansGET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('limit')
  })

  it('should handle database errors gracefully', async () => {
    const { getMealPlans } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)
    getMealPlans.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/meal-plans')
    const response = await mealPlansGET(request)

    expect(response.status).toBe(500)
  })
})

describe('/api/meal-plans/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should get meal plan details successfully', async () => {
    const { getMealPlanById, updateMealPlanViews } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)
    updateMealPlanViews.mockResolvedValue(undefined)

    const mockMealPlan = {
      id: 'plan-1',
      title: 'Quick Family Meals',
      description: 'Easy family dinners for busy weeknights',
      duration_days: 7,
      duration_type: 'weekly',
      final_price: 35.00,
      category: 'family',
      dietary_tags: ['family-friendly', 'quick'],
      difficulty_level: 'beginner',
      is_free: true,
      provider: {
        id: 'provider-1',
        business_name: 'Mom\'s Kitchen',
        bio: 'Practical meals for busy families'
      },
      meal_plan_days: [
        {
          id: 'day-1',
          day_number: 1,
          day_title: 'Monday',
          meals: [
            {
              id: 'meal-1',
              meal_type: 'dinner',
              meal_name: 'Spaghetti with Meat Sauce',
              description: 'Classic family dinner',
              prep_time_minutes: 10,
              cook_time_minutes: 30,
              servings: 6,
              ingredients: ['1 lb spaghetti', '1 lb ground beef'],
              instructions: '1. Brown ground beef...',
              image_url: 'https://example.com/image.jpg'
            }
          ]
        }
      ]
    }

    getMealPlanById.mockResolvedValue(mockMealPlan)

    const request = new NextRequest('http://localhost:3000/api/meal-plans/plan-1')
    const response = await mealPlanGET(request, { params: { id: 'plan-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.title).toBe('Quick Family Meals')
    expect(data.data.meal_plan_days).toHaveLength(1)
  })

  it('should return 404 for non-existent meal plan', async () => {
    const { getMealPlanById } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)
    getMealPlanById.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/meal-plans/non-existent')
    const response = await mealPlanGET(request, { params: { id: 'non-existent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
  })

  it('should handle invalid meal plan ID', async () => {
    const { getMealPlanById, updateMealPlanViews } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)
    getMealPlanById.mockResolvedValue(null)
    updateMealPlanViews.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/meal-plans/invalid-uuid')
    const response = await mealPlanGET(request, { params: { id: 'invalid-uuid' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Meal plan not found')
  })

  it('should handle database errors gracefully', async () => {
    const { getMealPlanById } = require('@/lib/database-utils')
    const { getCurrentUser } = require('@/lib/api/auth')

    getCurrentUser.mockResolvedValue(null)
    getMealPlanById.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/meal-plans/550e8400-e29b-41d4-a716-446655440000')
    const response = await mealPlanGET(request, { params: { id: '550e8400-e29b-41d4-a716-446655440000' } })

    expect(response.status).toBe(500)
  })

  it('should handle access control for premium meal plans', async () => {
    const { getMealPlanById, updateMealPlanViews } = require('@/lib/database-utils')
    const { getCurrentUser, checkMealPlanAccess } = require('@/lib/api/auth')

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      user_type: 'user'
    }

    getCurrentUser.mockResolvedValue(mockUser)
    updateMealPlanViews.mockResolvedValue(undefined)
    checkMealPlanAccess.mockResolvedValue({ hasAccess: false, accessType: 'none' })

    const mockMealPlan = {
      id: 'plan-1',
      title: 'Premium Plan',
      is_free: false,
      provider: {
        id: 'provider-1',
        business_name: 'Test Kitchen'
      },
      meal_plan_days: []
    }

    getMealPlanById.mockResolvedValue(mockMealPlan)

    const request = new NextRequest('http://localhost:3000/api/meal-plans/550e8400-e29b-41d4-a716-446655440000')
    const response = await mealPlanGET(request, { params: { id: '550e8400-e29b-41d4-a716-446655440000' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Should return basic info but not detailed meals for unpurchased premium plan
  })
})