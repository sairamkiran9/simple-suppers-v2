/**
 * useFeedPosts Hook - React Query Infinite Query Version
 *
 * Manages fetching and caching feed posts with pagination/infinite scroll
 * Uses React Query's useInfiniteQuery for optimal infinite scroll performance
 */

import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeedPosts } from '@/lib/api/feed.client'
import type { FeedPostWithAuthor } from '@/lib/database-types'

interface UseFeedPostsReturn {
  /** All loaded posts (flattened from all pages) */
  posts: FeedPostWithAuthor[]
  /** Loading state for initial fetch */
  loading: boolean
  /** Loading state for loading more pages */
  loadingMore: boolean
  /** Error object if fetch fails */
  error: Error | null
  /** Whether there are more pages to load */
  hasMore: boolean
  /** Function to load the next page */
  loadMore: () => void
  /** Function to refresh all data */
  refresh: () => void
}

/**
 * Hook for fetching feed posts with infinite scroll capability
 *
 * Benefits over manual pagination:
 * - Automatic caching per page
 * - Optimistic loading states
 * - Background refetching
 * - Request deduplication
 *
 * @returns Object containing posts, loading states, and pagination controls
 *
 * @example
 * ```tsx
 * const { posts, loading, hasMore, loadMore, refresh } = useFeedPosts()
 *
 * if (loading) return <div>Loading...</div>
 * return (
 *   <>
 *     {posts.map(post => <FeedPost key={post.id} post={post} />)}
 *     {hasMore && <button onClick={loadMore}>Load More</button>}
 *     <button onClick={refresh}>Refresh</button>
 *   </>
 * )
 * ```
 */
export function useFeedPosts(): UseFeedPostsReturn {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    // Query key for caching
    queryKey: ['feed-posts'],

    // Query function with page parameter
    queryFn: async ({ pageParam = 0 }) => {
      const result = await getFeedPosts(pageParam, 20)
      return {
        posts: result.posts,
        hasMore: result.hasMore,
        nextPage: pageParam + 1,
      }
    },

    // Get the next page parameter
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined
    },

    // Initial page parameter
    initialPageParam: 0,

    // Cache configuration - shorter for dynamic feed content
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes

    // Don't refetch on window focus for feed
    refetchOnWindowFocus: false,

    // Retry once on failure
    retry: 1,
  })

  // Flatten all pages into single array of posts
  const posts = data?.pages.flatMap((page) => page.posts) ?? []

  return {
    posts,
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    error,
    hasMore: hasNextPage ?? false,
    loadMore: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    refresh: () => {
      refetch()
    },
  }
}
