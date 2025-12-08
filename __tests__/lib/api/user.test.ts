/**
 * Tests for lib/api/user.ts
 * API functions for user-related operations
 */

import { apiClient } from '@/lib/api-client'
import { getUserDashboard, updateUserProfile } from '@/lib/api/user'
import type { ApiUserDashboard, UpdateUserProfileRequest } from '@/lib/api-types'

// Mock the apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}))

describe('lib/api/user', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserDashboard', () => {
    it('should call apiClient.get with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
            subscription_tier: 'freemium',
            free_plans_used: 1,
          },
          purchased_plans: [],
          free_plans: [],
          total_spent: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getUserDashboard()

      expect(apiClient.get).toHaveBeenCalledWith('/user/dashboard')
      expect(result).toEqual(mockResponse)
    })

    it('should return dashboard data with purchased plans', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
            subscription_tier: 'freemium',
            free_plans_used: 0,
          },
          purchased_plans: [
            {
              id: 'plan-1',
              title: 'Weekly Meal Plan',
              provider_name: 'Test Provider',
              purchase_date: '2024-01-01T00:00:00Z',
              purchase_price: 25.0,
            },
          ],
          free_plans: [],
          total_spent: 25.0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getUserDashboard()

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.purchased_plans).toHaveLength(1)
        expect(result.data.total_spent).toBe(25.0)
      }
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Network error')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getUserDashboard()).rejects.toThrow('Network error')
    })
  })

  describe('updateUserProfile', () => {
    it('should call apiClient.patch with correct endpoint and data', async () => {
      const updateData: UpdateUserProfileRequest = {
        name: 'Updated Name',
      }

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            name: 'Updated Name',
            email: 'test@example.com',
            dietary_preferences: [],
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateUserProfile(updateData)

      expect(apiClient.patch).toHaveBeenCalledWith('/user/profile', updateData)
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.user.name).toBe('Updated Name')
      }
    })

    it('should update dietary preferences', async () => {
      const updateData: UpdateUserProfileRequest = {
        dietary_preferences: ['vegetarian', 'gluten-free'],
      }

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            dietary_preferences: ['vegetarian', 'gluten-free'],
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateUserProfile(updateData)

      expect(apiClient.patch).toHaveBeenCalledWith('/user/profile', updateData)
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.user.dietary_preferences).toEqual([
          'vegetarian',
          'gluten-free',
        ])
      }
    })

    it('should update both name and dietary preferences', async () => {
      const updateData: UpdateUserProfileRequest = {
        name: 'Jane Doe',
        dietary_preferences: ['vegan'],
      }

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            name: 'Jane Doe',
            email: 'test@example.com',
            dietary_preferences: ['vegan'],
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateUserProfile(updateData)

      expect(apiClient.patch).toHaveBeenCalledWith('/user/profile', updateData)
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.user.name).toBe('Jane Doe')
        expect(result.data.user.dietary_preferences).toEqual(['vegan'])
      }
    })

    it('should handle validation errors', async () => {
      const updateData: UpdateUserProfileRequest = {
        name: '',
      }

      const mockError = new Error('name: String must contain at least 1 character(s)')
      ;(apiClient.patch as jest.Mock).mockRejectedValue(mockError)

      await expect(updateUserProfile(updateData)).rejects.toThrow('name')
    })

    it('should handle API errors', async () => {
      const updateData: UpdateUserProfileRequest = {
        name: 'Test',
      }

      const mockError = new Error('Failed to update profile')
      ;(apiClient.patch as jest.Mock).mockRejectedValue(mockError)

      await expect(updateUserProfile(updateData)).rejects.toThrow(
        'Failed to update profile'
      )
    })
  })
})
