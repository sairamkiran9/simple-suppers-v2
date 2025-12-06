/**
 * useCreatorProfile Hook - React Query Version
 *
 * Manages fetching and updating creator profile
 * Uses React Query for data fetching and manual state for updates
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCreatorProfile, updateCreatorProfile } from '@/lib/api/creator'
import type { ApiCreatorProfile, UpdateCreatorProfileRequest } from '@/lib/api-types'
import { toast } from 'sonner'

interface UseCreatorProfileOptions {
  /** Whether to automatically fetch data (default: true) */
  enabled?: boolean
}

interface UseCreatorProfileReturn {
  /** Creator profile data */
  data: ApiCreatorProfile | null
  /** Loading state for initial fetch */
  isLoading: boolean
  /** Loading state for profile updates */
  isUpdating: boolean
  /** Error message if fetch/update fails */
  error: string | null
  /** Function to update the creator profile */
  updateProfile: (data: UpdateCreatorProfileRequest) => Promise<void>
  /** Function to manually trigger a refetch */
  refetch: () => void
}

/**
 * Hook for fetching and managing creator profile with React Query
 *
 * Benefits over manual state management:
 * - Automatic request deduplication for fetching
 * - Intelligent caching (2 minutes stale time)
 * - Automatic error handling and retry
 * - Background refetching support
 *
 * @param options - Configuration options
 * @param options.enabled - Whether to automatically fetch data (default: true)
 * @returns Object containing data, loading states, error, update function, and refetch
 *
 * @example
 * ```tsx
 * const { data, isLoading, updateProfile, isUpdating } = useCreatorProfile()
 *
 * const handleUpdate = async () => {
 *   await updateProfile({
 *     creator_display_name: 'New Name',
 *     bio: 'Updated bio'
 *   })
 * }
 *
 * if (isLoading) return <div>Loading...</div>
 * return <div>{data?.creator_display_name}</div>
 * ```
 */
export function useCreatorProfile(
  options: UseCreatorProfileOptions = {}
): UseCreatorProfileReturn {
  const { enabled = true } = options

  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const { data, isLoading, error: fetchError, refetch } = useQuery({
    // Query key for caching - creator profile
    queryKey: ['creator-profile'],

    // Query function that fetches the data
    queryFn: async () => {
      const response = await getCreatorProfile()

      if (response.success && response.data) {
        return response.data
      } else if (response.success) {
        throw new Error('No data returned from API')
      } else {
        throw new Error(response.error?.message || 'Failed to fetch profile')
      }
    },

    // Only fetch if enabled
    enabled,

    // Cache configuration - 2 minutes for creator profile
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes

    // Don't refetch on window focus (better UX)
    refetchOnWindowFocus: false,

    // Retry once on failure
    retry: 1,
  })

  const handleUpdateProfile = useCallback(
    async (updateData: UpdateCreatorProfileRequest) => {
      setIsUpdating(true)
      setUpdateError(null)

      try {
        const response = await updateCreatorProfile(updateData)
        if (response.success && response.data) {
          toast.success('Profile updated successfully')
          // Refetch to update cache with new data
          await refetch()
        } else if (response.success) {
          throw new Error('Update succeeded but no data returned')
        } else {
          throw new Error(response.error?.message || 'Failed to update profile')
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update profile'
        setUpdateError(errorMessage)
        toast.error(errorMessage)
        throw err
      } finally {
        setIsUpdating(false)
      }
    },
    [refetch]
  )

  // Combine fetch and update errors
  const error = fetchError
    ? (fetchError instanceof Error ? fetchError.message : 'Failed to fetch profile')
    : updateError

  return {
    data: data ?? null,
    isLoading,
    isUpdating,
    error,
    updateProfile: handleUpdateProfile,
    refetch,
  }
}
