/**
 * useMealPlans Hook
 *
 * Manages fetching and state for meal plans with optional filtering
 * Provides loading, error states, and refetch functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { getMealPlans, type GetMealPlansParams } from '@/lib/api/meal-plans'
import type { ApiMealPlan } from '@/lib/api-types'

interface UseMealPlansOptions {
  /** Whether to automatically fetch data (default: true) */
  enabled?: boolean
}

interface UseMealPlansReturn {
  /** Meal plans data including array and total count */
  data: { meal_plans: ApiMealPlan[]; total: number } | null
  /** Loading state indicator */
  isLoading: boolean
  /** Error message if fetch fails */
  error: string | null
  /** Function to manually trigger a refetch */
  refetch: () => void
}

/**
 * Hook for fetching and managing meal plans data with optional filters
 *
 * @param filters - Optional query parameters for filtering meal plans
 * @param options - Configuration options
 * @param options.enabled - Whether to automatically fetch data (default: true)
 * @returns Object containing data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Fetch all meal plans
 * const { data, isLoading, error, refetch } = useMealPlans()
 *
 * // Fetch with filters
 * const { data, isLoading, error } = useMealPlans({
 *   category: 'family',
 *   dietary_tag: 'vegetarian',
 *   sort_by: 'price_asc'
 * })
 *
 * // Disable automatic fetching
 * const { data, refetch } = useMealPlans({}, { enabled: false })
 *
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error}</div>
 * return <div>Found {data?.total} meal plans</div>
 * ```
 */
export function useMealPlans(
  filters?: GetMealPlansParams,
  options: UseMealPlansOptions = {}
): UseMealPlansReturn {
  const { enabled = true } = options

  const [data, setData] = useState<{ meal_plans: ApiMealPlan[]; total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const fetchMealPlans = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await getMealPlans(filters)
      if (response.success && response.data) {
        setData(response.data)
      } else if (response.success) {
        throw new Error('No data returned from API')
      } else {
        throw new Error(response.error?.message || 'Failed to fetch meal plans')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch meal plans'
      setError(errorMessage)
      setData(null)
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(filters)])

  const refetch = useCallback(() => {
    fetchMealPlans()
  }, [fetchMealPlans])

  useEffect(() => {
    if (enabled) {
      fetchMealPlans()
    }
  }, [enabled, fetchMealPlans])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}
