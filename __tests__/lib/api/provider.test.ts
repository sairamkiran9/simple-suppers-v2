/**
 * Tests for lib/api/provider.ts
 * API functions for provider-related operations
 */

import { apiClient } from '@/lib/api-client'
import {
  getProviderDashboard,
  getProviderMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  updateProviderProfile,
  getProviderProfile,
} from '@/lib/api/provider'
import type { ApiProviderDashboard, ApiProviderProfile } from '@/lib/api-types'

// Mock the apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

describe('lib/api/provider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getProviderDashboard', () => {
    it('should call apiClient.get with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          provider: {
            id: 'provider-1',
            business_name: 'Test Provider',
            bio: 'Test bio',
            profile_image_url: null,
            email_verified: true,
            is_active: true,
            total_earnings: 500,
            total_plans: 5,
            average_rating: 4.5,
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

      const result = await getProviderDashboard()

      expect(apiClient.get).toHaveBeenCalledWith('/providers/dashboard')
      expect(result).toEqual(mockResponse)
    })

    it('should return dashboard data with analytics', async () => {
      const mockResponse = {
        success: true,
        data: {
          provider: {
            id: 'provider-1',
            business_name: 'Healthy Meals Co',
            bio: null,
            profile_image_url: null,
            email_verified: true,
            is_active: true,
            total_earnings: 1000,
            total_plans: 10,
            average_rating: 4.8,
          },
          analytics: {
            total_meal_plans: 10,
            published_plans: 8,
            draft_plans: 2,
            total_views: 500,
            total_sales: 50,
            current_month_earnings: 300,
            all_time_earnings: 1000,
          },
          recent_purchases: [],
          top_performing_plans: [],
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getProviderDashboard()

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.provider.business_name).toBe('Healthy Meals Co')
        expect(result.data.analytics.published_plans).toBe(8)
      }
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Network error')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getProviderDashboard()).rejects.toThrow('Network error')
    })
  })

  describe('getProviderMealPlans', () => {
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

      const result = await getProviderMealPlans()

      expect(apiClient.get).toHaveBeenCalledWith('/providers/meal-plans')
      expect(result).toEqual(mockResponse)
    })

    it('should return empty array when no meal plans exist', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getProviderMealPlans()

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.meal_plans).toHaveLength(0)
      }
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to fetch meal plans')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getProviderMealPlans()).rejects.toThrow('Failed to fetch meal plans')
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

      expect(apiClient.post).toHaveBeenCalledWith('/providers/meal-plans', createData)
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.meal_plan.title).toBe('New Meal Plan')
      }
    })

    it('should handle validation errors', async () => {
      const createData = {
        title: '',
        description: 'A new meal plan',
        duration_days: 7,
      }

      const mockError = new Error('title: String must contain at least 1 character(s)')
      ;(apiClient.post as jest.Mock).mockRejectedValue(mockError)

      await expect(createMealPlan(createData)).rejects.toThrow('title')
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

      expect(apiClient.patch).toHaveBeenCalledWith('/providers/meal-plans/plan-1', updateData)
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.meal_plan.title).toBe('Updated Title')
      }
    })

    it('should update is_published status', async () => {
      const updateData = {
        is_published: true,
      }

      const mockResponse = {
        success: true,
        data: {
          meal_plan: {
            id: 'plan-1',
            title: 'Test Plan',
            description: 'Test description',
            duration_days: 7,
            final_price: 25.0,
            is_published: true,
            total_purchases: 0,
            average_rating: 0,
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMealPlan('plan-1', updateData)

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.meal_plan.is_published).toBe(true)
      }
    })

    it('should update is_active status', async () => {
      const updateData = {
        is_active: false,
      }

      const mockResponse = {
        success: true,
        data: {
          meal_plan: {
            id: 'plan-1',
            title: 'Test Plan',
            description: 'Test description',
            duration_days: 7,
            final_price: 25.0,
            is_active: false,
            total_purchases: 0,
            average_rating: 0,
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMealPlan('plan-1', updateData)

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.meal_plan.is_active).toBe(false)
      }
    })

    it('should handle not found errors', async () => {
      const updateData = {
        title: 'Updated Title',
      }

      const mockError = new Error('Meal plan not found')
      ;(apiClient.patch as jest.Mock).mockRejectedValue(mockError)

      await expect(updateMealPlan('nonexistent', updateData)).rejects.toThrow(
        'Meal plan not found'
      )
    })

    it('should handle validation errors', async () => {
      const updateData = {
        title: '',
      }

      const mockError = new Error('title: String must contain at least 1 character(s)')
      ;(apiClient.patch as jest.Mock).mockRejectedValue(mockError)

      await expect(updateMealPlan('plan-1', updateData)).rejects.toThrow('title')
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

      expect(apiClient.delete).toHaveBeenCalledWith('/providers/meal-plans/plan-1')
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.message).toBe('Meal plan deleted successfully')
      }
    })

    it('should handle not found errors', async () => {
      const mockError = new Error('Meal plan not found')
      ;(apiClient.delete as jest.Mock).mockRejectedValue(mockError)

      await expect(deleteMealPlan('nonexistent')).rejects.toThrow('Meal plan not found')
    })
  })

  describe('updateProviderProfile', () => {
    it('should call apiClient.patch with correct endpoint and data', async () => {
      const updateData = {
        business_name: 'Updated Business Name',
      }

      const mockResponse = {
        success: true,
        data: {
          provider: {
            id: 'provider-1',
            user_id: 'user-1',
            business_name: 'Updated Business Name',
            bio: null,
            profile_image_url: null,
            email_verified: true,
            is_active: true,
            total_earnings: 500,
            total_plans: 5,
            average_rating: 4.5,
            created_at: '2024-01-01T00:00:00Z',
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateProviderProfile(updateData)

      expect(apiClient.patch).toHaveBeenCalledWith('/providers/profile', updateData)
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.provider.business_name).toBe('Updated Business Name')
      }
    })

    it('should update bio', async () => {
      const updateData = {
        bio: 'We create healthy, family-friendly meals',
      }

      const mockResponse = {
        success: true,
        data: {
          provider: {
            id: 'provider-1',
            user_id: 'user-1',
            business_name: 'Test Provider',
            bio: 'We create healthy, family-friendly meals',
            profile_image_url: null,
            email_verified: true,
            is_active: true,
            total_earnings: 500,
            total_plans: 5,
            average_rating: 4.5,
            created_at: '2024-01-01T00:00:00Z',
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateProviderProfile(updateData)

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.provider.bio).toBe('We create healthy, family-friendly meals')
      }
    })

    it('should handle validation errors', async () => {
      const updateData = {
        business_name: '',
      }

      const mockError = new Error('business_name: String must contain at least 1 character(s)')
      ;(apiClient.patch as jest.Mock).mockRejectedValue(mockError)

      await expect(updateProviderProfile(updateData)).rejects.toThrow('business_name')
    })
  })

  describe('getProviderProfile', () => {
    it('should call apiClient.get with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'provider-1',
          user_id: 'user-1',
          business_name: 'Test Provider',
          bio: 'Test bio',
          profile_image_url: null,
          email_verified: true,
          is_active: true,
          total_earnings: 500,
          total_plans: 5,
          average_rating: 4.5,
          created_at: '2024-01-01T00:00:00Z',
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getProviderProfile()

      expect(apiClient.get).toHaveBeenCalledWith('/providers/profile')
      expect(result).toEqual(mockResponse)
    })

    it('should return provider profile data', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'provider-1',
          user_id: 'user-1',
          business_name: 'Healthy Meals Co',
          bio: 'We create nutritious meals',
          profile_image_url: 'https://example.com/image.jpg',
          email_verified: true,
          is_active: true,
          total_earnings: 1000,
          total_plans: 10,
          average_rating: 4.8,
          created_at: '2024-01-01T00:00:00Z',
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getProviderProfile()

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.business_name).toBe('Healthy Meals Co')
        expect(result.data.total_earnings).toBe(1000)
      }
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to fetch profile')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getProviderProfile()).rejects.toThrow('Failed to fetch profile')
    })
  })
})
