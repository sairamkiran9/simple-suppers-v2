/**
 * Tests for useMealPlanDetail hook
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMealPlanDetail } from '@/hooks/useMealPlanDetail'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { getMealPlanDetail } from '@/lib/api/meal-plans'
import { createTestQueryClient } from '@/__tests__/test-utils'

// Mock the auth context
jest.mock('@/lib/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(),
}))

// Mock the API
jest.mock('@/lib/api/meal-plans')

/**
 * Create wrapper component with QueryClientProvider and AuthProvider
 * Uses shared test QueryClient for consistency (includes retryOnMount: false)
 */
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
    const testQueryClient = createTestQueryClient()
    return (
      <QueryClientProvider client={testQueryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }
}

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
          creator_display_name: 'Test Business',
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

    // React Query starts in loading state
    expect(result.current.isLoading).toBe(true)

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify data is loaded and error is null
    expect(result.current.data).toEqual(mockData.data)
    expect(result.current.error).toBe(null)
  })

  it('should handle loading state', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    ;(getMealPlanDetail as jest.Mock).mockReturnValue(promise)

    const { result } = renderHook(() => useMealPlanDetail('plan-1'), { wrapper: createWrapper() })

    // Should start in loading state
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)

    // Resolve the promise
    act(() => {
      resolvePromise!({
        success: true,
        data: { id: 'plan-1', title: 'Test Plan' },
      })
    })

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
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

    // Should start in loading state
    expect(result.current.isLoading).toBe(true)

    // Wait for error to be set (React Query will retry once, then fail)
    await waitFor(
      () => {
        expect(result.current.error).toBe('Failed to fetch meal plan')
      },
      { timeout: 2000 }
    )

    // Verify loading is complete and data is null
    expect(result.current.isLoading).toBe(false)
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

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getMealPlanDetail).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(mockData.data)

    // Call refetch
    await act(async () => {
      await result.current.refetch()
    })

    // Verify API was called again
    expect(getMealPlanDetail).toHaveBeenCalledTimes(2)
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
