/**
 * Tests for useMealPlanDetail hook
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useMealPlanDetail } from '@/hooks/useMealPlanDetail'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { getMealPlanDetail } from '@/lib/api/meal-plans'

// Mock the auth context
jest.mock('@/lib/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(),
}))

const createWrapper = (isAuthenticated = true) => {
  // Mock the useAuth hook
  ;(useAuth as jest.Mock).mockReturnValue({
    user: isAuthenticated ? { id: '1', email: 'test@example.com' } : null,
    isLoading: false,
    isAuthenticated,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>
  }
}


jest.mock('@/lib/api/meal-plans')

describe('useMealPlanDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch meal plan detail by ID', async () => {
    const mockData = {
      success: true,
      data: {
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
        provider: {
          id: 'provider-1',
          name: 'Test Provider',
          business_name: 'Test Business',
          rating: 4.8,
        },
        meal_plan_days: [
          {
            day_number: 1,
            day_title: 'Day 1',
            meals: [
              {
                meal_type: 'dinner',
                meal_name: 'Spaghetti Bolognese',
                servings: 4,
                ingredients: ['pasta', 'tomato sauce', 'ground beef'],
                instructions: 'Cook pasta. Make sauce. Combine.',
              },
            ],
          },
        ],
      },
    }

    ;(getMealPlanDetail as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useMealPlanDetail('plan-1'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData.data)
    expect(result.current.error).toBe(null)
  })

  it('should handle loading state', async () => {
    ;(getMealPlanDetail as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const { result } = renderHook(() => useMealPlanDetail('plan-1'), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBe(null)
  })

  it('should handle error state', async () => {
    ;(getMealPlanDetail as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch meal plan',
      },
    })
    const { result } = renderHook(() => useMealPlanDetail('plan-1'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch meal plan')
    expect(result.current.data).toBe(null)
  })

  it('should support refetch functionality', async () => {
    const mockData = {
      success: true,
      data: {
        id: 'plan-1',
        title: 'Test Plan',
        description: 'Test description',
        duration_days: 7,
        final_price: 25.0,
        provider: {
          name: 'Test Provider',
        },
        meal_plan_days: [],
      },
    }

    ;(getMealPlanDetail as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useMealPlanDetail('plan-1'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getMealPlanDetail).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.refetch()
    })

    await waitFor(() => {
      expect(getMealPlanDetail).toHaveBeenCalledTimes(2)
    })
  })

  it('should not fetch when disabled', async () => {
    ;(getMealPlanDetail as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 'plan-1',
        title: 'Test Plan',
        description: 'Test description',
        duration_days: 7,
        final_price: 25.0,
        provider: { name: 'Test Provider' },
        meal_plan_days: [],
      },
    })

    renderHook(() => useMealPlanDetail('plan-1', { enabled: false }), { wrapper: createWrapper() })

    expect(getMealPlanDetail).not.toHaveBeenCalled()
  })
})
