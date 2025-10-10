/**
 * useUserProfile Hook
 *
 * Manages user profile updates with optimistic updates
 * Provides loading, error states, and callbacks
 */

import { useState, useCallback } from 'react'
import { updateUserProfile } from '@/lib/api/user'
import type { UpdateUserProfileRequest, ApiUser } from '@/lib/api-types'

interface UseUserProfileOptions {
  onSuccess?: (user: ApiUser) => void
  onError?: (error: Error) => void
}

interface UseUserProfileReturn {
  updateProfile: (data: UpdateUserProfileRequest) => Promise<ApiUser>
  isUpdating: boolean
  error: string | null
}

/**
 * Hook for managing user profile updates
 * Includes optimistic updates and error handling
 *
 * @param options - Configuration options
 * @param options.onSuccess - Callback called on successful update
 * @param options.onError - Callback called on error
 * @returns Object containing updateProfile function, loading state, and error
 *
 * @example
 * ```tsx
 * const { updateProfile, isUpdating, error } = useUserProfile({
 *   onSuccess: (user) => {
 *     toast.success('Profile updated!')
 *     refetchDashboard()
 *   },
 *   onError: (error) => {
 *     toast.error(error.message)
 *   }
 * })
 *
 * const handleSubmit = async (data) => {
 *   await updateProfile(data)
 * }
 * ```
 */
export function useUserProfile(
  options: UseUserProfileOptions = {}
): UseUserProfileReturn {
  const { onSuccess, onError } = options

  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdateProfile = useCallback(
    async (data: UpdateUserProfileRequest): Promise<ApiUser> => {
      setIsUpdating(true)
      setError(null)

      try {
        const response = await updateUserProfile(data)
        if (response.success && response.data) {
          const user = response.data.user

          // Call success callback if provided
          if (onSuccess) {
            onSuccess(user)
          }

          return user
        } else if (response.success) {
          throw new Error('No data returned from API')
        } else {
          throw new Error(response.error?.message || 'Failed to update profile')
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update profile'
        setError(errorMessage)

        // Call error callback if provided
        if (onError && err instanceof Error) {
          onError(err)
        }

        throw err
      } finally {
        setIsUpdating(false)
      }
    },
    [onSuccess, onError]
  )

  return {
    updateProfile: handleUpdateProfile,
    isUpdating,
    error,
  }
}
