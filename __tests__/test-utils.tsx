/**
 * Shared test utilities for React Query hooks
 *
 * This file provides standardized configuration for React Query testing,
 * including QueryClient setup, wrapper components, mock data factories,
 * and test helper functions.
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'

/**
 * Create a test QueryClient with standardized configuration
 *
 * Configuration:
 * - retry: false - No retries for fast tests
 * - retryOnMount: false - Match production, prevent double fetches
 * - gcTime: 0 - Immediate cleanup (React Query v5)
 * - staleTime: 0 - Always consider data stale
 * - Silent logger to reduce test noise
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        retryOnMount: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Wrapper component type with cleanup method
 */
type QueryWrapperWithCleanup = (({ children }: { children: React.ReactNode }) => React.JSX.Element) & {
  cleanup: () => void
}

/**
 * Creates a wrapper component with QueryClientProvider
 *
 * Each call creates a fresh QueryClient instance, ensuring test isolation.
 * Use this for most tests where you need a simple QueryClientProvider wrapper.
 *
 * IMPORTANT: Call this in beforeEach to get a fresh wrapper for each test.
 */
export function createQueryWrapper(): QueryWrapperWithCleanup {
  const queryClient = createTestQueryClient()

  const wrapper = function QueryWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  } as QueryWrapperWithCleanup

  // Attach cleanup method
  wrapper.cleanup = () => queryClient.clear()

  return wrapper
}

/**
 * Setup helper for tests that need shared QueryClient with explicit cleanup
 *
 * Usage:
 * ```typescript
 * const getQueryClient = setupTestQueryClient()
 *
 * test('my test', () => {
 *   const queryClient = getQueryClient()
 *   // use queryClient
 * })
 * ```
 */
export function setupTestQueryClient() {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
  })

  afterEach(() => {
    queryClient.clear() // Explicit cache cleanup
  })

  return () => queryClient
}

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Create mock user data for testing
 */
export function createMockUser(overrides: Partial<{
  id: string
  email: string
  name: string
}> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  }
}

/**
 * Create mock meal plan data for testing
 */
export function createMockMealPlan(overrides: Partial<{
  id: string
  title: string
  description: string
  price: number
  is_published: boolean
  is_active: boolean
  is_deleted: boolean
  creator_id: string
  created_at: string
  updated_at: string
}> = {}) {
  return {
    id: 'meal-plan-123',
    title: 'Test Meal Plan',
    description: 'Test description',
    price: 9.99,
    is_published: true,
    is_active: true,
    is_deleted: false,
    creator_id: 'creator-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock creator/provider data for testing
 */
export function createMockCreator(overrides: Partial<{
  id: string
  name: string
  bio: string
  avatar_url: string
}> = {}) {
  return {
    id: 'creator-123',
    name: 'Test Creator',
    bio: 'Test bio',
    avatar_url: 'https://example.com/avatar.jpg',
    ...overrides,
  }
}

/**
 * Create mock feed post data for testing
 */
export function createMockPost(overrides: Partial<{
  id: string
  content: string
  creator_id: string
  image_url: string
  created_at: string
}> = {}) {
  return {
    id: 'post-123',
    content: 'Test post content',
    creator_id: 'creator-123',
    image_url: 'https://example.com/post.jpg',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock comment data for testing
 */
export function createMockComment(overrides: Partial<{
  id: string
  content: string
  post_id: string
  user_id: string
  created_at: string
}> = {}) {
  return {
    id: 'comment-123',
    content: 'Test comment',
    post_id: 'post-123',
    user_id: 'user-123',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// ============================================================================
// React Query Test Helpers
// ============================================================================

/**
 * Wait for a React Query query to succeed
 *
 * @param result - The result from renderHook
 * @param timeout - Maximum time to wait (default: 3000ms)
 */
export async function waitForQuerySuccess(result: any, timeout = 3000) {
  await waitFor(
    () => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.error).toBeNull()
    },
    { timeout }
  )
}

/**
 * Wait for a React Query query to error
 *
 * @param result - The result from renderHook
 * @param timeout - Maximum time to wait (default: 3000ms)
 */
export async function waitForQueryError(result: any, timeout = 3000) {
  await waitFor(
    () => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeTruthy()
    },
    { timeout }
  )
}

/**
 * Wait for a React Query mutation to succeed
 *
 * @param result - The result from renderHook
 * @param timeout - Maximum time to wait (default: 3000ms)
 */
export async function waitForMutationSuccess(result: any, timeout = 3000) {
  await waitFor(
    () => {
      expect(result.current.isPending).toBe(false)
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.error).toBeNull()
    },
    { timeout }
  )
}

/**
 * Wait for a React Query mutation to error
 *
 * @param result - The result from renderHook
 * @param timeout - Maximum time to wait (default: 3000ms)
 */
export async function waitForMutationError(result: any, timeout = 3000) {
  await waitFor(
    () => {
      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeTruthy()
    },
    { timeout }
  )
}
