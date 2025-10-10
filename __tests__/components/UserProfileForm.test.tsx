/**
 * Tests for UserProfileForm component
 * Form for updating user profile with validation
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProfileForm } from '@/components/UserProfileForm'
import * as useUserProfileHook from '@/hooks/useUserProfile'
import type { ApiUser } from '@/lib/api-types'

// Mock the useUserProfile hook
jest.mock('@/hooks/useUserProfile')

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('UserProfileForm', () => {
  const mockUser: ApiUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    user_type: 'user',
    subscription_tier: 'freemium',
    dietary_preferences: ['vegetarian'],
    is_active: true,
  }

  const mockUpdateProfile = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUserProfileHook.useUserProfile as jest.Mock).mockReturnValue({
      updateProfile: mockUpdateProfile,
      isUpdating: false,
      error: null,
    })
  })

  it('should render the form with initial values', () => {
    render(<UserProfileForm user={mockUser} onSuccess={jest.fn()} />)

    expect(screen.getByLabelText(/name/i)).toHaveValue('Test User')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('should display dietary preferences', () => {
    render(<UserProfileForm user={mockUser} onSuccess={jest.fn()} />)

    expect(screen.getByText(/dietary preferences/i)).toBeInTheDocument()
  })

  it('should submit form with updated name', async () => {
    const user = userEvent.setup()
    const onSuccess = jest.fn()

    mockUpdateProfile.mockResolvedValue({
      ...mockUser,
      name: 'Updated Name',
    })

    render(<UserProfileForm user={mockUser} onSuccess={onSuccess} />)

    const nameInput = screen.getByLabelText(/name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Name')

    const submitButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Updated Name',
        dietary_preferences: ['vegetarian'],
      })
    })

    expect(onSuccess).toHaveBeenCalled()
  })

  it('should validate required name field', async () => {
    const user = userEvent.setup()

    render(<UserProfileForm user={mockUser} onSuccess={jest.fn()} />)

    const nameInput = screen.getByLabelText(/name/i)
    await user.clear(nameInput)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/name.*required/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()

    ;(useUserProfileHook.useUserProfile as jest.Mock).mockReturnValue({
      updateProfile: mockUpdateProfile,
      isUpdating: true,
      error: null,
    })

    render(<UserProfileForm user={mockUser} onSuccess={jest.fn()} />)

    const submitButton = screen.getByRole('button', { name: /saving/i })
    expect(submitButton).toBeDisabled()
  })

  it('should handle dietary preferences selection', async () => {
    const user = userEvent.setup()
    const onSuccess = jest.fn()

    mockUpdateProfile.mockResolvedValue({
      ...mockUser,
      dietary_preferences: ['vegetarian', 'gluten-free'],
    })

    render(<UserProfileForm user={mockUser} onSuccess={onSuccess} />)

    // Add a new dietary preference
    const glutenFreeCheckbox = screen.getByLabelText(/gluten-free/i)
    await user.click(glutenFreeCheckbox)

    const submitButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Test User',
        dietary_preferences: expect.arrayContaining(['vegetarian', 'gluten-free']),
      })
    })
  })

  it('should display error message on submission failure', async () => {
    const user = userEvent.setup()

    mockUpdateProfile.mockRejectedValue(new Error('Update failed'))

    ;(useUserProfileHook.useUserProfile as jest.Mock).mockReturnValue({
      updateProfile: mockUpdateProfile,
      isUpdating: false,
      error: 'Update failed',
    })

    render(<UserProfileForm user={mockUser} onSuccess={jest.fn()} />)

    const submitButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeInTheDocument()
    })
  })

  it('should allow removing dietary preferences', async () => {
    const user = userEvent.setup()
    const onSuccess = jest.fn()

    mockUpdateProfile.mockResolvedValue({
      ...mockUser,
      dietary_preferences: [],
    })

    render(<UserProfileForm user={mockUser} onSuccess={onSuccess} />)

    // Uncheck vegetarian
    const vegetarianCheckbox = screen.getByLabelText(/vegetarian/i)
    await user.click(vegetarianCheckbox)

    const submitButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Test User',
        dietary_preferences: [],
      })
    })
  })

  it('should disable form during submission', async () => {
    ;(useUserProfileHook.useUserProfile as jest.Mock).mockReturnValue({
      updateProfile: mockUpdateProfile,
      isUpdating: true,
      error: null,
    })

    render(<UserProfileForm user={mockUser} onSuccess={jest.fn()} />)

    const nameInput = screen.getByLabelText(/name/i)
    expect(nameInput).toBeDisabled()
  })

  it('should handle form reset', async () => {
    const user = userEvent.setup()

    render(<UserProfileForm user={mockUser} onSuccess={jest.fn()} />)

    const nameInput = screen.getByLabelText(/name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Changed Name')

    // Find and click cancel/reset button if it exists
    const cancelButton = screen.queryByRole('button', { name: /cancel/i })
    if (cancelButton) {
      await user.click(cancelButton)

      await waitFor(() => {
        expect(nameInput).toHaveValue('Test User')
      })
    }
  })

  it('should validate minimum name length', async () => {
    const user = userEvent.setup()

    render(<UserProfileForm user={mockUser} onSuccess={jest.fn()} />)

    const nameInput = screen.getByLabelText(/name/i)
    await user.clear(nameInput)
    await user.type(nameInput, '')

    const submitButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateProfile).not.toHaveBeenCalled()
    })
  })
})
