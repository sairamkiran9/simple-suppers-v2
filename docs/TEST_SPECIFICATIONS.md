# Test Specifications - API Integration

## Overview
This document contains detailed test specifications for all API integration work. Following Test-Driven Development (TDD), these specifications will be implemented as actual test files BEFORE writing the implementation code.

---

## Phase 1: Meal Plans Integration

### 1.1 API Functions - `__tests__/lib/api/meal-plans.test.ts`

**Implementation File**: `lib/api/meal-plans.ts`

```typescript
/**
 * Tests for lib/api/meal-plans.ts
 * API functions for meal plan operations
 */

import { apiClient } from '@/lib/api-client'
import { getMealPlans, getMealPlanDetail } from '@/lib/api/meal-plans'
import type { ApiMealPlan, ApiMealPlanDetail } from '@/lib/api-types'

// Mock the apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

describe('lib/api/meal-plans', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMealPlans', () => {
    it('should fetch all meal plans without filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [
            {
              id: 'plan-1',
              title: 'Weekly Meal Plan',
              description: 'A complete weekly meal plan',
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

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMealPlans()

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', undefined)
      expect(result).toEqual(mockResponse)
    })

    it('should fetch meal plans with category filter', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMealPlans({ category: 'family' })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        category: 'family',
      })
      expect(result.success).toBe(true)
    })

    it('should fetch meal plans with dietary tag filter', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ dietary_tag: 'vegetarian' })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        dietary_tag: 'vegetarian',
      })
    })

    it('should fetch meal plans with search query', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ search: 'pasta' })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        search: 'pasta',
      })
    })

    it('should fetch meal plans with price range', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ min_price: 10, max_price: 30 })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        min_price: 10,
        max_price: 30,
      })
    })

    it('should fetch free plans only', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ is_free: true })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        is_free: true,
      })
    })

    it('should fetch featured plans only', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ is_featured: true })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        is_featured: true,
      })
    })

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 50,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ page: 2, limit: 10 })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        page: 2,
        limit: 10,
      })
    })

    it('should handle sorting parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({ sort_by: 'price_asc' })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        sort_by: 'price_asc',
      })
    })

    it('should handle multiple filters combined', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plans: [],
          total: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      await getMealPlans({
        category: 'family',
        dietary_tag: 'vegetarian',
        search: 'pasta',
        min_price: 10,
        max_price: 30,
        is_featured: true,
        sort_by: 'rating',
        page: 1,
        limit: 20,
      })

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', {
        category: 'family',
        dietary_tag: 'vegetarian',
        search: 'pasta',
        min_price: 10,
        max_price: 30,
        is_featured: true,
        sort_by: 'rating',
        page: 1,
        limit: 20,
      })
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Network error')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getMealPlans()).rejects.toThrow('Network error')
    })
  })

  describe('getMealPlanDetail', () => {
    it('should fetch meal plan detail by ID', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'plan-1',
          title: 'Weekly Meal Plan',
          description: 'A complete weekly meal plan',
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
            rating: 4.8,
          },
          preview_meals: ['Spaghetti Bolognese', 'Chicken Stir-Fry'],
          recipes: [
            {
              day: 1,
              meal_type: 'dinner',
              name: 'Spaghetti Bolognese',
              ingredients: ['pasta', 'tomato sauce', 'ground beef'],
              instructions: 'Cook pasta. Make sauce. Combine.',
            },
          ],
          shopping_list: {
            produce: ['tomatoes', 'onions'],
            protein: ['ground beef'],
            pantry: ['pasta'],
          },
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMealPlanDetail('plan-1')

      expect(apiClient.get).toHaveBeenCalledWith('/meal-plans/plan-1')
      expect(result).toEqual(mockResponse)
    })

    it('should handle 404 for non-existent plan', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Meal plan not found',
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getMealPlanDetail('non-existent-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error?.code).toBe('NOT_FOUND')
      }
    })

    it('should handle network errors', async () => {
      const mockError = new Error('Network error')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getMealPlanDetail('plan-1')).rejects.toThrow('Network error')
    })
  })
})
```

**Expected Function Signatures** (to be implemented):

