'use client'

/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getStoredUser,
  clearStoredUser,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
} from './api/auth-client'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = getStoredUser()
    setUser(storedUser)
    setIsLoading(false)
  }, [])

  // Login function
  const login = async (
    credentials: LoginRequest
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiLogin(credentials)

      if (response.success && response.data) {
        setUser(response.data.user)
        toast.success('Successfully logged in!')
        return { success: true }
      }

      return { success: false, error: response.error?.message || 'Login failed' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Register function
  const register = async (
    data: RegisterRequest
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiRegister(data)

      if (response.success && response.data) {
        setUser(response.data.user)
        toast.success('Account created successfully!')
        return { success: true }
      }

      return { success: false, error: response.error?.message || 'Registration failed' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Logout function
  const logout = () => {
    apiLogout()
    setUser(null)
    toast.success('Logged out successfully')
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useAuth hook - Access authentication state and methods
 * Must be used within an AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
