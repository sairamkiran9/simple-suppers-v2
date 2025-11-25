/**
 * Tests for useUserDashboard hook
 * Manages user dashboard data fetching and state
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useUserDashboard } from '@/hooks/useUserDashboard'
import * as userApi from '@/lib/api/user'

// Mock the user API module
jest.mock('@/lib/api/user')

describe('useUserDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    ;(userApi.getUserDashboard as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => useUserDashboard())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should fetch dashboard data successfully', async () => {
    const mockDashboardData = {
      success: true,
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          subscription_tier: 'freemium',
          free_plans_used: 1,
        },
        purchased_plans: [
          {
            id: 'plan-1',
            title: 'Weekly Meal Plan',
            provider_name: 'Test Provider',
            purchase_date: '2024-01-01T00:00:00Z',
            purchase_price: 25.0,
          },
        ],
        free_plans: [
          {
            id: 'free-1',
            title: 'Free Plan',
            provider_name: 'Free Provider',
          },
        ],
        total_spent: 25.0,
      },
    }

    ;(userApi.getUserDashboard as jest.Mock).mockResolvedValue(mockDashboardData)

    const { result } = renderHook(() => useUserDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockDashboardData.data)
    expect(result.current.error).toBeNull()
    expect(result.current.data?.purchased_plans).toHaveLength(1)
    expect(result.current.data?.free_plans).toHaveLength(1)
  })

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Failed to fetch dashboard')
    ;(userApi.getUserDashboard as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useUserDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch dashboard')
    expect(result.current.data).toBeNull()
  })

  it('should provide refetch function', async () => {
    const mockDashboardData = {
      success: true,
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          subscription_tier: 'freemium',
          free_plans_used: 0,
        },
        purchased_plans: [],
        free_plans: [],
        total_spent: 0,
      },
    }

    ;(userApi.getUserDashboard as jest.Mock).mockResolvedValue(mockDashboardData)

    const { result } = renderHook(() => useUserDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Clear the mock to verify refetch calls it again
    ;(userApi.getUserDashboard as jest.Mock).mockClear()

    // Update mock data for refetch
    const updatedData = {
      ...mockDashboardData,
      data: {
        ...mockDashboardData.data,
        total_spent: 50.0,
      },
    }
    ;(userApi.getUserDashboard as jest.Mock).mockResolvedValue(updatedData)

    // Trigger refetch
    act(() => {
      result.current.refetch()
    })

    await waitFor(() => {
      expect(userApi.getUserDashboard).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(result.current.data?.total_spent).toBe(50.0)
    })
  })

  it('should handle empty purchased plans', async () => {
    const mockDashboardData = {
      success: true,
      data: {
        user: {
          name: 'New User',
          email: 'new@example.com',
          subscription_tier: 'freemium',
          free_plans_used: 0,
        },
        purchased_plans: [],
        free_plans: [],
        total_spent: 0,
      },
    }

    ;(userApi.getUserDashboard as jest.Mock).mockResolvedValue(mockDashboardData)

    const { result } = renderHook(() => useUserDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.purchased_plans).toHaveLength(0)
    expect(result.current.data?.total_spent).toBe(0)
  })

  it('should handle network errors', async () => {
    const mockError = new Error('Network error')
    ;(userApi.getUserDashboard as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useUserDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('should not fetch if disabled', () => {
    ;(userApi.getUserDashboard as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        user: { name: 'Test', email: 'test@example.com', subscription_tier: 'freemium', free_plans_used: 0 },
        purchased_plans: [],
        free_plans: [],
        total_spent: 0,
      },
    })

    const { result } = renderHook(() => useUserDashboard({ enabled: false }))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(userApi.getUserDashboard).not.toHaveBeenCalled()
  })
})
