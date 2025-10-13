/**
 * User API Module
 *
 * Provides functions for user-related API operations:
 * - Fetching user dashboard data
 * - Updating user profile
 * - Creating instant purchases
 */

import { apiClient } from '@/lib/api-client'
import type {
  ApiUserDashboard,
  UpdateUserProfileRequest,
  ApiUser,
  APIResponse,
} from '@/lib/api-types'

/**
 * Fetches the current user's dashboard data
 * Includes purchased plans, free plans, and usage statistics
 *
 * @returns Promise containing dashboard data
 * @throws Error if the request fails
 */
export async function getUserDashboard(): Promise<APIResponse<ApiUserDashboard>> {
  return await apiClient.get<ApiUserDashboard>('/user/dashboard')
}

/**
 * Updates the current user's profile
 * Supports updating name and dietary preferences
 *
 * @param data - Profile update data
 * @returns Promise containing updated user data
 * @throws Error if validation fails or request fails
 */
export async function updateUserProfile(
  data: UpdateUserProfileRequest
): Promise<APIResponse<{ user: ApiUser }>> {
  return await apiClient.patch<{ user: ApiUser }>('/user/profile', data)
}

/**
 * Creates an instant purchase for a meal plan
 * Bypasses payment processing and directly creates purchase record
 *
 * @param mealPlanId - ID of the meal plan to purchase
 * @returns Promise containing purchase confirmation
 * @throws Error if purchase fails
 */
export async function createInstantPurchase(
  mealPlanId: string
): Promise<APIResponse<{
  purchase_id: string
  meal_plan_id: string
  meal_plan_title: string
  purchase_price: number
  access_granted: boolean
  message: string
}>> {
  return await apiClient.post('/purchases/instant', { meal_plan_id: mealPlanId })
}

/**
 * Cancels an active subscription
 * Sets is_active to false for the purchase
 *
 * @param purchaseId - ID of the purchase to cancel
 * @returns Promise containing cancellation confirmation
 * @throws Error if cancellation fails
 */
export async function cancelSubscription(
  purchaseId: string
): Promise<APIResponse<{
  message: string
  purchase_id: string
  is_active: boolean
}>> {
  return await apiClient.post(`/purchases/${purchaseId}/cancel`, {})
}