```typescript
// lib/api/meal-plans.ts

export interface GetMealPlansParams {
  category?: string
  dietary_tag?: string
  difficulty?: string
  search?: string
  min_price?: number
  max_price?: number
  is_free?: boolean
  is_featured?: boolean
  sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'newest'
  page?: number
  limit?: number
}

export async function getMealPlans(
  params?: GetMealPlansParams
): Promise<APIResponse<{ meal_plans: ApiMealPlan[]; total: number }>>

export async function getMealPlanDetail(
  id: string
): Promise<APIResponse<ApiMealPlanDetail>>
```

### 1.2 Hooks - `__tests__/hooks/useMealPlans.test.ts`

**Implementation File**: `hooks/useMealPlans.ts`

```typescript
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
            // ... other fields
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
```

### 1.3 Hooks - `__tests__/hooks/useMealPlanDetail.test.ts`

**Implementation File**: `hooks/useMealPlanDetail.ts`

```typescript
/**
 * Tests for useMealPlanDetail hook
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useMealPlanDetail } from '@/hooks/useMealPlanDetail'
import { getMealPlanDetail } from '@/lib/api/meal-plans'

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
        // ... other fields
      },
    }

    ;(getMealPlanDetail as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useMealPlanDetail('plan-1'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData.data)
    expect(result.current.error).toBe(null)
    expect(getMealPlanDetail).toHaveBeenCalledWith('plan-1')
  })

  it('should handle loading state', async () => {
    ;(getMealPlanDetail as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const { result } = renderHook(() => useMealPlanDetail('plan-1'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBe(null)
  })

  it('should handle error state (404, network errors)', async () => {
    const mockError = new Error('Meal plan not found')
    ;(getMealPlanDetail as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useMealPlanDetail('non-existent'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Meal plan not found')
    expect(result.current.data).toBe(null)
  })

  it('should support refetch functionality', async () => {
    const mockData = {
      success: true,
      data: { id: 'plan-1', title: 'Test' },
    }

    ;(getMealPlanDetail as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useMealPlanDetail('plan-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getMealPlanDetail).toHaveBeenCalledTimes(1)

    result.current.refetch()

    await waitFor(() => {
      expect(getMealPlanDetail).toHaveBeenCalledTimes(2)
    })
  })

  it('should not fetch when disabled', async () => {
    ;(getMealPlanDetail as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'plan-1' },
    })

    renderHook(() => useMealPlanDetail('plan-1', { enabled: false }))

    expect(getMealPlanDetail).not.toHaveBeenCalled()
  })
})
```

### 1.4 Component - `__tests__/components/MealPlanCard.test.tsx`

