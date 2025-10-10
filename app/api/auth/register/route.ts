import { NextRequest } from 'next/server'
import { RegisterSchema, validateBody } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { registerUser, generateToken } from '@/lib/api/auth'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    withRateLimit(request)

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(RegisterSchema, body)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { email, password, name, user_type } = validation.data

    // Register the user
    const user = await registerUser({
      email,
      password,
      name,
      user_type
    })

    // Generate JWT token
    const token = generateToken(user)

    // Return success response with user data (excluding sensitive info)
    return SuccessResponses.created({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        subscription_tier: user.subscription_tier
      },
      token // Include token for immediate login
    })

  } catch (error: any) {
    // Handle specific registration errors
    if (error.message === 'Email already exists') {
      return ErrorResponses.conflict('Email already exists')
    }

    return handleAPIError(error)
  }
}

// Handle unsupported methods
export async function GET() {
  return ErrorResponses.validation('Method not allowed')
}

export async function PUT() {
  return ErrorResponses.validation('Method not allowed')
}

export async function DELETE() {
  return ErrorResponses.validation('Method not allowed')
}

export async function PATCH() {
  return ErrorResponses.validation('Method not allowed')
}