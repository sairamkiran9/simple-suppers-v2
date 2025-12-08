import { NextRequest, NextResponse } from 'next/server'
import { deleteFeedPost } from '@/lib/api/feed.server'
import { verifyToken } from '@/lib/api/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify JWT token
    let userId: string
    try {
      const payload = verifyToken(token)
      userId = payload.id
    } catch (authError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const postId = params.id

    await deleteFeedPost(postId, userId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Delete post error:', error)
    
    if (error.message === 'Post not found') {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