```typescript
/**
 * Tests for MealPlanCard component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import MealPlanCard from '@/components/MealPlanCard'
import type { ApiMealPlan } from '@/lib/api-types'

describe('MealPlanCard', () => {
  const mockPlan: ApiMealPlan = {
    id: 'plan-1',
    title: 'Test Meal Plan',
    description: 'A test meal plan',
    duration_days: 7,
    duration_type: 'weekly',
    final_price: 25.0,
    category: 'family',
    dietary_tags: ['vegetarian', 'gluten-free'],
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
  }

  const mockHandlers = {
    onViewDetails: jest.fn(),
    onSubscribe: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render meal plan with API data structure', () => {
    render(<MealPlanCard plan={mockPlan} {...mockHandlers} />)

    expect(screen.getByText('Test Meal Plan')).toBeInTheDocument()
    expect(screen.getByText('A test meal plan')).toBeInTheDocument()
  })

  it('should display provider name from nested provider object', () => {
    render(<MealPlanCard plan={mockPlan} {...mockHandlers} />)

    expect(screen.getByText(/Test Provider/)).toBeInTheDocument()
  })

  it('should handle string IDs correctly', () => {
    render(<MealPlanCard plan={mockPlan} {...mockHandlers} />)

    const viewButton = screen.getByText('View Details')
    fireEvent.click(viewButton)

    expect(mockHandlers.onViewDetails).toHaveBeenCalledWith('plan-1')
  })

  it('should call onViewDetails with string ID', () => {
    render(<MealPlanCard plan={mockPlan} {...mockHandlers} />)

    const viewButton = screen.getByText('View Details')
    fireEvent.click(viewButton)

    expect(mockHandlers.onViewDetails).toHaveBeenCalledWith('plan-1')
    expect(mockHandlers.onViewDetails).toHaveBeenCalledTimes(1)
  })

  it('should call onSubscribe with string ID', () => {
    render(<MealPlanCard plan={mockPlan} {...mockHandlers} />)

    const subscribeButton = screen.getByText('Subscribe')
    fireEvent.click(subscribeButton)

    expect(mockHandlers.onSubscribe).toHaveBeenCalledWith('plan-1')
    expect(mockHandlers.onSubscribe).toHaveBeenCalledTimes(1)
  })

  it('should display dietary tags', () => {
    render(<MealPlanCard plan={mockPlan} {...mockHandlers} />)

    expect(screen.getByText('vegetarian')).toBeInTheDocument()
    expect(screen.getByText('gluten-free')).toBeInTheDocument()
  })

  it('should display average_rating', () => {
    render(<MealPlanCard plan={mockPlan} {...mockHandlers} />)

    expect(screen.getByText(/4\.5/)).toBeInTheDocument()
  })

  it('should show free badge for free plans', () => {
    const freePlan = { ...mockPlan, is_free: true, final_price: 0 }
    render(<MealPlanCard plan={freePlan} {...mockHandlers} />)

    expect(screen.getByText(/Free/i)).toBeInTheDocument()
  })

  it('should show featured badge for featured plans', () => {
    render(<MealPlanCard plan={mockPlan} {...mockHandlers} />)

    expect(screen.getByText(/Featured/i)).toBeInTheDocument()
  })
})
```

### 1.5 Component - `__tests__/components/MealPlanDetail.test.tsx`

```typescript
/**
 * Tests for MealPlanDetail component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import MealPlanDetail from '@/components/MealPlanDetail'
import type { ApiMealPlanDetail } from '@/lib/api-types'

describe('MealPlanDetail', () => {
  const mockPlan: ApiMealPlanDetail = {
    id: 'plan-1',
    title: 'Test Meal Plan',
    description: 'A test meal plan',
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
      rating: 4.8,
    },
    preview_meals: ['Spaghetti Bolognese', 'Chicken Stir-Fry'],
    recipes: [
      {
        day: 1,
        meal_type: 'dinner',
        name: 'Spaghetti Bolognese',
        ingredients: ['pasta', 'tomato sauce'],
        instructions: 'Cook pasta.',
      },
    ],
    shopping_list: {
      produce: ['tomatoes'],
      protein: ['ground beef'],
      pantry: ['pasta'],
    },
  }

  const mockHandlers = {
    onBack: jest.fn(),
    onSubscribe: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render full meal plan detail', () => {
    render(<MealPlanDetail plan={mockPlan} {...mockHandlers} />)

    expect(screen.getByText('Test Meal Plan')).toBeInTheDocument()
    expect(screen.getByText('A test meal plan')).toBeInTheDocument()
  })

  it('should display provider info from nested object', () => {
    render(<MealPlanDetail plan={mockPlan} {...mockHandlers} />)

    expect(screen.getByText(/Test Provider/)).toBeInTheDocument()
  })

  it('should render preview_meals if available', () => {
    render(<MealPlanDetail plan={mockPlan} {...mockHandlers} />)

    expect(screen.getByText(/Spaghetti Bolognese/)).toBeInTheDocument()
    expect(screen.getByText(/Chicken Stir-Fry/)).toBeInTheDocument()
  })

  it('should handle missing preview_meals gracefully', () => {
    const planWithoutPreview = { ...mockPlan, preview_meals: undefined }
    render(<MealPlanDetail plan={planWithoutPreview} {...mockHandlers} />)

    // Should still render without errors
    expect(screen.getByText('Test Meal Plan')).toBeInTheDocument()
  })

  it('should display difficulty_level', () => {
    render(<MealPlanDetail plan={mockPlan} {...mockHandlers} />)

    expect(screen.getByText(/easy/i)).toBeInTheDocument()
  })

  it('should call onSubscribe with string ID', () => {
    render(<MealPlanDetail plan={mockPlan} {...mockHandlers} />)

    const subscribeButton = screen.getByText('Subscribe Now')
    fireEvent.click(subscribeButton)

    expect(mockHandlers.onSubscribe).toHaveBeenCalledWith('plan-1')
  })

  it('should navigate back to browse', () => {
    render(<MealPlanDetail plan={mockPlan} {...mockHandlers} />)

    const backButton = screen.getByText(/Back to Plans/i)
    fireEvent.click(backButton)

    expect(mockHandlers.onBack).toHaveBeenCalledTimes(1)
  })
})
```

