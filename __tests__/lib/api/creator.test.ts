/**
 * Tests for lib/api/creator.ts
 * API functions for creator-related operations
 */

import { apiClient } from '@/lib/api-client'
import {
  getCreatorDashboard,
  getCreatorMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  updateCreatorProfile,
  getCreatorProfile,
} from '@/lib/api/creator'

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

describe('lib/api/creator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCreatorDashboard', () => {
    it('should call apiClient.get with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          creator: {
            id: 'user-1',
            is_creator: true,
            creator_display_name: 'Test Creator',
            creator_bio: 'Test bio',
            creator_profile_image_url: null,
            creator_email_verified: true,
            is_active: true,
            total_earnings: 500,
            total_meal_plans_created: 5,
            creator_rating: 4.5,
          },
          analytics: {
            total_meal_plans: 5,
            published_plans: 3,
            draft_plans: 2,
            total_views: 100,
            total_sales: 20,
            current_month_earnings: 150,
            all_time_earnings: 500,
          },
          recent_purchases: [],
          top_performing_plans: [],
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getCreatorDashboard()

      expect(apiClient.get).toHaveBeenCalledWith('/creators/dashboard')
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Network error')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getCreatorDashboard()).rejects.toThrow('Network error')
    })
  })

  describe('getCreatorMealPlans', () => {
    it('should call apiClient.get with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [
            {
              id: 'plan-1',
              title: 'Test Plan',
              description: 'Test description',
              duration_days: 7,
              final_price: 25.0,
              total_purchases: 10,
              average_rating: 4.5,
            },
          ],
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getCreatorMealPlans()

      expect(apiClient.get).toHaveBeenCalledWith('/creators/meal-plans')
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to fetch meal plans')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getCreatorMealPlans()).rejects.toThrow('Failed to fetch meal plans')
    })
  })

  describe('createMealPlan', () => {
    it('should call apiClient.post with correct endpoint and data', async () => {
      const createData = {
        title: 'New Meal Plan',
        description: 'A new meal plan',
        duration_days: 7,
        category: 'family',
        difficulty_level: 'beginner' as const,
      }

      const mockResponse = {
        success: true,
        data: {
          meal_plan: {
            id: 'plan-new',
            title: 'New Meal Plan',
            description: 'A new meal plan',
            duration_days: 7,
            final_price: 25.0,
            category: 'family',
            difficulty_level: 'beginner',
            total_purchases: 0,
            average_rating: 0,
          },
        },
      }

      ;(apiClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createMealPlan(createData)

      expect(apiClient.post).toHaveBeenCalledWith('/creators/meal-plans', createData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateMealPlan', () => {
    it('should call apiClient.patch with correct endpoint and data', async () => {
      const updateData = {
        title: 'Updated Title',
      }

      const mockResponse = {
        success: true,
        data: {
          meal_plan: {
            id: 'plan-1',
            title: 'Updated Title',
            description: 'Original description',
            duration_days: 7,
            final_price: 25.0,
            total_purchases: 10,
            average_rating: 4.5,
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMealPlan('plan-1', updateData)

      expect(apiClient.patch).toHaveBeenCalledWith('/creators/meal-plans/plan-1', updateData)
      expect(result.success).toBe(true)
    })
  })

  describe('deleteMealPlan', () => {
    it('should call apiClient.delete with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Meal plan deleted successfully',
          meal_plan_id: 'plan-1',
        },
      }

      ;(apiClient.delete as jest.Mock).mockResolvedValue(mockResponse)

      const result = await deleteMealPlan('plan-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/creators/meal-plans/plan-1')
      expect(result.success).toBe(true)
    })
  })

  describe('updateCreatorProfile', () => {
    it('should call apiClient.patch with correct endpoint and data', async () => {
      const updateData = {
        creator_display_name: 'Updated Creator Name',
      }

      const mockResponse = {
        success: true,
        data: {
          creator: {
            id: 'user-1',
            is_creator: true,
            creator_display_name: 'Updated Creator Name',
            creator_bio: null,
            creator_profile_image_url: null,
            creator_email_verified: true,
            is_active: true,
            total_earnings: 500,
            total_meal_plans_created: 5,
            creator_rating: 4.5,
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateCreatorProfile(updateData)

      expect(apiClient.patch).toHaveBeenCalledWith('/creators/profile', updateData)
      expect(result.success).toBe(true)
    })
  })

  describe('getCreatorProfile', () => {
    it('should call apiClient.get with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'user-1',
          is_creator: true,
          creator_display_name: 'Test Creator',
          creator_bio: 'Test bio',
          creator_profile_image_url: null,
          creator_email_verified: true,
          is_active: true,
          total_earnings: 500,
          total_meal_plans_created: 5,
          creator_rating: 4.5,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getCreatorProfile()

      expect(apiClient.get).toHaveBeenCalledWith('/creators/profile')
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to fetch profile')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getCreatorProfile()).rejects.toThrow('Failed to fetch profile')
    })
  })
})
