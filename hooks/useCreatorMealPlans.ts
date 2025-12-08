/**
 * useCreatorMealPlans Hook - React Query Version
 *
 * Manages fetching and caching creator's meal plans
 * Uses React Query for automatic request deduplication and state management
 */

import { useQuery } from '@tanstack/react-query'
import { getCreatorMealPlans } from '@/lib/api/creator'
import type { ApiCreatorMealPlan } from '@/lib/api/creator'

interface UseCreatorMealPlansOptions {
  /** Whether to automatically fetch data (default: true) */
  enabled?: boolean
}

interface UseCreatorMealPlansReturn {
  /** Array of creator's meal plans */
  data: ApiCreatorMealPlan[] | null
  /** Loading state indicator */
  isLoading: boolean
  /** Error message if fetch fails */
  error: string | null
  /** Whether the meal plans list is empty */
  isEmpty: boolean
  /** Function to manually trigger a refetch */
  refetch: () => void
}

/**
 * Hook for fetching and managing creator's meal plans with React Query
 *
 * Benefits over manual state management:
 * - Automatic request deduplication (multiple components = 1 API call)
 * - Intelligent caching (2 minutes stale time for creator content)
 * - Automatic error handling and retry
 * - Background refetching support
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

  const { data, isLoading, error, refetch } = useQuery({
    // Query key for caching - creator meal plans
    queryKey: ['creator-meal-plans'],

    // Query function that fetches the data
    queryFn: async () => {
      const response = await getCreatorMealPlans()

      if (response.success && response.data) {
        return response.data.meal_plans
      } else if (response.success) {
        throw new Error('No data returned from API')
      } else {
        throw new Error(response.error?.message || 'Failed to fetch meal plans')
      }
    },

    // Only fetch if enabled
    enabled,

    // Cache configuration - shorter stale time for creator content that changes frequently
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes

    // Don't refetch on window focus (better UX)
    refetchOnWindowFocus: false,

    // Retry once on failure
    retry: 1,
  })

  const isEmpty = data !== null && data !== undefined && data.length === 0

  return {
    data: data ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch meal plans') : null,
    isEmpty,
    refetch,
  }
}