---

## Phase 2: Provider Dashboard Integration

### 2.1 API Functions - `__tests__/lib/api/provider.test.ts`

**Implementation File**: `lib/api/provider.ts`

```typescript
/**
 * Tests for lib/api/provider.ts
 * API functions for provider operations
 */

import { apiClient } from '@/lib/api-client'
import {
  getProviderDashboard,
  createMealPlan,
  updateMealPlan,
  updateMealPlanStatus,
  deleteMealPlan,
} from '@/lib/api/provider'

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

describe('lib/api/provider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getProviderDashboard', () => {
    it('should fetch provider dashboard data', async () => {
      const mockResponse = {
        success: true,
        data: {
          provider: {
            id: 'provider-1',
            name: 'Test Provider',
            business_name: 'Test Business',
            rating: 4.5,
          },
          analytics: {
            total_plans: 5,
            total_subscribers: 234,
            monthly_earnings: 1247.0,
            total_earnings: 15000.0,
          },
          meal_plans: [],
          recent_purchases: [],
          top_performing_plans: [],
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getProviderDashboard()

      expect(apiClient.get).toHaveBeenCalledWith('/providers/dashboard')
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Unauthorized')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      await expect(getProviderDashboard()).rejects.toThrow('Unauthorized')
    })
  })

  describe('createMealPlan', () => {
    const validPlanData = {
      title: 'New Meal Plan',
      description: 'A great meal plan',
      duration_days: 7,
      duration_type: 'weekly',
      base_price: 25.0,
      category: 'family',
      dietary_tags: ['vegetarian'],
      difficulty_level: 'easy',
      recipes: [],
    }

    it('should create new meal plan with all required fields', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plan: {
            id: 'plan-1',
            ...validPlanData,
            is_published: false,
            is_active: true,
          },
        },
      }

      ;(apiClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createMealPlan(validPlanData)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/providers/meal-plans',
        validPlanData
      )
      expect(result.success).toBe(true)
    })

    it('should create meal plan with optional fields', async () => {
      const dataWithOptional = {
        ...validPlanData,
        preview_meals: ['Pasta', 'Salad'],
        shopping_list: { produce: ['tomatoes'] },
      }

      const mockResponse = {
        success: true,
        data: { meal_plan: { id: 'plan-1', ...dataWithOptional } },
      }

      ;(apiClient.post as jest.Mock).mockResolvedValue(mockResponse)

      await createMealPlan(dataWithOptional)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/providers/meal-plans',
        dataWithOptional
      )
    })

    it('should handle validation errors (missing required fields)', async () => {
      const invalidData = { title: 'Test' } // Missing required fields

      const mockResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: [
            { field: 'description', message: 'Required' },
            { field: 'duration_days', message: 'Required' },
          ],
        },
      }

      ;(apiClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await createMealPlan(invalidData as any)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error?.code).toBe('VALIDATION_ERROR')
      }
    })

    it('should handle API errors', async () => {
      const mockError = new Error('Server error')
      ;(apiClient.post as jest.Mock).mockRejectedValue(mockError)

      await expect(createMealPlan(validPlanData)).rejects.toThrow(
        'Server error'
      )
    })
  })

  describe('updateMealPlan', () => {
    it('should update meal plan', async () => {
      const updateData = {
        title: 'Updated Title',
        base_price: 30.0,
      }

      const mockResponse = {
        success: true,
        data: {
          meal_plan: {
            id: 'plan-1',
            ...updateData,
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMealPlan('plan-1', updateData)

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/providers/meal-plans/plan-1',
        updateData
      )
      expect(result.success).toBe(true)
    })

    it('should handle 404 for non-existent meal plan', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Meal plan not found',
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMealPlan('non-existent', { title: 'Test' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error?.code).toBe('NOT_FOUND')
      }
    })

    it('should handle 403 for unauthorized access', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized',
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMealPlan('plan-1', { title: 'Test' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error?.code).toBe('FORBIDDEN')
      }
    })
  })

  describe('updateMealPlanStatus', () => {
    it('should publish meal plan', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plan: {
            id: 'plan-1',
            is_published: true,
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateMealPlanStatus('plan-1', true)

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/providers/meal-plans/plan-1',
        { is_published: true }
      )
      expect(result.success).toBe(true)
    })

    it('should unpublish meal plan', async () => {
      const mockResponse = {
        success: true,
        data: {
          meal_plan: {
            id: 'plan-1',
            is_published: false,
          },
        },
      }

      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockResponse)

      await updateMealPlanStatus('plan-1', false)

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/providers/meal-plans/plan-1',
        { is_published: false }
      )
    })
  })

  describe('deleteMealPlan', () => {
    it('should delete meal plan', async () => {
      const mockResponse = {
        success: true,
        data: null,
      }

      ;(apiClient.delete as jest.Mock).mockResolvedValue(mockResponse)

      const result = await deleteMealPlan('plan-1')

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/providers/meal-plans/plan-1'
      )
      expect(result.success).toBe(true)
    })

    it('should handle errors', async () => {
      const mockError = new Error('Cannot delete published plan')
      ;(apiClient.delete as jest.Mock).mockRejectedValue(mockError)

      await expect(deleteMealPlan('plan-1')).rejects.toThrow(
        'Cannot delete published plan'
      )
    })
  })
})
```

