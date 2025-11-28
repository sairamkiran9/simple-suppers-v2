/**
 * Authentication API Client
 * Handles login, registration, and user session management
 */

import { apiClient } from '../api-client'
import type { APIResponse } from './errors'

// ============================================================================
// Types
// ============================================================================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  user_type: 'user' | 'provider'
}

export interface AuthUser {
  id: string
  email: string
  name: string
  user_type: 'user' | 'provider'
  subscription_tier: string
  is_creator?: boolean
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

// ============================================================================
// Local Storage Keys
// ============================================================================

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'

// ============================================================================
// API Functions
// ============================================================================

/**
 * Login with email and password
 */
export async function login(credentials: LoginRequest): Promise<APIResponse<AuthResponse>> {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials)

  // Store token and user data on successful login
  if (response.success && response.data) {
    setStoredUser(response.data.user, response.data.token)
  }

  return response
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<APIResponse<AuthResponse>> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data)

  // Store token and user data on successful registration
  if (response.success && response.data) {
    setStoredUser(response.data.user, response.data.token)
  }

  return response
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  clearStoredUser()
}

// ============================================================================
// Local Storage Utilities
// ============================================================================

/**
 * Get the stored user from localStorage
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null

  try {
    const userJson = localStorage.getItem(AUTH_USER_KEY)
    if (!userJson) return null

    return JSON.parse(userJson) as AuthUser
  } catch (error) {
    console.error('Error reading stored user:', error)
    return null
  }
}

/**
 * Get the stored auth token from localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

/**
 * Store user data and token in localStorage
 */
export function setStoredUser(user: AuthUser, token: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch (error) {
    console.error('Error storing user data:', error)
  }
}

/**
 * Clear stored user data and token
 */
export function clearStoredUser(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getStoredToken() !== null && getStoredUser() !== null
}

/**
 * Check if user has specific user type
 */
export function hasUserType(userType: 'user' | 'provider'): boolean {
  const user = getStoredUser()
  return user?.user_type === userType
}
