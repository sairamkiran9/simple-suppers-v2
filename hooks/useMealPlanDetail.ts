/**
 * useMealPlanDetail Hook - React Query Version
 *
 * Manages fetching and caching detailed meal plan data
 * Uses React Query for automatic caching and request deduplication
 */

import { useQuery } from '@tanstack/react-query'
import { getMealPlanDetail } from '@/lib/api/meal-plans'
import type { ApiMealPlanDetail } from '@/lib/api-types'

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
 * Hook for fetching and managing detailed meal plan data by ID with React Query
 *
 * Benefits over manual state management:
 * - Automatic caching per meal plan ID
 * - Request deduplication (multiple components requesting same plan = 1 API call)
 * - 10 minute cache for meal plan details (matches API cache header)
 * - Automatic error handling and retry
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

  const { data, isLoading, error, refetch } = useQuery({
    // Query key includes ID for per-plan caching
    queryKey: ['meal-plan-detail', id],

    // Query function that fetches the data
    queryFn: async () => {
      const response = await getMealPlanDetail(id)

      if (response.success && response.data) {
        return response.data
      } else if (response.success) {
        throw new Error('No data returned from API')
      } else {
        throw new Error(response.error?.message || 'Failed to fetch meal plan detail')
      }
    },

    // Only fetch if enabled and ID is provided
    enabled: enabled && !!id,

    // Cache configuration - 10 minutes to match API cache header
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes

    // Don't refetch on window focus (better UX)
    refetchOnWindowFocus: false,

    // Retry once on failure
    retry: 1,
  })

  return {
    data: data ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch meal plan detail') : null,
    refetch,
  }
}
