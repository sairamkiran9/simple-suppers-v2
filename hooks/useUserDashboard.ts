/**
 * useUserDashboard Hook - React Query Version
 *
 * Manages fetching and caching user dashboard data
 * Uses React Query for automatic request deduplication and state management
 * User-specific data is always fetched fresh (no stale time)
 */

import { useQuery } from '@tanstack/react-query'
import { getUserDashboard } from '@/lib/api/user'
import type { ApiUserDashboard } from '@/lib/api-types'

interface UseUserDashboardOptions {
  /** Whether to automatically fetch data (default: true) */
  enabled?: boolean
}

interface UseUserDashboardReturn {
  /** User dashboard data */
  data: ApiUserDashboard | null
  /** Loading state indicator */
  isLoading: boolean
  /** Error message if fetch fails */
  error: string | null
  /** Function to manually trigger a refetch */
  refetch: () => void
}

/**
 * Hook for fetching and managing user dashboard data with React Query
 *
 * Benefits over manual state management:
 * - Automatic request deduplication (multiple components = 1 API call)
 * - Always fresh data for user-specific content (staleTime: 0)
 * - Automatic error handling and retry
 * - Background refetching support
 *
 * @param options - Configuration options
 * @param options.enabled - Whether to automatically fetch data (default: true)
 * @returns Object containing data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useUserDashboard()
 *
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error}</div>
 * return <div>Plans: {data.purchased_plans.length}</div>
 * ```
 */
export function useUserDashboard(
  options: UseUserDashboardOptions = {}
): UseUserDashboardReturn {
  const { enabled = true } = options

  const { data, isLoading, error, refetch } = useQuery({
    // Query key for caching - user-specific
    queryKey: ['user-dashboard'],

    // Query function that fetches the data
    queryFn: async () => {
      const response = await getUserDashboard()

      if (response.success && response.data) {
        return response.data
      } else if (response.success) {
        throw new Error('No data returned from API')
      } else {
        throw new Error(response.error?.message || 'Failed to fetch dashboard')
      }
    },

    // Only fetch if enabled
    enabled,

    // Cache configuration - always fetch fresh for user-specific data
    staleTime: 0, // Always consider data stale (matches no-cache API header)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes

    // Don't refetch on window focus (better UX)
    refetchOnWindowFocus: false,

    // Retry once on failure
    retry: 1,
  })

  return {
    data: data ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch dashboard') : null,
    refetch,
  }
}
