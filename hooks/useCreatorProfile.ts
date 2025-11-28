/**
 * useCreatorProfile Hook
 *
 * Manages fetching and updating creator profile
 * Provides loading, error states, and update functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { getCreatorProfile, updateCreatorProfile } from '@/lib/api/creator'
import type { ApiCreatorProfile, UpdateCreatorProfileRequest } from '@/lib/api-types'
import { toast } from 'sonner'

interface UseCreatorProfileOptions {
  enabled?: boolean
}

interface UseCreatorProfileReturn {
  data: ApiCreatorProfile | null
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  updateProfile: (data: UpdateCreatorProfileRequest) => Promise<void>
  refetch: () => void
}

/**
 * Hook for fetching and managing creator profile
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

  const [data, setData] = useState<ApiCreatorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await getCreatorProfile()
      if (response.success && response.data) {
        setData(response.data)
      } else if (response.success) {
        throw new Error('No data returned from API')
      } else {
        throw new Error(response.error?.message || 'Failed to fetch profile')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch profile'
      setError(errorMessage)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  const handleUpdateProfile = useCallback(
    async (updateData: UpdateCreatorProfileRequest) => {
      setIsUpdating(true)
      setError(null)

      try {
        const response = await updateCreatorProfile(updateData)
        if (response.success && response.data) {
          setData(response.data.creator)
          toast.success('Profile updated successfully')
        } else if (response.success) {
          throw new Error('Update succeeded but no data returned')
        } else {
          throw new Error(response.error?.message || 'Failed to update profile')
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update profile'
        setError(errorMessage)
        toast.error(errorMessage)
        throw err
      } finally {
        setIsUpdating(false)
      }
    },
    []
  )

  const refetch = useCallback(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (enabled) {
      fetchProfile()
    }
  }, [enabled, fetchProfile])

  return {
    data,
    isLoading,
    isUpdating,
    error,
    updateProfile: handleUpdateProfile,
    refetch,
  }
}
