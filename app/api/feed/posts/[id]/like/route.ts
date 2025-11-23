import { NextRequest, NextResponse } from 'next/server'
import { togglePostLike } from '@/lib/api/feed'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await togglePostLike(params.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Toggle like error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}