/**
 * useShoppingListDownload Hook
 *
 * Handles shopping list generation and download functionality
 * - Generates shopping list via API
 * - Downloads PDF via browser navigation
 * - Shows loading states and toast notifications
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { ApiShoppingListResponse } from '@/lib/api-types'

export function useShoppingListDownload() {
  const [isGenerating, setIsGenerating] = useState(false)

  /**
   * Generate shopping list and trigger download
   *
   * @param mealPlanId - The meal plan ID to generate shopping list for
   * @param planTitle - The meal plan title (used for filename)
   * @returns Promise<boolean> - true if successful, false otherwise
   */
  const generateAndDownload = async (
    mealPlanId: string,
    planTitle: string
  ): Promise<boolean> => {
    setIsGenerating(true)

    try {
      // Step 1: Generate shopping list
      // Note: omitting selected_days (undefined) means all days
      const generateResponse = await apiClient.post<ApiShoppingListResponse>(
        '/shopping-lists/generate',
        {
          meal_plan_id: mealPlanId
          // selected_days is optional - omit it to get all days
        }
      )

      // Check if response is successful and has data
      if (!generateResponse.success || !generateResponse.data) {
        throw new Error('Failed to generate shopping list - no data returned')
      }

      const shoppingListId = generateResponse.data.shopping_list.id

      // Step 2: Download PDF with authentication
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(
        `/api/shopping-lists/${shoppingListId}/download?format=pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to download PDF')
      }

      // Get the PDF blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shopping-list-${shoppingListId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      // Show success message
      toast.success('Shopping list downloaded!')

      return true
    } catch (error) {
      // Handle errors
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to download shopping list'

      toast.error(errorMessage)
      console.error('Shopping list download error:', error)

      return false
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generateAndDownload,
    isGenerating
  }
}
