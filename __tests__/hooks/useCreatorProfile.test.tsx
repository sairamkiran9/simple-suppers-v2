import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreatorProfile } from '@/hooks/useCreatorProfile'
import { getCreatorProfile, updateCreatorProfile } from '@/lib/api/creator'
import type { ApiCreatorProfile, UpdateCreatorProfileRequest } from '@/lib/api-types'

// Mock the API functions
jest.mock('@/lib/api/creator', () => ({
  getCreatorProfile: jest.fn(),
  updateCreatorProfile: jest.fn()
}))

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

/**
 * Create a test QueryClient with optimized configuration for testing
 * - Disable retries to avoid flaky tests
 * - Set gcTime (cache time) to 0 for immediate cleanup
 * - Disable refetch on window focus
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  })

let queryClient: QueryClient

/**
 * Wrapper component that provides QueryClientProvider for hook tests
 */
const createWrapper = () => {
  queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useCreatorProfile', () => {
  const mockCreatorProfile: ApiCreatorProfile = {
    id: 'creator-123',
    name: 'Chef Maria',
    creator_display_name: 'Chef Maria',
    creator_bio: 'Passionate about Italian cuisine',
    creator_profile_image_url: 'https://example.com/avatar.jpg',
    creator_email_verified: true,
    is_active: true,
    total_earnings: 5000,
    total_meal_plans_created: 15,
    creator_rating: 4.8,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => {
    queryClient?.clear()
  })

  describe('Basic Functionality', () => {
    it('should fetch creator profile successfully', async () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      
      getCreatorProfile.mockResolvedValueOnce({
        success: true,
        data: mockCreatorProfile
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockCreatorProfile)
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle loading state', () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      getCreatorProfile.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should handle error state', async () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      
      const testError = new Error('Failed to fetch profile')
      getCreatorProfile.mockResolvedValueOnce({
        success: false,
        error: { message: 'Failed to fetch profile' }
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).toBe('Failed to fetch profile')
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle API failure with no error message', async () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      
      getCreatorProfile.mockResolvedValueOnce({
        success: false
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).toBe('Failed to fetch profile')
    })

    it('should handle successful response with no data', async () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      
      getCreatorProfile.mockResolvedValueOnce({
        success: true,
        data: null
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeNull()
      expect(result.current.error).toBe('No data returned from API')
    })
  })

  describe('Update Profile', () => {
    it('should update creator profile successfully', async () => {
      const { getCreatorProfile, updateCreatorProfile } = require('@/lib/api/creator')
      
      const initialProfile = { ...mockCreatorProfile, creator_display_name: 'Old Name' }
      const updatedProfile = { ...mockCreatorProfile, creator_display_name: 'New Name' }
      
      getCreatorProfile.mockResolvedValueOnce({
        success: true,
        data: initialProfile
      })

      updateCreatorProfile.mockResolvedValueOnce({
        success: true,
        data: updatedProfile
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.creator_display_name).toBe('Old Name')

      // Update profile
      const updateData: UpdateCreatorProfileRequest = {
        creator_display_name: 'New Name',
        bio: 'Updated bio'
      }

      await act(async () => {
        await result.current.updateProfile(updateData)
      })

      // Should show updating state and then refetch
      expect(updateCreatorProfile).toHaveBeenCalledWith(updateData)
    })

    it('should handle update profile errors', async () => {
      const { updateCreatorProfile } = require('@/lib/api/creator')
      
      const testError = new Error('Update failed')
      updateCreatorProfile.mockResolvedValueOnce({
        success: false,
        error: { message: 'Update failed' }
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      const updateData: UpdateCreatorProfileRequest = {
        creator_display_name: 'New Name'
      }

      await act(async () => {
        await result.current.updateProfile(updateData)
      })

      expect(result.current.error).toBe('Update failed')
      expect(result.current.isUpdating).toBe(false)
    })

    it('should show loading state during update', async () => {
      const { getCreatorProfile, updateCreatorProfile } = require('@/lib/api/creator')
      
      getCreatorProfile.mockResolvedValueOnce({
        success: true,
        data: mockCreatorProfile
      })

      updateCreatorProfile.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isUpdating).toBe(false)

      const updateData: UpdateCreatorProfileRequest = {
        creator_display_name: 'New Name'
      }

      act(() => {
        result.current.updateProfile(updateData)
      })

      expect(result.current.isUpdating).toBe(true)
    })

    it('should handle update success with no data returned', async () => {
      const { updateCreatorProfile } = require('@/lib/api/creator')
      
      updateCreatorProfile.mockResolvedValueOnce({
        success: true
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      const updateData: UpdateCreatorProfileRequest = {
        creator_display_name: 'New Name'
      }

      await act(async () => {
        await result.current.updateProfile(updateData)
      })

      expect(result.current.error).toBe('Update succeeded but no data returned')
    })
  })

  describe('Data Structure', () => {
    it('should return correct profile data structure', async () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      
      getCreatorProfile.mockResolvedValueOnce({
        success: true,
        data: mockCreatorProfile
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toHaveProperty('id')
      expect(result.current.data).toHaveProperty('creator_display_name')
      expect(result.current.data).toHaveProperty('creator_bio')
      expect(result.current.data).toHaveProperty('total_meal_plans_created')
      expect(result.current.data).toHaveProperty('creator_rating')
    })
  })

  describe('Refetching', () => {
    it('should support manual refetch', async () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      
      const initialProfile = { ...mockCreatorProfile, creator_display_name: 'Initial' }
      const refetchedProfile = { ...mockCreatorProfile, creator_display_name: 'Refetched' }
      
      getCreatorProfile
        .mockResolvedValueOnce({ success: true, data: initialProfile })
        .mockResolvedValueOnce({ success: true, data: refetchedProfile })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.data?.creator_display_name).toBe('Initial')
      })

      // Manual refetch
      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.data?.creator_display_name).toBe('Refetched')
      })
    })

    it('should refetch after successful update', async () => {
      const { getCreatorProfile, updateCreatorProfile } = require('@/lib/api/creator')
      
      const initialProfile = { ...mockCreatorProfile, creator_display_name: 'Old Name' }
      const updatedProfile = { ...mockCreatorProfile, creator_display_name: 'New Name' }
      
      getCreatorProfile
        .mockResolvedValueOnce({ success: true, data: initialProfile })
        .mockResolvedValueOnce({ success: true, data: updatedProfile })

      updateCreatorProfile.mockResolvedValueOnce({
        success: true,
        data: updatedProfile
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.data?.creator_display_name).toBe('Old Name')
      })

      const updateData: UpdateCreatorProfileRequest = {
        creator_display_name: 'New Name'
      }

      await act(async () => {
        await result.current.updateProfile(updateData)
      })

      // Should refetch after update
      await waitFor(() => {
        expect(result.current.data?.creator_display_name).toBe('New Name')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle network errors during fetch', async () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      
      const networkError = new Error('Network error')
      getCreatorProfile.mockRejectedValueOnce(networkError)

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
    })

    it('should handle update network errors', async () => {
      const { updateCreatorProfile } = require('@/lib/api/creator')
      
      const networkError = new Error('Network error')
      updateCreatorProfile.mockRejectedValueOnce(networkError)

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      const updateData: UpdateCreatorProfileRequest = {
        creator_display_name: 'New Name'
      }

      await act(async () => {
        await result.current.updateProfile(updateData)
      })

      expect(result.current.error).toBe('Network error')
    })

    it('should combine fetch and update errors', async () => {
      const { getCreatorProfile, updateCreatorProfile } = require('@/lib/api/creator')
      
      // Mock a failed fetch
      getCreatorProfile.mockResolvedValueOnce({
        success: false,
        error: { message: 'Fetch error' }
      })

      // Mock a failed update
      updateCreatorProfile.mockResolvedValueOnce({
        success: false,
        error: { message: 'Update error' }
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      // Should show fetch error first
      await waitFor(() => {
        expect(result.current.error).toBe('Fetch error')
      })

      const updateData: UpdateCreatorProfileRequest = {
        creator_display_name: 'New Name'
      }

      await act(async () => {
        await result.current.updateProfile(updateData)
      })

      // Should now show update error
      expect(result.current.error).toBe('Update error')
    })

    it('should cleanup updating state after error', async () => {
      const { updateCreatorProfile } = require('@/lib/api/creator')
      
      updateCreatorProfile.mockRejectedValueOnce(new Error('Update failed'))

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      expect(result.current.isUpdating).toBe(false)

      const updateData: UpdateCreatorProfileRequest = {
        creator_display_name: 'New Name'
      }

      await act(async () => {
        await result.current.updateProfile(updateData)
      })

      expect(result.current.isUpdating).toBe(false)
    })
  })

  describe('Caching', () => {
    it('should cache profile data with React Query', async () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      
      getCreatorProfile.mockResolvedValueOnce({
        success: true,
        data: mockCreatorProfile
      })

      const { result } = renderHook(() => useCreatorProfile(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockCreatorProfile)

      // Second render should use cached data (no additional API call)
      const { result: result2 } = renderHook(() => useCreatorProfile(), { wrapper })

      expect(result2.current.data).toEqual(mockCreatorProfile)
      expect(getCreatorProfile).toHaveBeenCalledTimes(1)
    })
  })

  describe('Enabled/Disabled Behavior', () => {
    it('should not fetch when disabled', () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      getCreatorProfile.mockImplementation(() => new Promise(() => {}))

      renderHook(() => useCreatorProfile({ enabled: false }), { wrapper })

      // API should not be called when disabled
      expect(getCreatorProfile).not.toHaveBeenCalled()
    })

    it('should respect enabled option', async () => {
      const { getCreatorProfile } = require('@/lib/api/creator')
      
      getCreatorProfile.mockResolvedValueOnce({
        success: true,
        data: mockCreatorProfile
      })

      const { result } = renderHook(() => useCreatorProfile({ enabled: true }), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(getCreatorProfile).toHaveBeenCalledTimes(1)
    })
  })
})
