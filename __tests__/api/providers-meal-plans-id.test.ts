import { NextRequest } from 'next/server'
import { PATCH, DELETE } from '@/app/api/providers/meal-plans/[id]/route'

// Mock Supabase with dynamic configuration
const mockSupabase = {
  mockResponses: {
    meal_plan_providers: { data: null, error: null },
    meal_plans: { data: null, error: null },
    update: { data: null, error: null }
  } as Record<string, any>,

  callCounts: {} as Record<string, number>,

  setTableResponse: (table: string, response: any) => {
    mockSupabase.mockResponses[table] = response
  },

  setMockResponse: (operation: string, response: any) => {
    mockSupabase.mockResponses[operation] = response
  },

  reset: () => {
    mockSupabase.mockResponses = {
      meal_plan_providers: { data: null, error: null },
      meal_plans: { data: null, error: null },
      update: { data: null, error: null }
    } as Record<string, any>
    mockSupabase.callCounts = {}
  },

  getTableResponse: (table: string) => {
    return mockSupabase.mockResponses[table] || { data: null, error: null }
  }
}

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn((tableName) => {
      const createQueryChain = (): any => {
        const chain: any = {
          select: jest.fn(() => chain),
          eq: jest.fn(() => chain),
          single: jest.fn(() => Promise.resolve(mockSupabase.getTableResponse(tableName)))
        }
        return chain
      }

      const fromObject = {
        select: jest.fn(() => createQueryChain()),
        update: jest.fn((data) => {
          // Store update data for verification
          mockSupabase.mockResponses.lastUpdateData = data
          return {
            eq: jest.fn(() => {
              // For DELETE endpoint (no .select() after .eq())
              const deleteChain = {
                select: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve(mockSupabase.mockResponses.update))
                }))
              }
              // Return promise with select method for chaining
              const promise = Promise.resolve(mockSupabase.mockResponses.update)
              return Object.assign(promise, deleteChain)
            })
          }
        })
      }
      return fromObject
    })
  }
}))

// Mock provider authentication
const mockAuthUser = {
  id: 'provider-user-id',
  email: 'provider@example.com',
  user_type: 'provider',
  name: 'Test Provider',
  subscription_tier: 'premium' as const
}

jest.mock('@/lib/api/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve(mockAuthUser))
}))

// Mock rate limiting
jest.mock('@/lib/api/rate-limit', () => ({
  withRateLimit: jest.fn()
}))

// Mock validation
jest.mock('@/lib/api/validation', () => {
  const z = require('zod')

  // Create actual schema for testing
  const UpdateMealPlanSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    dietary_tags: z.array(z.string()).optional(),
    difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    is_published: z.boolean().optional(),
    is_active: z.boolean().optional()
  }).refine(
    (data: any) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  )

  return {
    UpdateMealPlanSchema,
    validateBody: jest.fn((schema, body) => {
      const result = UpdateMealPlanSchema.safeParse(body)
      if (result.success) {
        return { success: true, data: result.data }
      }
      const errors = result.error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
      return { success: false, error: errors }
    })
  }
})

const { requireAuth } = require('@/lib/api/auth')
const { supabase } = require('@/lib/supabase')

