import { NextRequest } from 'next/server'
import { LoginSchema, validateBody } from '@/lib/api/validation'
import { handleAPIError, SuccessResponses, ErrorResponses } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'
import { loginUser, generateToken } from '@/lib/api/auth'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    withRateLimit(request)

    // Parse and validate request body
    const body = await request.json()
    const validation = validateBody(LoginSchema, body)

    if (!validation.success) {
      return ErrorResponses.validation(validation.error)
    }

    const { email, password } = validation.data

    // Authenticate the user
    const user = await loginUser(email, password)

    // Generate JWT token
    const token = generateToken(user)

    // Return success response with user data
    return SuccessResponses.ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        subscription_tier: user.subscription_tier
      },
      token
    })

  } catch (error: any) {
    // Handle authentication errors
    if (error.name === 'AuthenticationError') {
      return ErrorResponses.unauthorized('Invalid email or password')
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