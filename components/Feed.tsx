'use client'

import { useState } from 'react'
import { useFeedPosts } from '@/hooks/useFeedPosts'
import { FeedPost } from './FeedPost'
import { CreatePostModal } from './CreatePostModal'
import { Button } from './ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function Feed() {
  const { posts, loading, error, hasMore, loadMore, refresh } = useFeedPosts()
  const { user } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post Button */}
      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Share something with the community
          </Button>
        </div>
      )}

      {/* Feed Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No posts yet. Be the first to share something!
          </p>
          {user && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          )}
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <FeedPost key={post.id} post={post} />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-4">
              <Button 
                onClick={loadMore} 
                variant="outline"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Post Modal */}
      <CreatePostModal 
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={refresh}
      />
    </div>
  )
}