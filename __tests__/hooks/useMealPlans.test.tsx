/**
 * Tests for useMealPlans hook
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMealPlans } from '@/hooks/useMealPlans'
import { getMealPlans } from '@/lib/api/meal-plans'

jest.mock('@/lib/api/meal-plans')

describe('useMealPlans', () => {
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
              business_name: 'Test Business',
            },
          },
        ],
        total: 1,
      },
    }

    ;(getMealPlans as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useMealPlans())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData.data)
    expect(result.current.error).toBe(null)
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
      { initialProps: { filters: {} } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getMealPlans).toHaveBeenCalledWith({})

    rerender({ filters: { category: 'family' } })

    await waitFor(() => {
      expect(getMealPlans).toHaveBeenCalledWith({ category: 'family' })
    })
  })

  it('should handle loading state', async () => {
    ;(getMealPlans as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const { result } = renderHook(() => useMealPlans())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBe(null)
  })

  it('should handle error state', async () => {
    const mockError = new Error('Failed to fetch')
    ;(getMealPlans as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useMealPlans())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch')
    expect(result.current.data).toBe(null)
  })

  it('should support refetch functionality', async () => {
    const mockData = {
      success: true,
      data: { meal_plans: [], total: 0 },
    }

    ;(getMealPlans as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useMealPlans())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getMealPlans).toHaveBeenCalledTimes(1)

    result.current.refetch()

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

    const { result } = renderHook(() =>
      useMealPlans({ page: 2, limit: 10 })
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

    const { result } = renderHook(() => useMealPlans())

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

    renderHook(() => useMealPlans({}, { enabled: false }))

    expect(getMealPlans).not.toHaveBeenCalled()
  })
})
