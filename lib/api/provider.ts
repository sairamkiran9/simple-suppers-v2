/**
 * Provider API Module
 *
 * Provides functions for provider-related API operations:
 * - Fetching provider dashboard data
 * - Managing provider meal plans (CRUD operations)
 * - Updating provider profile
 */

import { apiClient } from '@/lib/api-client'
import type {
  ApiProviderDashboard,
  ApiProviderProfile,
  UpdateProviderProfileRequest,
  APIResponse,
} from '@/lib/api-types'

/**
 * Type for meal plan data in provider context
 * Matches the database schema and API response
 */
export interface ApiProviderMealPlan {
  id: string
  title: string
  description: string
  duration_days: number
  duration_type?: string
  suggested_price?: number
  final_price: number
  category?: string
  dietary_tags?: string[]
  difficulty_level?: string
  is_free?: boolean
  is_published?: boolean
  is_active?: boolean
  is_featured?: boolean
  total_purchases: number
  total_views?: number
  average_rating: number
  rating_count?: number
  created_at?: string
  updated_at?: string
}

/**
 * Request body for creating a new meal plan
 */
export interface CreateMealPlanData {
  title: string
  description: string
  duration_days: number
  duration_type?: string
  category?: string
  dietary_tags?: string[]
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  is_published?: boolean
}

/**
 * Request body for updating an existing meal plan
 * All fields are optional (partial update)
 */
export interface UpdateMealPlanData {
  title?: string
  description?: string
  category?: string
  dietary_tags?: string[]
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  is_published?: boolean
  is_active?: boolean
}

/**
 * Fetches the provider's dashboard data including analytics and top plans
 *
 * @returns Promise containing dashboard data with provider info, analytics, recent purchases, and top performing plans
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const response = await getProviderDashboard()
 * if (response.success && response.data) {
 *   console.log(response.data.provider.business_name)
 *   console.log(response.data.analytics.total_meal_plans)
 * }
 * ```
 */
export async function getProviderDashboard(): Promise<APIResponse<ApiProviderDashboard>> {
  return await apiClient.get<ApiProviderDashboard>('/providers/dashboard')
}

/**
 * Fetches all meal plans belonging to the authenticated provider
 *
 * @returns Promise containing array of provider's meal plans
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const response = await getProviderMealPlans()
 * if (response.success && response.data) {
 *   console.log(`Found ${response.data.meal_plans.length} meal plans`)
 * }
 * ```
 */
export async function getProviderMealPlans(): Promise<
  APIResponse<{ meal_plans: ApiProviderMealPlan[] }>
> {
  return await apiClient.get<{ meal_plans: ApiProviderMealPlan[] }>('/providers/meal-plans')
}

/**
 * Creates a new meal plan for the provider
 *
 * @param data - Meal plan creation data
 * @returns Promise containing the newly created meal plan
 * @throws Error if validation fails or request fails
 *
 * @example
 * ```typescript
 * const response = await createMealPlan({
 *   title: 'Quick Weeknight Dinners',
 *   description: 'Easy meals for busy families',
 *   duration_days: 7,
 *   category: 'family',
 *   difficulty_level: 'beginner'
 * })
 * ```
 */
export async function createMealPlan(
  data: CreateMealPlanData
): Promise<APIResponse<{ meal_plan: ApiProviderMealPlan }>> {
  return await apiClient.post<{ meal_plan: ApiProviderMealPlan }>(
    '/providers/meal-plans',
    data
  )
}

/**
 * Updates an existing meal plan (PATCH endpoint)
 * Supports partial updates - only provided fields will be updated
 *
 * @param id - The meal plan ID
 * @param data - Partial meal plan update data
 * @returns Promise containing the updated meal plan
 * @throws Error if validation fails, meal plan not found, or not authorized
 *
 * @example
 * ```typescript
 * // Update only the title
 * const response = await updateMealPlan('plan-123', {
 *   title: 'Updated Title'
 * })
 *
 * // Publish a meal plan
 * const response = await updateMealPlan('plan-123', {
 *   is_published: true
 * })
 * ```
 */
export async function updateMealPlan(
  id: string,
  data: UpdateMealPlanData
): Promise<APIResponse<{ meal_plan: ApiProviderMealPlan }>> {
  return await apiClient.patch<{ meal_plan: ApiProviderMealPlan }>(
    `/providers/meal-plans/${id}`,
    data
  )
}

/**
 * Deletes a meal plan (soft delete)
 * The meal plan will be marked as deleted but data is preserved
 *
 * @param id - The meal plan ID to delete
 * @returns Promise containing success message
 * @throws Error if meal plan not found or not authorized
 *
 * @example
 * ```typescript
 * const response = await deleteMealPlan('plan-123')
 * if (response.success) {
 *   console.log('Meal plan deleted successfully')
 * }
 * ```
 */
export async function deleteMealPlan(
  id: string
): Promise<APIResponse<{ message: string; meal_plan_id: string }>> {
  return await apiClient.delete<{ message: string; meal_plan_id: string }>(
    `/providers/meal-plans/${id}`
  )
}

/**
 * Updates the provider's profile
 *
 * @param data - Profile update data
 * @returns Promise containing updated provider profile
 * @throws Error if validation fails or request fails
 *
 * @example
 * ```typescript
 * const response = await updateProviderProfile({
 *   business_name: 'Healthy Meal Co.',
 *   bio: 'We create nutritious family-friendly meals'
 * })
 * ```
 */
export async function updateProviderProfile(
  data: UpdateProviderProfileRequest
): Promise<APIResponse<{ provider: ApiProviderProfile }>> {
  return await apiClient.patch<{ provider: ApiProviderProfile }>(
    '/providers/profile',
    data
  )
}

/**
 * Fetches the provider's profile
 *
 * @returns Promise containing provider profile data
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const response = await getProviderProfile()
 * if (response.success && response.data) {
 *   console.log(response.data.business_name)
 *   console.log(response.data.total_earnings)
 * }
 * ```
 */
export async function getProviderProfile(): Promise<APIResponse<ApiProviderProfile>> {
  return await apiClient.get<ApiProviderProfile>('/providers/profile')
}
