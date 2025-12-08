/**
 * Creator API Module
 *
 * Provides functions for creator-related API operations:
 * - Fetching creator dashboard data
 * - Managing creator meal plans (CRUD operations)
 * - Updating creator profile
 * - Enabling creator mode
 */

import { apiClient } from '@/lib/api-client'
import type {
  ApiCreatorDashboard,
  ApiCreatorProfile,
  UpdateCreatorProfileRequest,
  APIResponse,
} from '@/lib/api-types'

/**
 * Type for meal plan data in creator context
 * Matches the database schema and API response
 */
export interface ApiCreatorMealPlan {
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
 * Request body for enabling creator mode
 */
export interface EnableCreatorModeData {
  creator_display_name: string
  bio: string
  profile_image_url?: string
}

/**
 * Fetches the creator's dashboard data including analytics and top plans
 *
 * @returns Promise containing dashboard data with creator info, analytics, recent purchases, and top performing plans
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const response = await getCreatorDashboard()
 * if (response.success && response.data) {
 *   console.log(response.data.creator.creator_display_name)
 *   console.log(response.data.analytics.total_meal_plans)
 * }
 * ```
 */
export async function getCreatorDashboard(): Promise<APIResponse<ApiCreatorDashboard>> {
  return await apiClient.get<ApiCreatorDashboard>('/creators/dashboard')
}

/**
 * Fetches all meal plans belonging to the authenticated creator
 *
 * @returns Promise containing array of creator's meal plans
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const response = await getCreatorMealPlans()
 * if (response.success && response.data) {
 *   console.log(`Found ${response.data.meal_plans.length} meal plans`)
 * }
 * ```
 */
export async function getCreatorMealPlans(): Promise<
  APIResponse<{ meal_plans: ApiCreatorMealPlan[] }>
> {
  return await apiClient.get<{ meal_plans: ApiCreatorMealPlan[] }>('/creators/meal-plans')
}

/**
 * Creates a new meal plan for the creator
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
): Promise<APIResponse<{ meal_plan: ApiCreatorMealPlan }>> {
  return await apiClient.post<{ meal_plan: ApiCreatorMealPlan }>(
    '/creators/meal-plans',
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
): Promise<APIResponse<{ meal_plan: ApiCreatorMealPlan }>> {
  return await apiClient.patch<{ meal_plan: ApiCreatorMealPlan }>(
    `/creators/meal-plans/${id}`,
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
    `/creators/meal-plans/${id}`
  )
}

/**
 * Updates the creator's profile
 *
 * @param data - Profile update data
 * @returns Promise containing updated creator profile
 * @throws Error if validation fails or request fails
 *
 * @example
 * ```typescript
 * const response = await updateCreatorProfile({
 *   creator_display_name: 'Healthy Meal Co.',
 *   bio: 'We create nutritious family-friendly meals'
 * })
 * ```
 */
export async function updateCreatorProfile(
  data: UpdateCreatorProfileRequest
): Promise<APIResponse<{ creator: ApiCreatorProfile }>> {
  return await apiClient.patch<{ creator: ApiCreatorProfile }>(
    '/creators/profile',
    data
  )
}

/**
 * Fetches the creator's profile
 *
 * @returns Promise containing creator profile data
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const response = await getCreatorProfile()
 * if (response.success && response.data) {
 *   console.log(response.data.creator_display_name)
 *   console.log(response.data.total_earnings)
 * }
 * ```
 */
export async function getCreatorProfile(): Promise<APIResponse<ApiCreatorProfile>> {
  return await apiClient.get<ApiCreatorProfile>('/creators/profile')
}

/**
 * Enables creator mode for the authenticated user
 *
 * @param data - Creator mode data (display name, bio, profile image)
 * @returns Promise containing the created creator profile
 * @throws Error if validation fails or user already is a creator
 *
 * @example
 * ```typescript
 * const response = await enableCreatorMode({
 *   creator_display_name: 'Chef Jamie',
 *   bio: 'Professional chef with 10 years of experience creating healthy, delicious meals for families.',
 *   profile_image_url: 'https://example.com/avatar.jpg'
 * })
 * ```
 */
export async function enableCreatorMode(
  data: EnableCreatorModeData
): Promise<APIResponse<{ creator: ApiCreatorProfile; message: string }>> {
  return await apiClient.post<{ creator: ApiCreatorProfile; message: string }>(
    '/user/enable-creator-mode',
    data
  )
}
