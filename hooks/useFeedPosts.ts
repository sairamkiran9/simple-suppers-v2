import { useState, useEffect } from 'react'
import { getFeedPosts } from '@/lib/api/feed.client'
import type { FeedPostWithAuthor } from '@/lib/database-types'

export function useFeedPosts() {
  const [posts, setPosts] = useState<FeedPostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const loadPosts = async (pageNum = 0, append = false) => {
    try {
      setLoading(true)
      const result = await getFeedPosts(pageNum, 20)
      
      if (append) {
        setPosts(prev => [...prev, ...result.posts])
      } else {
        setPosts(result.posts)
      }
      
      setHasMore(result.hasMore)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1, true)
    }
  }

  const refresh = () => {
    loadPosts(0, false)
  }

  useEffect(() => {
    loadPosts()
  }, [])

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  }
}