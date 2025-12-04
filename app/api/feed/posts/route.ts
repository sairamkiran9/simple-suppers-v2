import { NextRequest, NextResponse } from 'next/server'
import { getFeedPosts, createFeedPost } from '@/lib/api/feed.server'
import { verifyToken } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get user ID from auth header if present (optional for feed)
    let userId: string | undefined
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const payload = verifyToken(token)
        userId = payload.id
      } catch {
        // Invalid token, continue without user ID
        userId = undefined
      }
    }

    const result = await getFeedPosts(page, limit, userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Feed posts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, content, post_type, image_url, related_meal_plan_id, tags } = body

    if (!title || !content || !post_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const post = await createFeedPost({
      title,
      content,
      post_type,
      image_url,
      related_meal_plan_id,
      tags
    }, userId)

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}