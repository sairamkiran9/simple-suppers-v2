/**
 * Tests for useCreatorDashboard hook
 * Manages creator dashboard data fetching and state
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useCreatorDashboard } from '@/hooks/useCreatorDashboard'
import * as creatorApi from '@/lib/api/creator'

// Mock the creator API module
jest.mock('@/lib/api/creator')

describe('useCreatorDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    ;(creatorApi.getCreatorDashboard as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => useCreatorDashboard())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should fetch dashboard data successfully', async () => {
    const mockDashboardData = {
      success: true,
      data: {
        creator: {
          id: 'user-1',
          is_creator: true,
          creator_display_name: 'Test Creator',
          creator_bio: 'Amazing meals',
          creator_profile_image_url: null,
          creator_email_verified: true,
          is_active: true,
          total_earnings: 500,
          total_meal_plans_created: 5,
          creator_rating: 4.5,
        },
        analytics: {
          total_meal_plans: 5,
          published_plans: 3,
          draft_plans: 2,
          total_views: 100,
          total_sales: 20,
          current_month_earnings: 150,
          all_time_earnings: 500,
        },
        recent_purchases: [
          {
            id: 'purchase-1',
            meal_plan_title: 'Weekly Meal Plan',
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            purchase_price: 25.0,
            creator_earnings: 20.0,
            purchased_at: '2024-01-01T00:00:00Z',
            status: 'completed',
          },
        ],
        top_performing_plans: [
          {
            id: 'plan-1',
            title: 'Popular Plan',
            total_purchases: 50,
            total_views: 200,
            average_rating: 4.8,
            final_price: 25.0,
          },
        ],
      },
    }

    ;(creatorApi.getCreatorDashboard as jest.Mock).mockResolvedValue(mockDashboardData)

    const { result } = renderHook(() => useCreatorDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockDashboardData.data)
    expect(result.current.error).toBeNull()
    expect(result.current.data?.creator.creator_display_name).toBe('Test Creator')
    expect(result.current.data?.analytics.published_plans).toBe(3)
  })

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Failed to fetch dashboard')
    ;(creatorApi.getCreatorDashboard as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useCreatorDashboard())

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
        creator: {
          id: 'user-1',
          is_creator: true,
          creator_display_name: 'Test Creator',
          creator_bio: 'Amazing meals',
          creator_profile_image_url: null,
          creator_email_verified: true,
          is_active: true,
          total_earnings: 500,
          total_meal_plans_created: 5,
          creator_rating: 4.5,
        },
        analytics: {
          total_meal_plans: 5,
          published_plans: 3,
          draft_plans: 2,
          total_views: 100,
          total_sales: 20,
          current_month_earnings: 150,
          all_time_earnings: 500,
        },
        recent_purchases: [],
        top_performing_plans: [],
      },
    }

    ;(creatorApi.getCreatorDashboard as jest.Mock).mockResolvedValue(mockDashboardData)

    const { result } = renderHook(() => useCreatorDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Clear the mock to verify refetch calls it again
    ;(creatorApi.getCreatorDashboard as jest.Mock).mockClear()

    // Update mock data for refetch
    const updatedData = {
      ...mockDashboardData,
      data: {
        ...mockDashboardData.data,
        analytics: {
          ...mockDashboardData.data.analytics,
          total_sales: 30,
        },
      },
    }
    ;(creatorApi.getCreatorDashboard as jest.Mock).mockResolvedValue(updatedData)

    // Trigger refetch
    result.current.refetch()

    await waitFor(() => {
      expect(creatorApi.getCreatorDashboard).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(result.current.data?.analytics.total_sales).toBe(30)
    })
  })

  it('should handle empty dashboard data', async () => {
    const mockDashboardData = {
      success: true,
      data: {
        creator: {
          id: 'user-new',
          is_creator: true,
          creator_display_name: 'New Creator',
          creator_bio: null,
          creator_profile_image_url: null,
          creator_email_verified: true,
          is_active: true,
          total_earnings: 0,
          total_meal_plans_created: 0,
          creator_rating: 0,
        },
        analytics: {
          total_meal_plans: 0,
          published_plans: 0,
          draft_plans: 0,
          total_views: 0,
          total_sales: 0,
          current_month_earnings: 0,
          all_time_earnings: 0,
        },
        recent_purchases: [],
        top_performing_plans: [],
      },
    }

    ;(creatorApi.getCreatorDashboard as jest.Mock).mockResolvedValue(mockDashboardData)

    const { result } = renderHook(() => useCreatorDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.analytics.total_meal_plans).toBe(0)
    expect(result.current.data?.recent_purchases).toHaveLength(0)
  })

  it('should handle network errors', async () => {
    const mockError = new Error('Network error')
    ;(creatorApi.getCreatorDashboard as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useCreatorDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('should not fetch if disabled', () => {
    ;(creatorApi.getCreatorDashboard as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        creator: {
          id: 'user-1',
          is_creator: true,
          creator_display_name: 'Test',
          creator_bio: null,
          creator_profile_image_url: null,
          creator_email_verified: true,
          is_active: true,
          total_earnings: 0,
          total_meal_plans_created: 0,
          creator_rating: 0,
        },
        analytics: {
          total_meal_plans: 0,
          published_plans: 0,
          draft_plans: 0,
          total_views: 0,
          total_sales: 0,
          current_month_earnings: 0,
          all_time_earnings: 0,
        },
        recent_purchases: [],
        top_performing_plans: [],
      },
    })

    const { result } = renderHook(() => useCreatorDashboard({ enabled: false }))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(creatorApi.getCreatorDashboard).not.toHaveBeenCalled()
  })
})
