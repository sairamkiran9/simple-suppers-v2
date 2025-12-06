'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

/**
 * React Query Provider Wrapper
 *
 * Provides client-side data caching and state management for the entire app.
 *
 * Configuration:
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - cacheTime: 10 minutes - Unused data stays in cache for 10 minutes
 * - refetchOnWindowFocus: false - Don't refetch when user returns to tab
 * - retry: 1 - Only retry failed requests once
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Consider data fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Don't refetch on window focus (better UX)
            refetchOnWindowFocus: false,
            // Only retry once on failure
            retry: 1,
            // Don't retry on mount
            retryOnMount: false,
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
