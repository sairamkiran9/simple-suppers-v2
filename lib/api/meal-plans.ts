/**
 * Meal Plans API Module
 *
 * Provides functions for meal plan-related API operations:
 * - Fetching all meal plans with optional filters
 * - Fetching detailed meal plan information by ID
 */

import { apiClient } from '@/lib/api-client'
import type {
  ApiMealPlan,
  ApiMealPlanDetail,
  APIResponse,
} from '@/lib/api-types'

/**
 * Query parameters for fetching meal plans
 */
export interface GetMealPlansParams {
  /** Filter by meal plan category (e.g., 'family', 'quick', 'budget') */
  category?: string
  /** Filter by dietary tag (e.g., 'vegetarian', 'vegan', 'gluten-free') */
  dietary_tag?: string
  /** Filter by difficulty level (e.g., 'easy', 'medium', 'hard') */
  difficulty?: string
  /** Search query for meal plan title or description */
  search?: string
  /** Minimum price filter */
  min_price?: number
  /** Maximum price filter */
  max_price?: number
  /** Filter for free plans only */
  is_free?: boolean
  /** Filter for featured plans only */
  is_featured?: boolean
  /** Sort order: 'price_asc', 'price_desc', 'rating', 'newest' */
  sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'newest'
  /** Page number for pagination (1-based) */
  page?: number
  /** Number of items per page */
  limit?: number
}

/**
 * Fetches meal plans with optional filtering, sorting, and pagination
 *
 * @param params - Optional query parameters for filtering and pagination
 * @returns Promise containing meal plans array and total count
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * // Fetch all meal plans
 * const response = await getMealPlans()
 *
 * // Fetch vegetarian family plans
 * const response = await getMealPlans({
 *   category: 'family',
 *   dietary_tag: 'vegetarian'
 * })
 *
 * // Fetch with pagination
 * const response = await getMealPlans({
 *   page: 2,
 *   limit: 10,
 *   sort_by: 'price_asc'
 * })
 * ```
 */
export async function getMealPlans(
  params?: GetMealPlansParams
): Promise<APIResponse<{ meal_plans: ApiMealPlan[]; total: number }>> {
  return await apiClient.get<{ meal_plans: ApiMealPlan[]; total: number }>(
    '/meal-plans',
    params
  )
}

/**
 * Fetches detailed information for a specific meal plan by ID
 *
 * @param id - The unique identifier of the meal plan
 * @returns Promise containing detailed meal plan data
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const response = await getMealPlanDetail('plan-123')
 * if (response.success) {
 *   console.log(response.data.title)
 *   console.log(response.data.provider.name)
 *   console.log(response.data.preview_meals)
 * }
 * ```
 */
export async function getMealPlanDetail(
  id: string
): Promise<APIResponse<ApiMealPlanDetail>> {
  return await apiClient.get<ApiMealPlanDetail>(`/meal-plans/${id}`)
}
