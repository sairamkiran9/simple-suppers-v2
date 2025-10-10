/**
 * Tests for lib/api/meal-plans.ts
 * API functions for meal plan operations
 */

import { apiClient } from '@/lib/api-client'
import { getMealPlans, getMealPlanDetail } from '@/lib/api/meal-plans'
import type { ApiMealPlan, ApiMealPlanDetail } from '@/lib/api-types'

// Mock the apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

describe('lib/api/meal-plans', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMealPlans', () => {
    it('should fetch all meal plans without filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [
            {
              id: 'plan-1',
              title: 'Weekly Meal Plan',
              description: 'A complete weekly meal plan',
              duration_days: 7,
              duration_type: 'weekly',
              final_price: 25.0,
              category: 'family',
              dietary_tags: ['vegetarian'],
              difficulty_level: 'easy',
              is_free: false,
              is_featured: true,
              average_rating: 4.5,
              total_purchases: 150,
              provider: {
                id: 'provider-1',
                name: 'Test Provider',
                business_name: 'Test Business',
              },
            },
          ],
          total: 1,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMealPlans()

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', undefined)
      expect(result).toEqual(mockResponse)
    })

    it('should fetch meal plans with category filter', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMealPlans({ category: 'family' })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        category: 'family',
      })
      expect(result.success).toBe(true)
    })

    it('should fetch meal plans with dietary tag filter', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ dietary_tag: 'vegetarian' })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        dietary_tag: 'vegetarian',
      })
    })

    it('should fetch meal plans with search query', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ search: 'pasta' })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        search: 'pasta',
      })
    })

    it('should fetch meal plans with price range', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ min_price: 10, max_price: 30 })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        min_price: 10,
        max_price: 30,
      })
    })

    it('should fetch free plans only', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ is_free: true })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        is_free: true,
      })
    })

    it('should fetch featured plans only', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ is_featured: true })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        is_featured: true,
      })
    })

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 50,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ page: 2, limit: 10 })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        page: 2,
        limit: 10,
      })
    })

    it('should handle sorting parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ sort_by: 'price_asc' })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        sort_by: 'price_asc',
      })
    })

    it('should handle multiple filters combined', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({
        category: 'family',
        dietary_tag: 'vegetarian',
        search: 'pasta',
        min_price: 10,
        max_price: 30,
        is_featured: true,
        sort_by: 'rating',
        page: 1,
        limit: 20,
      })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        category: 'family',
        dietary_tag: 'vegetarian',
        search: 'pasta',
        min_price: 10,
        max_price: 30,
        is_featured: true,
        sort_by: 'rating',
        page: 1,
        limit: 20,
      })
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Network error')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getMealPlans()).rejects.toThrow('Network error')
    })
  })

  describe('getMealPlanDetail', () => {
    it('should fetch meal plan detail by ID', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'plan-1',
          title: 'Weekly Meal Plan',
          description: 'A complete weekly meal plan',
          duration_days: 7,
          duration_type: 'weekly',
          final_price: 25.0,
          category: 'family',
          dietary_tags: ['vegetarian'],
          difficulty_level: 'easy',
          is_free: false,
          is_featured: true,
          average_rating: 4.5,
          total_purchases: 150,
          provider: {
            id: 'provider-1',
            name: 'Test Provider',
            business_name: 'Test Business',
            rating: 4.8,
          },
          preview_meals: ['Spaghetti Bolognese', 'Chicken Stir-Fry'],
          recipes: [
            {
              day: 1,
              meal_type: 'dinner',
              name: 'Spaghetti Bolognese',
              ingredients: ['pasta', 'tomato sauce', 'ground beef'],
              instructions: 'Cook pasta. Make sauce. Combine.',
            },
          ],
          shopping_list: {
            produce: ['tomatoes', 'onions'],
            protein: ['ground beef'],
            pantry: ['pasta'],
          },
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMealPlanDetail('plan-1')

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans/plan-1')
      expect(result).toEqual(mockResponse)
    })

    it('should handle 404 for non-existent plan', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Meal plan not found',
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMealPlanDetail('non-existent-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error?.code).toBe('NOT_FOUND')
      }
    })

    it('should handle network errors', async () => {
      const mockError = new Error('Network error')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getMealPlanDetail('plan-1')).rejects.toThrow('Network error')
    })
  })
})
