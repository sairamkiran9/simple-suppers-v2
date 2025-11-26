import { useState } from 'react'
import { createFeedPost } from '@/lib/api/feed.client'
import type { FeedPost } from '@/lib/database-types'

export function useCreateFeedPost() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPost = async (postData: {
    title: string
    content: string
    post_type: 'meal_plan' | 'recipe_tip' | 'announcement'
    image_url?: string
    related_meal_plan_id?: string
    tags?: string[]
  }): Promise<FeedPost | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const post = await createFeedPost(postData)
      return post
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createPost,
    loading,
    error
  }
}