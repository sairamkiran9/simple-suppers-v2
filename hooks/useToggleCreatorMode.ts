/**
 * useToggleCreatorMode Hook
 *
 * Manages enabling creator mode for a user
 * Handles loading states, error handling, and user feedback via toasts
 */

import { useState, useCallback } from 'react'
import { enableCreatorMode } from '@/lib/api/creator'
import type { EnableCreatorModeData } from '@/lib/api/creator'
import { toast } from 'sonner'

interface UseToggleCreatorModeReturn {
  enableCreator: (data: EnableCreatorModeData) => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * Hook for enabling creator mode
 *
 * @returns Object containing enable function, loading state, and error
 *
 * @example
 * ```tsx
 * const { enableCreator, isLoading, error } = useToggleCreatorMode()
 *
 * const handleBecomeCreator = async () => {
 *   await enableCreator({
 *     creator_display_name: 'Chef Jamie',
 *     bio: 'Professional chef creating healthy meals',
 *     profile_image_url: 'https://example.com/avatar.jpg'
 *   })
 *   // Redirect to creator dashboard or refresh user data
 * }
 * ```
 */
export function useToggleCreatorMode(): UseToggleCreatorModeReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enableCreator = useCallback(async (data: EnableCreatorModeData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await enableCreatorMode(data)
      if (response.success && response.data) {
        toast.success(response.data.message || 'Creator mode enabled successfully!')
      } else if (response.success) {
        throw new Error('Operation succeeded but no data returned')
      } else {
        throw new Error(response.error?.message || 'Failed to enable creator mode')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to enable creator mode'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    enableCreator,
    isLoading,
    error,
  }
}