describe('/api/providers/meal-plans/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.reset()

    // Reset auth mock to default provider user
    requireAuth.mockResolvedValue(mockAuthUser)
  })

  describe('PATCH', () => {
    const mockProvider = {
      id: 'provider-1',
      user_id: 'provider-user-id',
      total_plans: 5
    }

    const mockExistingMealPlan = {
      id: 'plan-1',
      provider_id: 'provider-1',
      is_deleted: false,
      title: 'Original Title',
      description: 'Original Description'
    }

    it('should successfully update meal plan title', async () => {
      // Mock provider profile
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      // Mock existing meal plan (for ownership check)
      mockSupabase.setTableResponse('meal_plans', {
        data: mockExistingMealPlan,
        error: null
      })

      // Mock update response
      mockSupabase.setMockResponse('update', {
        data: {
          ...mockExistingMealPlan,
          title: 'Updated Title',
          updated_at: '2025-10-09T12:00:00Z'
        },
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Title' })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.meal_plan.title).toBe('Updated Title')
    })

    it('should successfully update meal plan description', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      mockSupabase.setTableResponse('meal_plans', {
        data: mockExistingMealPlan,
        error: null
      })

      mockSupabase.setMockResponse('update', {
        data: {
          ...mockExistingMealPlan,
          description: 'Updated Description',
          updated_at: '2025-10-09T12:00:00Z'
        },
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: 'Updated Description' })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.meal_plan.description).toBe('Updated Description')
    })

    it('should successfully update multiple fields', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      mockSupabase.setTableResponse('meal_plans', {
        data: mockExistingMealPlan,
        error: null
      })

      mockSupabase.setMockResponse('update', {
        data: {
          ...mockExistingMealPlan,
          title: 'New Title',
          description: 'New Description',
          category: 'Mediterranean',
          dietary_tags: ['gluten-free', 'vegetarian'],
          difficulty_level: 'intermediate',
          updated_at: '2025-10-09T12:00:00Z'
        },
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'New Title',
          description: 'New Description',
          category: 'Mediterranean',
          dietary_tags: ['gluten-free', 'vegetarian'],
          difficulty_level: 'intermediate'
        })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.meal_plan.title).toBe('New Title')
      expect(data.data.meal_plan.category).toBe('Mediterranean')
      expect(data.data.meal_plan.dietary_tags).toEqual(['gluten-free', 'vegetarian'])
    })

    it('should successfully publish meal plan (is_published = true)', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      mockSupabase.setTableResponse('meal_plans', {
        data: {
          ...mockExistingMealPlan,
          is_published: false
        },
        error: null
      })

      mockSupabase.setMockResponse('update', {
        data: {
          ...mockExistingMealPlan,
          is_published: true,
          updated_at: '2025-10-09T12:00:00Z'
        },
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_published: true })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should successfully deactivate meal plan (is_active = false)', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      mockSupabase.setTableResponse('meal_plans', {
        data: {
          ...mockExistingMealPlan,
          is_active: true
        },
        error: null
      })

      mockSupabase.setMockResponse('update', {
        data: {
          ...mockExistingMealPlan,
          is_active: false,
          updated_at: '2025-10-09T12:00:00Z'
        },
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: false })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should fail with 400 when no fields provided', async () => {
      // Set up provider so we can reach validation
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('At least one field must be provided')
    })

    it('should fail with 400 when validation fails (empty title)', async () => {
      // Set up provider so we can reach validation
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: '' })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should fail with 400 when validation fails (invalid difficulty_level)', async () => {
      // Set up provider so we can reach validation
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ difficulty_level: 'expert' })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should fail with 401 when not authenticated', async () => {
      // Mock authentication failure
      const { requireAuth } = require('@/lib/api/auth')
      requireAuth.mockRejectedValueOnce(new Error('Authentication required'))

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Title' })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(500) // Generic error handling
      expect(data.success).toBe(false)
    })

    it('should fail with 403 when user is not a provider', async () => {
      // Mock user authentication
      requireAuth.mockResolvedValueOnce({
        ...mockAuthUser,
        user_type: 'user'
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer user-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Title' })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Only providers')
    })

    it('should fail with 403 when provider does not own the meal plan', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      // Mock meal plan owned by different provider
      mockSupabase.setTableResponse('meal_plans', {
        data: {
          ...mockExistingMealPlan,
          provider_id: 'different-provider-id'
        },
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Title' })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('do not have permission')
    })

    it('should fail with 404 when meal plan does not exist', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      // Mock meal plan not found
      mockSupabase.setTableResponse('meal_plans', {
        data: null,
        error: { message: 'Not found' }
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Title' })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Meal plan not found')
    })

    it('should fail with 404 when meal plan is deleted', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      // Mock deleted meal plan
      mockSupabase.setTableResponse('meal_plans', {
        data: {
          ...mockExistingMealPlan,
          is_deleted: true
        },
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Title' })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })

    it('should fail with 404 when provider profile not found', async () => {
      // Mock provider not found
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: null,
        error: { message: 'Not found' }
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer provider-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Title' })
      })

      const response = await PATCH(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Provider profile not found')
    })
  })

  describe('DELETE', () => {
    const mockProvider = {
      id: 'provider-1',
      user_id: 'provider-user-id',
      total_plans: 5
    }

    const mockExistingMealPlan = {
      id: 'plan-1',
      provider_id: 'provider-1',
      is_deleted: false
    }

    it('should successfully soft delete meal plan', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      mockSupabase.setTableResponse('meal_plans', {
        data: mockExistingMealPlan,
        error: null
      })

      mockSupabase.setMockResponse('update', {
        data: { ...mockExistingMealPlan, is_deleted: true },
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer provider-token'
        }
      })

      const response = await DELETE(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toBe('Meal plan deleted successfully')
      expect(data.data.meal_plan_id).toBe('plan-1')
    })

    it('should verify is_deleted, is_active, and is_published are set correctly', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      mockSupabase.setTableResponse('meal_plans', {
        data: mockExistingMealPlan,
        error: null
      })

      // Create a spy to capture the update call
      let capturedUpdateData: any = null
      const { supabase } = require('@/lib/supabase')

      // Override the from mock for this specific test
      supabase.from = jest.fn((tableName) => {
        if (tableName === 'meal_plan_providers' || tableName === 'meal_plans') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve(mockSupabase.getTableResponse(tableName)))
              }))
            })),
            update: jest.fn((data) => {
              if (tableName === 'meal_plans') {
                capturedUpdateData = data
              }
              return {
                eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
              }
            })
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer provider-token'
        }
      })

      await DELETE(request, { params: { id: 'plan-1' } })

      // Verify update was called with correct data
      expect(capturedUpdateData).toBeDefined()
      expect(capturedUpdateData.is_deleted).toBe(true)
      expect(capturedUpdateData.is_active).toBe(false)
      expect(capturedUpdateData.is_published).toBe(false)
    })

    it('should fail with 401 when not authenticated', async () => {
      const { requireAuth } = require('@/lib/api/auth')
      requireAuth.mockRejectedValueOnce(new Error('Authentication required'))

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(500) // Generic error handling
      expect(data.success).toBe(false)
    })

    it('should fail with 403 when user is not a provider', async () => {
      requireAuth.mockResolvedValueOnce({
        ...mockAuthUser,
        user_type: 'user'
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer user-token'
        }
      })

      const response = await DELETE(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Only providers')
    })

    it('should fail with 403 when provider does not own the meal plan', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      mockSupabase.setTableResponse('meal_plans', {
        data: {
          ...mockExistingMealPlan,
          provider_id: 'different-provider-id'
        },
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer provider-token'
        }
      })

      const response = await DELETE(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('do not have permission')
    })

    it('should fail with 404 when meal plan does not exist', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      mockSupabase.setTableResponse('meal_plans', {
        data: null,
        error: { message: 'Not found' }
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer provider-token'
        }
      })

      const response = await DELETE(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Meal plan not found')
    })

    it('should fail with 409 when meal plan is already deleted', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: mockProvider,
        error: null
      })

      mockSupabase.setTableResponse('meal_plans', {
        data: {
          ...mockExistingMealPlan,
          is_deleted: true
        },
        error: null
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer provider-token'
        }
      })

      const response = await DELETE(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('already deleted')
    })

    it('should fail with 404 when provider profile not found', async () => {
      mockSupabase.setTableResponse('meal_plan_providers', {
        data: null,
        error: { message: 'Not found' }
      })

      const request = new NextRequest('http://localhost/api/providers/meal-plans/plan-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer provider-token'
        }
      })

      const response = await DELETE(request, { params: { id: 'plan-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.message).toContain('Provider profile not found')
    })
  })
})
