/**
 * Tests for useCreatorMealPlans hook
 * Manages creator meal plans data fetching and state
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useCreatorMealPlans } from '@/hooks/useCreatorMealPlans'
import * as creatorApi from '@/lib/api/creator'

// Mock the creator API module
jest.mock('@/lib/api/creator')

describe('useCreatorMealPlans', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    ;(creatorApi.getCreatorMealPlans as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => useCreatorMealPlans())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isEmpty).toBe(false)
  })

  it('should fetch meal plans successfully', async () => {
    const mockMealPlansData = {
      success: true,
      data: {
        meal_plans: [
          {
            id: 'plan-1',
            title: 'Weekly Meal Plan',
            description: 'A week of healthy meals',
            duration_days: 7,
            final_price: 25.0,
            total_purchases: 10,
            average_rating: 4.5,
            is_published: true,
            is_active: true,
          },
          {
            id: 'plan-2',
            title: 'Quick Dinners',
            description: 'Fast and easy dinners',
            duration_days: 5,
            final_price: 20.0,
            total_purchases: 5,
            average_rating: 4.2,
            is_published: false,
            is_active: true,
          },
        ],
      },
    }

    ;(creatorApi.getCreatorMealPlans as jest.Mock).mockResolvedValue(mockMealPlansData)

    const { result } = renderHook(() => useCreatorMealPlans())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockMealPlansData.data.meal_plans)
    expect(result.current.error).toBeNull()
    expect(result.current.isEmpty).toBe(false)
    expect(result.current.data).toHaveLength(2)
  })

  it('should handle empty meal plans list', async () => {
    const mockEmptyData = {
      success: true,
      data: {
        meal_plans: [],
      },
    }

    ;(creatorApi.getCreatorMealPlans as jest.Mock).mockResolvedValue(mockEmptyData)

    const { result } = renderHook(() => useCreatorMealPlans())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual([])
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Failed to fetch meal plans')
    ;(creatorApi.getCreatorMealPlans as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useCreatorMealPlans())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch meal plans')
    expect(result.current.data).toBeNull()
    expect(result.current.isEmpty).toBe(false)
  })

  it('should provide refetch function', async () => {
    const mockMealPlansData = {
      success: true,
      data: {
        meal_plans: [
          {
            id: 'plan-1',
            title: 'Original Plan',
            description: 'Original description',
            duration_days: 7,
            final_price: 25.0,
            total_purchases: 10,
            average_rating: 4.5,
          },
        ],
      },
    }

    ;(creatorApi.getCreatorMealPlans as jest.Mock).mockResolvedValue(mockMealPlansData)

    const { result } = renderHook(() => useCreatorMealPlans())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Clear the mock to verify refetch calls it again
    ;(creatorApi.getCreatorMealPlans as jest.Mock).mockClear()

    // Update mock data for refetch
    const updatedData = {
      success: true,
      data: {
        meal_plans: [
          {
            id: 'plan-1',
            title: 'Updated Plan',
            description: 'Updated description',
            duration_days: 7,
            final_price: 30.0,
            total_purchases: 15,
            average_rating: 4.7,
          },
        ],
      },
    }
    ;(creatorApi.getCreatorMealPlans as jest.Mock).mockResolvedValue(updatedData)

    // Trigger refetch
    act(() => {
      result.current.refetch()
    })

    await waitFor(() => {
      expect(creatorApi.getCreatorMealPlans).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(result.current.data?.[0].title).toBe('Updated Plan')
      expect(result.current.data?.[0].final_price).toBe(30.0)
    })
  })

  it('should handle network errors', async () => {
    const mockError = new Error('Network error')
    ;(creatorApi.getCreatorMealPlans as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useCreatorMealPlans())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('should not fetch if disabled', () => {
    ;(creatorApi.getCreatorMealPlans as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        meal_plans: [],
      },
    })

    const { result } = renderHook(() => useCreatorMealPlans({ enabled: false }))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(creatorApi.getCreatorMealPlans).not.toHaveBeenCalled()
  })
})
