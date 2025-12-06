/**
 * Tests for useMealPlans hook
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMealPlans } from '@/hooks/useMealPlans'
import { createQueryWrapper } from '@/__tests__/test-utils'
import { getMealPlans } from '@/lib/api/meal-plans'

// Mock the meal plans API
jest.mock('@/lib/api/meal-plans')

describe('useMealPlans', () => {
  const wrapper = createQueryWrapper()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch meal plans on mount', async () => {
    const mockData = {
      success: true,
      data: {
        meal_plans: [
          {
            id: 'plan-1',
            title: 'Test Plan',
            description: 'Test description',
            duration_days: 7,
            duration_type: 'weekly',
            final_price: 25.0,
            category: 'family',
            dietary_tags: ['vegetarian'],
            difficulty_level: 'easy',
            is_free: false,
            is_featured: true,
            average_rating: 4.5,
            total_purchases: 150,
            provider: {
              id: 'provider-1',
              name: 'Test Provider',
              creator_display_name: 'Test Business',
            },
          },
        ],
        total: 1,
      },
    }

    ;(getMealPlans as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useMealPlans(), {
      wrapper,
    })

    // React Query starts with isLoading = true
    expect(result.current.isLoading).toBe(true)

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify data is populated correctly
    expect(result.current.data).toEqual(mockData.data)
    expect(result.current.error).toBeNull()
  })

  it('should update when filters change', async () => {
    const mockData1 = {
      success: true,
      data: { meal_plans: [], total: 0 },
    }
    const mockData2 = {
      success: true,
      data: { meal_plans: [], total: 0 },
    }

    ;(getMealPlans as jest.Mock)
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2)

    const { result, rerender } = renderHook(
      ({ filters }) => useMealPlans(filters),
      {
        initialProps: { filters: {} },
        wrapper,
      }
    )

    // Wait for initial fetch with empty filters
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getMealPlans).toHaveBeenCalledWith({})

    // Change filters and rerender
    rerender({ filters: { category: 'family' } })

    // Wait for new fetch with updated filters
    await waitFor(() => {
      expect(getMealPlans).toHaveBeenCalledWith({ category: 'family' })
    })
  })

  it('should handle loading state', async () => {
    ;(getMealPlans as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              data: { meal_plans: [], total: 0 },
            })
          }, 100)
        })
    )

    const { result } = renderHook(() => useMealPlans(), {
      wrapper,
    })

    // Should start in loading state
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
  })

  it('should handle error state', async () => {
    const mockError = new Error('Failed to fetch')
    ;(getMealPlans as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useMealPlans(), {
      wrapper,
    })

    // Wait for the error to be set
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error)
    })

    expect(result.current.error?.message).toBe('Failed to fetch')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('should support refetch functionality', async () => {
    const mockData = {
      success: true,
      data: { meal_plans: [], total: 0 },
    }

    ;(getMealPlans as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useMealPlans(), {
      wrapper,
    })

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getMealPlans).toHaveBeenCalledTimes(1)

    // Call refetch
    result.current.refetch()

    // Wait for refetch to complete
    await waitFor(() => {
      expect(getMealPlans).toHaveBeenCalledTimes(2)
    })
  })

  it('should support pagination', async () => {
    const mockData = {
      success: true,
      data: { meal_plans: [], total: 50 },
    }

    ;(getMealPlans as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(
      () => useMealPlans({ page: 2, limit: 10 }),
      {
        wrapper,
      }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getMealPlans).toHaveBeenCalledWith({ page: 2, limit: 10 })
  })

  it('should handle empty results', async () => {
    const mockData = {
      success: true,
      data: { meal_plans: [], total: 0 },
    }

    ;(getMealPlans as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useMealPlans(), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.meal_plans).toEqual([])
    expect(result.current.data?.total).toBe(0)
  })

  it('should not fetch when disabled', async () => {
    ;(getMealPlans as jest.Mock).mockResolvedValue({
      success: true,
      data: { meal_plans: [], total: 0 },
    })

    renderHook(() => useMealPlans({}, { enabled: false }), {
      wrapper,
    })

    // When enabled is false, the query should not be executed
    expect(getMealPlans).not.toHaveBeenCalled()
  })
})
