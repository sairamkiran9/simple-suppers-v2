/**
 * User API Module
 *
 * Provides functions for user-related API operations:
 * - Fetching user dashboard data
 * - Updating user profile
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
