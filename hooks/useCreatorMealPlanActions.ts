/**
 * useCreatorMealPlanActions Hook
 *
 * Manages update and delete operations for creator meal plans
 * Handles loading states, error handling, and user feedback via toasts
 */

import { useState, useCallback } from 'react'
import { updateMealPlan, deleteMealPlan } from '@/lib/api/creator'
import type { UpdateMealPlanData } from '@/lib/api/creator'
import { toast } from 'sonner'

interface UseCreatorMealPlanActionsReturn {
  updateMealPlan: (id: string, data: UpdateMealPlanData) => Promise<void>
  deleteMealPlan: (id: string) => Promise<void>
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
}

/**
 * Hook for managing creator meal plan update and delete operations
 *
 * @returns Object containing action functions and their states
 *
 * @example
 * ```tsx
 * const { updateMealPlan, deleteMealPlan, isUpdating, isDeleting } = useCreatorMealPlanActions()
 *
 * const handlePublish = async (id: string) => {
 *   await updateMealPlan(id, { is_published: true })
 *   refetch() // Refresh the meal plans list
 * }
 *
 * const handleDelete = async (id: string) => {
 *   if (confirm('Are you sure?')) {
 *     await deleteMealPlan(id)
 *     refetch() // Refresh the meal plans list
 *   }
 * }
 * ```
 */
export function useCreatorMealPlanActions(): UseCreatorMealPlanActionsReturn {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdateMealPlan = useCallback(
    async (id: string, data: UpdateMealPlanData) => {
      setIsUpdating(true)
      setError(null)

      try {
        const response = await updateMealPlan(id, data)
        if (response.success && response.data) {
          toast.success('Meal plan updated successfully')
        } else if (response.success) {
          throw new Error('Update succeeded but no data returned')
        } else {
          throw new Error(response.error?.message || 'Failed to update meal plan')
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update meal plan'
        setError(errorMessage)
        toast.error(errorMessage)
        throw err // Re-throw so calling code can handle it
      } finally {
        setIsUpdating(false)
      }
    },
    []
  )

  const handleDeleteMealPlan = useCallback(async (id: string) => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await deleteMealPlan(id)
      if (response.success && response.data) {
        toast.success('Meal plan deleted successfully')
      } else if (response.success) {
        throw new Error('Delete succeeded but no data returned')
      } else {
        throw new Error(response.error?.message || 'Failed to delete meal plan')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete meal plan'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err // Re-throw so calling code can handle it
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return {
    updateMealPlan: handleUpdateMealPlan,
    deleteMealPlan: handleDeleteMealPlan,
    isUpdating,
    isDeleting,
    error,
  }
}
