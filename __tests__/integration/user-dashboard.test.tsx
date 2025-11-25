/**
 * Integration Tests for User Dashboard
 *
 * Tests the full flow from Dashboard component through hooks to API
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '@/components/Dashboard'
import { apiClient } from '@/lib/api-client'

// Mock the apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('User Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Dashboard Loading and Display', () => {
    it('should load and display dashboard data', async () => {
      const mockDashboardData = {
        success: true,
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            subscription_tier: 'freemium',
            free_plans_used: 1,
          },
          overview: {
            total_purchases: 5,
            active_plans: 2,
            free_plans_remaining: 2,
          },
          purchased_plans: [
            {
              id: 'plan-1',
              title: 'Weekly Meal Plan',
              provider_name: 'Healthy Kitchen',
              purchase_date: '2024-01-01T00:00:00Z',
              purchase_price: 25.0,
            },
          ],
          free_plans: [
            {
              id: 'free-1',
              title: 'Free Starter Plan',
              provider_name: 'Quick Meals',
            },
          ],
          total_spent: 125.0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockDashboardData)

      render(<Dashboard />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText(/weekly meal plan/i)).toBeInTheDocument()
      })

      // Verify stats are displayed
      expect(screen.getByText('5')).toBeInTheDocument() // Total purchases
      expect(screen.getByText('2')).toBeInTheDocument() // Active plans
      expect(screen.getByText('$125.00')).toBeInTheDocument() // Total spent

      // Verify purchased plan details
      expect(screen.getByText(/weekly meal plan/i)).toBeInTheDocument()
      expect(screen.getByText(/healthy kitchen/i)).toBeInTheDocument()
      expect(screen.getByText(/\$25\.00/i)).toBeInTheDocument()

      // Verify free plan is listed
      expect(screen.getByText(/free starter plan/i)).toBeInTheDocument()
      expect(screen.getByText(/quick meals/i)).toBeInTheDocument()
    })

    it('should display empty state when no purchases', async () => {
      const mockDashboardData = {
        success: true,
        data: {
          user: {
            name: 'New User',
            email: 'new@example.com',
            subscription_tier: 'freemium',
            free_plans_used: 0,
          },
          overview: {
            total_purchases: 0,
            active_plans: 0,
            free_plans_remaining: 3,
          },
          purchased_plans: [],
          free_plans: [],
          total_spent: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockDashboardData)

      render(<Dashboard />)

      await waitFor(() => {
        expect(
          screen.getByText(/you haven't purchased any meal plans yet/i)
        ).toBeInTheDocument()
      })

      expect(screen.getByText('$0.00')).toBeInTheDocument()
    })

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error')
      ;(apiClient.get as jest.Mock).mockRejectedValue(mockError)

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/network error/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })
  })

  describe('Profile Editing Flow', () => {
    it('should switch to profile tab and display form', async () => {
      const user = userEvent.setup()

      const mockDashboardData = {
        success: true,
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
            subscription_tier: 'freemium',
            free_plans_used: 0,
          },
          purchased_plans: [],
          free_plans: [],
          total_spent: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockDashboardData)

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument()
      })

      // Click profile tab
      const profileTab = screen.getByRole('tab', { name: /profile/i })
      await user.click(profileTab)

      // Verify profile form is displayed
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    it('should update profile and refresh dashboard', async () => {
      const user = userEvent.setup()

      const mockDashboardData = {
        success: true,
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
            subscription_tier: 'freemium',
            free_plans_used: 0,
          },
          purchased_plans: [],
          free_plans: [],
          total_spent: 0,
        },
      }

      const mockUpdateResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            name: 'Updated Name',
            email: 'test@example.com',
            user_type: 'user',
            subscription_tier: 'freemium',
            dietary_preferences: ['vegetarian'],
            is_active: true,
          },
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockDashboardData)
      ;(apiClient.patch as jest.Mock).mockResolvedValue(mockUpdateResponse)

      render(<Dashboard />)

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument()
      })

      // Switch to profile tab
      const profileTab = screen.getByRole('tab', { name: /profile/i })
      await user.click(profileTab)

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      // Update name
      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      // Select dietary preference
      const vegetarianCheckbox = screen.getByLabelText(/vegetarian/i)
      await user.click(vegetarianCheckbox)

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      // Verify API was called
      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalledWith('/user/profile', {
          name: 'Updated Name',
          dietary_preferences: expect.arrayContaining(['vegetarian']),
        })
      })

      // Verify success callback triggers dashboard refetch
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2) // Initial + refetch
      })
    })

    it('should handle profile update errors', async () => {
      const user = userEvent.setup()

      const mockDashboardData = {
        success: true,
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
            subscription_tier: 'freemium',
            free_plans_used: 0,
          },
          purchased_plans: [],
          free_plans: [],
          total_spent: 0,
        },
      }

      ;(apiClient.get as jest.Mock).mockResolvedValue(mockDashboardData)
      ;(apiClient.patch as jest.Mock).mockRejectedValue(
        new Error('Validation failed')
      )

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument()
      })

      // Switch to profile
      const profileTab = screen.getByRole('tab', { name: /profile/i })
      await user.click(profileTab)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      // Try to submit with invalid data
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Refetch', () => {
    it('should refetch dashboard data on retry', async () => {
      const user = userEvent.setup()

      const mockError = new Error('Network error')
      ;(apiClient.get as jest.Mock).mockRejectedValueOnce(mockError)

      render(<Dashboard />)

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
      })

      // Mock successful response for retry
      const mockDashboardData = {
        success: true,
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com',
            subscription_tier: 'freemium',
            free_plans_used: 0,
          },
          purchased_plans: [],
          free_plans: [],
          total_spent: 0,
        },
      }
      ;(apiClient.get as jest.Mock).mockResolvedValue(mockDashboardData)

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)

      // Verify data loads successfully
      await waitFor(() => {
        expect(screen.getByText(/manage your meal plans/i)).toBeInTheDocument()
      })
    })
  })
})
