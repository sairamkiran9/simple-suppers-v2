import { NextRequest, NextResponse } from 'next/server'
import { getFeedPosts, createFeedPost } from '@/lib/api/feed'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Get user ID from auth header if present
    const authHeader = request.headers.get('authorization')
    let userId: string | undefined
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id
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
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}