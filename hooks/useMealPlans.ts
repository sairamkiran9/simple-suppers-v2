/**
 * useMealPlans Hook - React Query Version
 *
 * Manages fetching and caching meal plans with intelligent client-side caching
 * Uses React Query for automatic request deduplication and background refetching
 */

import { useQuery } from '@tanstack/react-query'
import { getMealPlans, type GetMealPlansParams } from '@/lib/api/meal-plans'
import type { ApiMealPlan } from '@/lib/api-types'

interface UseMealPlansOptions {
  /** Whether to automatically fetch data (default: true) */
  enabled?: boolean
}

interface UseMealPlansReturn {
  /** Meal plans data including array and total count */
  data: { meal_plans: ApiMealPlan[]; total: number } | undefined
  /** Loading state indicator */
  isLoading: boolean
  /** Error object if fetch fails */
  error: Error | null
  /** Function to manually trigger a refetch */
  refetch: () => void
}

/**
 * Hook for fetching and managing meal plans data with React Query caching
 *
 * Benefits over manual state management:
 * - Automatic request deduplication (multiple components requesting same data = 1 API call)
 * - Intelligent caching (5 minutes stale time)
 * - Background refetching to keep data fresh
 * - Automatic retry on failure
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
 * const { data, isLoading } = useMealPlans({
 *   category: 'family',
 *   dietary_tag: 'vegetarian',
 *   sort_by: 'price_asc'
 * })
 *
 * // Disable automatic fetching
 * const { data, refetch } = useMealPlans({}, { enabled: false })
 *
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 * return <div>Found {data?.total} meal plans</div>
 * ```
 */
export function useMealPlans(
  filters?: GetMealPlansParams,
  options: UseMealPlansOptions = {}
): UseMealPlansReturn {
  const { enabled = true } = options

  const { data, isLoading, error, refetch } = useQuery({
    // Unique query key including filters for proper caching
    queryKey: ['meal-plans', filters],

    // Query function that fetches the data
    queryFn: async () => {
      const response = await getMealPlans(filters)

      if (response.success && response.data) {
        return response.data
      } else if (response.success) {
        throw new Error('No data returned from API')
      } else {
        throw new Error(response.error?.message || 'Failed to fetch meal plans')
      }
    },

    // Only fetch if enabled
    enabled,

    // Cache configuration
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes after last use

    // Don't refetch on window focus (better UX)
    refetchOnWindowFocus: false,

    // Retry once on failure
    retry: 1,
  })

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}
