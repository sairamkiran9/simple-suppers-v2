/**
 * useCreatorMealPlans Hook
 *
 * Manages fetching and state for creator's meal plans
 * Provides loading, error states, and refetch functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { getCreatorMealPlans } from '@/lib/api/creator'
import type { ApiCreatorMealPlan } from '@/lib/api/creator'

interface UseCreatorMealPlansOptions {
  enabled?: boolean
}

interface UseCreatorMealPlansReturn {
  data: ApiCreatorMealPlan[] | null
  isLoading: boolean
  error: string | null
  isEmpty: boolean
  refetch: () => void
}

/**
 * Hook for fetching and managing creator's meal plans
 *
 * @param options - Configuration options
 * @param options.enabled - Whether to automatically fetch data (default: true)
 * @returns Object containing data, loading state, error, isEmpty flag, and refetch function
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, isEmpty, refetch } = useCreatorMealPlans()
 *
 * if (isLoading) return <div>Loading meal plans...</div>
 * if (error) return <div>Error: {error}</div>
 * if (isEmpty) return <div>No meal plans yet</div>
 * return <div>{data.length} meal plans</div>
 * ```
 */
export function useCreatorMealPlans(
  options: UseCreatorMealPlansOptions = {}
): UseCreatorMealPlansReturn {
  const { enabled = true } = options

  const [data, setData] = useState<ApiCreatorMealPlan[] | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const fetchMealPlans = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await getCreatorMealPlans()
      if (response.success && response.data) {
        setData(response.data.meal_plans)
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
  }, [enabled])

  const refetch = useCallback(() => {
    fetchMealPlans()
  }, [fetchMealPlans])

  useEffect(() => {
    if (enabled) {
      fetchMealPlans()
    }
  }, [enabled, fetchMealPlans])

  const isEmpty = data !== null && data.length === 0

  return {
    data,
    isLoading,
    error,
    isEmpty,
    refetch,
  }
}
