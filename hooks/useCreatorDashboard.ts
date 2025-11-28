/**
 * useCreatorDashboard Hook
 *
 * Manages fetching and state for creator dashboard data
 * Provides loading, error states, and refetch functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { getCreatorDashboard } from '@/lib/api/creator'
import type { ApiCreatorDashboard } from '@/lib/api-types'

interface UseCreatorDashboardOptions {
  enabled?: boolean
}

interface UseCreatorDashboardReturn {
  data: ApiCreatorDashboard | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook for fetching and managing creator dashboard data
 *
 * @param options - Configuration options
 * @param options.enabled - Whether to automatically fetch data (default: true)
 * @returns Object containing data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useCreatorDashboard()
 *
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error}</div>
 * return <div>Creator: {data.creator.creator_display_name}</div>
 * ```
 */
export function useCreatorDashboard(
  options: UseCreatorDashboardOptions = {}
): UseCreatorDashboardReturn {
  const { enabled = true } = options

  const [data, setData] = useState<ApiCreatorDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await getCreatorDashboard()
      if (response.success && response.data) {
        setData(response.data)
      } else if (response.success) {
        throw new Error('No data returned from API')
      } else {
        throw new Error(response.error?.message || 'Failed to fetch dashboard')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch dashboard'
      setError(errorMessage)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  const refetch = useCallback(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    if (enabled) {
      fetchDashboard()
    }
  }, [enabled, fetchDashboard])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}
