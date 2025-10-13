/**
 * useMealPlanDetail Hook
 *
 * Manages fetching and state for a specific meal plan's detailed information
 * Provides loading, error states, and refetch functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { getMealPlanDetail } from '@/lib/api/meal-plans'
import type { ApiMealPlanDetail } from '@/lib/api-types'
import { useAuth } from '@/lib/auth-context'

interface UseMealPlanDetailOptions {
  /** Whether to automatically fetch data (default: true) */
  enabled?: boolean
}

interface UseMealPlanDetailReturn {
  /** Detailed meal plan data */
  data: ApiMealPlanDetail | null
  /** Loading state indicator */
  isLoading: boolean
  /** Error message if fetch fails */
  error: string | null
  /** Function to manually trigger a refetch */
  refetch: () => void
}

/**
 * Hook for fetching and managing detailed meal plan data by ID
 *
 * @param id - The unique identifier of the meal plan
 * @param options - Configuration options
 * @param options.enabled - Whether to automatically fetch data (default: true)
 * @returns Object containing data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Fetch meal plan detail
 * const { data, isLoading, error, refetch } = useMealPlanDetail('plan-123')
 *
 * // Disable automatic fetching
 * const { data, refetch } = useMealPlanDetail('plan-123', { enabled: false })
 *
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error}</div>
 * return (
 *   <div>
 *     <h1>{data?.title}</h1>
 *     <p>By {data?.provider.name}</p>
 *     <p>{data?.meal_plan_days.length} days</p>
 *   </div>
 * )
 * ```
 */
export function useMealPlanDetail(
  id: string,
  options: UseMealPlanDetailOptions = {}
): UseMealPlanDetailReturn {
  const { enabled = true } = options
  const { isAuthenticated } = useAuth()

  const [data, setData] = useState<ApiMealPlanDetail | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const fetchMealPlanDetail = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await getMealPlanDetail(id)
      if (response.success && response.data) {
        setData(response.data)
      } else if (response.success) {
        throw new Error('No data returned from API')
      } else {
        throw new Error(response.error?.message || 'Failed to fetch meal plan detail')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch meal plan detail'
      setError(errorMessage)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [enabled, id, isAuthenticated])

  const refetch = useCallback(() => {
    fetchMealPlanDetail()
  }, [fetchMealPlanDetail])

  useEffect(() => {
    if (enabled) {
      fetchMealPlanDetail()
    }
  }, [enabled, fetchMealPlanDetail])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}
