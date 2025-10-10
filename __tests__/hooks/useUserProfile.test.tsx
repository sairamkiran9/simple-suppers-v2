/**
 * Tests for useUserProfile hook
 * Manages user profile updates with optimistic updates
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useUserProfile } from '@/hooks/useUserProfile'
import * as userApi from '@/lib/api/user'
import type { UpdateUserProfileRequest } from '@/lib/api-types'

// Mock the user API module
jest.mock('@/lib/api/user')

describe('useUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with ready state', () => {
    const { result } = renderHook(() => useUserProfile())

    expect(result.current.isUpdating).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should update profile successfully', async () => {
    const mockUpdateData: UpdateUserProfileRequest = {
      name: 'Updated Name',
    }

    const mockResponse = {
      success: true,
      data: {
        user: {
          id: 'user-1',
          name: 'Updated Name',
          email: 'test@example.com',
          user_type: 'user',
          subscription_tier: 'freemium',
          dietary_preferences: [],
          is_active: true,
        },
      },
    }

    ;(userApi.updateUserProfile as jest.Mock).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useUserProfile())

    let updateResult
    await act(async () => {
      updateResult = await result.current.updateProfile(mockUpdateData)
    })

    expect(userApi.updateUserProfile).toHaveBeenCalledWith(mockUpdateData)
    expect(updateResult).toEqual(mockResponse.data.user)
    expect(result.current.error).toBeNull()
  })

  it('should handle optimistic updates', async () => {
    const mockUpdateData: UpdateUserProfileRequest = {
      name: 'Optimistic Name',
      dietary_preferences: ['vegan'],
    }

    const mockResponse = {
      success: true,
      data: {
        user: {
          id: 'user-1',
          name: 'Optimistic Name',
          email: 'test@example.com',
          user_type: 'user',
          subscription_tier: 'freemium',
          dietary_preferences: ['vegan'],
          is_active: true,
        },
      },
    }

    ;(userApi.updateUserProfile as jest.Mock).mockResolvedValue(mockResponse)

    const onSuccess = jest.fn()
    const { result } = renderHook(() => useUserProfile({ onSuccess }))

    await act(async () => {
      await result.current.updateProfile(mockUpdateData)
    })

    expect(onSuccess).toHaveBeenCalledWith(mockResponse.data.user)
  })

  it('should set loading state during update', async () => {
    const mockUpdateData: UpdateUserProfileRequest = {
      name: 'Test Name',
    }

    let resolveUpdate: (value: any) => void
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve
    })

    ;(userApi.updateUserProfile as jest.Mock).mockReturnValue(updatePromise)

    const { result } = renderHook(() => useUserProfile())

    // Start update
    act(() => {
      result.current.updateProfile(mockUpdateData)
    })

    // Should be loading
    expect(result.current.isUpdating).toBe(true)

    // Resolve the promise
    await act(async () => {
      resolveUpdate!({
        success: true,
        data: {
          user: {
            id: 'user-1',
            name: 'Test Name',
            email: 'test@example.com',
            user_type: 'user',
            subscription_tier: 'freemium',
            dietary_preferences: [],
            is_active: true,
          },
        },
      })
      await updatePromise
    })

    // Should no longer be loading
    expect(result.current.isUpdating).toBe(false)
  })

  it('should handle update errors', async () => {
    const mockUpdateData: UpdateUserProfileRequest = {
      name: '',
    }

    const mockError = new Error('Validation failed')
    ;(userApi.updateUserProfile as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useUserProfile())

    await act(async () => {
      try {
        await result.current.updateProfile(mockUpdateData)
      } catch (err) {
        // Expected to throw
      }
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Validation failed')
    })
    expect(result.current.isUpdating).toBe(false)
  })

  it('should call onError callback on failure', async () => {
    const mockUpdateData: UpdateUserProfileRequest = {
      name: 'Test',
    }

    const mockError = new Error('Network error')
    ;(userApi.updateUserProfile as jest.Mock).mockRejectedValue(mockError)

    const onError = jest.fn()
    const { result } = renderHook(() => useUserProfile({ onError }))

    await act(async () => {
      try {
        await result.current.updateProfile(mockUpdateData)
      } catch (err) {
        // Expected to throw
      }
    })

    expect(onError).toHaveBeenCalledWith(mockError)
  })

  it('should update dietary preferences only', async () => {
    const mockUpdateData: UpdateUserProfileRequest = {
      dietary_preferences: ['gluten-free', 'dairy-free'],
    }

    const mockResponse = {
      success: true,
      data: {
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          user_type: 'user',
          subscription_tier: 'freemium',
          dietary_preferences: ['gluten-free', 'dairy-free'],
          is_active: true,
        },
      },
    }

    ;(userApi.updateUserProfile as jest.Mock).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useUserProfile())

    let updateResult
    await act(async () => {
      updateResult = await result.current.updateProfile(mockUpdateData)
    })

    expect(updateResult).toEqual(mockResponse.data.user)
    expect(userApi.updateUserProfile).toHaveBeenCalledWith(mockUpdateData)
  })

  it('should clear error on successful update', async () => {
    const mockUpdateData: UpdateUserProfileRequest = {
      name: 'Test',
    }

    const mockError = new Error('First error')
    ;(userApi.updateUserProfile as jest.Mock).mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useUserProfile())

    // Trigger first error
    await act(async () => {
      try {
        await result.current.updateProfile(mockUpdateData)
      } catch (err) {
        // Expected
      }
    })

    await waitFor(() => {
      expect(result.current.error).toBe('First error')
    })

    // Succeed on second attempt
    const mockResponse = {
      success: true,
      data: {
        user: {
          id: 'user-1',
          name: 'Test',
          email: 'test@example.com',
          user_type: 'user',
          subscription_tier: 'freemium',
          dietary_preferences: [],
          is_active: true,
        },
      },
    }

    ;(userApi.updateUserProfile as jest.Mock).mockResolvedValue(mockResponse)

    await act(async () => {
      await result.current.updateProfile(mockUpdateData)
    })

    expect(result.current.error).toBeNull()
  })
})
