import { NextRequest, NextResponse } from 'next/server'
import { getPostComments, addComment } from '@/lib/api/feed.server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from auth header if present (optional for feed comments)
    let userId: string | undefined
    // Note: Feed comments can be viewed without auth, so userId is optional

    const comments = await getPostComments(params.id, userId)
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const comment = await addComment(params.id, content)
    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Add comment error:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}