**Expected Function Signatures**:

```typescript
// lib/api/provider.ts

export interface CreateMealPlanRequest {
  title: string
  description: string
  duration_days: number
  duration_type: string
  base_price: number
  category: string
  dietary_tags: string[]
  difficulty_level: string
  recipes: any[]
  preview_meals?: string[]
  shopping_list?: any
}

export interface UpdateMealPlanRequest {
  title?: string
  description?: string
  base_price?: number
  category?: string
  dietary_tags?: string[]
  difficulty_level?: string
  recipes?: any[]
  preview_meals?: string[]
  shopping_list?: any
}

export async function getProviderDashboard(): Promise<
  APIResponse<ApiProviderDashboard>
>

export async function createMealPlan(
  data: CreateMealPlanRequest
): Promise<APIResponse<{ meal_plan: ApiMealPlan }>>

export async function updateMealPlan(
  id: string,
  data: UpdateMealPlanRequest
): Promise<APIResponse<{ meal_plan: ApiMealPlan }>>

export async function updateMealPlanStatus(
  id: string,
  is_published: boolean
): Promise<APIResponse<{ meal_plan: ApiMealPlan }>>

export async function deleteMealPlan(id: string): Promise<APIResponse<null>>
```

### 2.2-2.4: Hooks and Component Tests

(Due to length, these follow the same TDD pattern as Phase 1. Full specifications available upon request.)

---

## Test Execution Plan

### Phase 1: Meal Plans
1. Create all test files (5 files)
2. Run `npm run typecheck` → expect errors (files don't exist yet)
3. Create implementation files with minimal structure
4. Run `npm run typecheck` → expect 0 errors
5. Run tests → expect failures
6. Implement functionality
7. Run tests → expect all passing
8. Run `npm run typecheck` → confirm 0 errors

### Phase 2: Provider Dashboard
(Repeat same process)

---

## Success Metrics

- **Test Coverage**: >90% for all new code
- **TypeScript**: 0 errors
- **All Tests**: 100% passing
- **Integration**: All components use real API data
- **Error Handling**: All error states tested and handled
- **Performance**: No console warnings/errors

---

**Document Version**: 1.0
**Last Updated**: 2025-10-09
**Status**: Ready for Implementation
