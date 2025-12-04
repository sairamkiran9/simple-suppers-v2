/**
 * Tests for useCreatorMealPlanActions hook
 * Manages creator meal plan update and delete operations
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useCreatorMealPlanActions } from '@/hooks/useCreatorMealPlanActions'
import * as creatorApi from '@/lib/api/creator'
import { toast } from 'sonner'

// Mock the creator API module
jest.mock('@/lib/api/creator')
jest.mock('sonner')

describe('useCreatorMealPlanActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('updateMealPlan', () => {
    it('should update meal plan successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plan: {
            id: 'plan-1',
            title: 'Updated Title',
            description: 'Updated description',
            duration_days: 7,
            final_price: 25.0,
            total_purchases: 10,
            average_rating: 4.5,
          },
        },
      }

      ;(creatorApi.updateMealPlan as jest.Mock).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useCreatorMealPlanActions())

      expect(result.current.isUpdating).toBe(false)

      const updatePromise = result.current.updateMealPlan('plan-1', {
        title: 'Updated Title',
      })

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      await updatePromise

      expect(creatorApi.updateMealPlan).toHaveBeenCalledWith('plan-1', {
        title: 'Updated Title',
      })
      expect(toast.success).toHaveBeenCalledWith('Meal plan updated successfully')
      expect(result.current.error).toBeNull()
    })

    it('should update is_published status', async () => {
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

      ;(creatorApi.updateMealPlan as jest.Mock).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useCreatorMealPlanActions())

      await result.current.updateMealPlan('plan-1', { is_published: true })

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      expect(creatorApi.updateMealPlan).toHaveBeenCalledWith('plan-1', {
        is_published: true,
      })
      expect(toast.success).toHaveBeenCalled()
    })

    it('should update is_active status', async () => {
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

      ;(creatorApi.updateMealPlan as jest.Mock).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useCreatorMealPlanActions())

      await result.current.updateMealPlan('plan-1', { is_active: false })

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      expect(creatorApi.updateMealPlan).toHaveBeenCalledWith('plan-1', {
        is_active: false,
      })
      expect(toast.success).toHaveBeenCalled()
    })

    it('should handle update errors', async () => {
      const mockError = new Error('Failed to update meal plan')
      ;(creatorApi.updateMealPlan as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() => useCreatorMealPlanActions())

      await expect(
        result.current.updateMealPlan('plan-1', { title: 'Updated' })
      ).rejects.toThrow('Failed to update meal plan')

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      expect(result.current.error).toBe('Failed to update meal plan')
      expect(toast.error).toHaveBeenCalledWith('Failed to update meal plan')
    })

    it('should track loading state during update', async () => {
      let resolveUpdate: (value: any) => void
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve
      })

      ;(creatorApi.updateMealPlan as jest.Mock).mockReturnValue(updatePromise)

      const { result } = renderHook(() => useCreatorMealPlanActions())

      const action = result.current.updateMealPlan('plan-1', { title: 'Updated' })

      // Should be loading immediately after calling
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true)
      })

      // Resolve the promise
      resolveUpdate!({
        success: true,
        data: {
          meal_plan: {
            id: 'plan-1',
            title: 'Updated',
            description: 'Test',
            duration_days: 7,
            final_price: 25.0,
            total_purchases: 0,
            average_rating: 0,
          },
        },
      })

      await action

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })
    })
  })

  describe('deleteMealPlan', () => {
    it('should delete meal plan successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Meal plan deleted successfully',
          meal_plan_id: 'plan-1',
        },
      }

      ;(creatorApi.deleteMealPlan as jest.Mock).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useCreatorMealPlanActions())

      expect(result.current.isDeleting).toBe(false)

      const deletePromise = result.current.deleteMealPlan('plan-1')

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false)
      })

      await deletePromise

      expect(creatorApi.deleteMealPlan).toHaveBeenCalledWith('plan-1')
      expect(toast.success).toHaveBeenCalledWith('Meal plan deleted successfully')
      expect(result.current.error).toBeNull()
    })

    it('should handle delete errors', async () => {
      const mockError = new Error('Failed to delete meal plan')
      ;(creatorApi.deleteMealPlan as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() => useCreatorMealPlanActions())

      await expect(result.current.deleteMealPlan('plan-1')).rejects.toThrow(
        'Failed to delete meal plan'
      )

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false)
      })

      expect(result.current.error).toBe('Failed to delete meal plan')
      expect(toast.error).toHaveBeenCalledWith('Failed to delete meal plan')
    })

    it('should track loading state during delete', async () => {
      let resolveDelete: (value: any) => void
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve
      })

      ;(creatorApi.deleteMealPlan as jest.Mock).mockReturnValue(deletePromise)

      const { result } = renderHook(() => useCreatorMealPlanActions())

      const action = result.current.deleteMealPlan('plan-1')

      // Should be loading immediately after calling
      await waitFor(() => {
        expect(result.current.isDeleting).toBe(true)
      })

      // Resolve the promise
      resolveDelete!({
        success: true,
        data: {
          message: 'Meal plan deleted successfully',
          meal_plan_id: 'plan-1',
        },
      })

      await action

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false)
      })
    })

    it('should handle not found errors', async () => {
      const mockError = new Error('Meal plan not found')
      ;(creatorApi.deleteMealPlan as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() => useCreatorMealPlanActions())

      await expect(result.current.deleteMealPlan('nonexistent')).rejects.toThrow(
        'Meal plan not found'
      )

      expect(toast.error).toHaveBeenCalledWith('Meal plan not found')
    })
  })
})
