import { NextResponse } from 'next/server'

export interface APIError {
  code: string
  message: string
  details?: any
}

export interface APIErrorResponse {
  success: false
  error: APIError
}

export interface APISuccessResponse<T = any> {
  success: true
  data?: T
  [key: string]: any
}

export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse

// Error classes for different types of errors
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentError'
  }
}

// Error response factory functions
export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: any
): NextResponse<APIErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    { status }
  )
}

export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<APISuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data
    },
    { status }
  )
}

// Error handling middleware
export function handleAPIError(error: unknown): NextResponse<APIErrorResponse> {
  console.error('API Error:', error)

  if (error instanceof ValidationError) {
    return createErrorResponse(400, 'VALIDATION_ERROR', error.message, error.details)
  }

  if (error instanceof AuthenticationError) {
    return createErrorResponse(401, 'AUTHENTICATION_ERROR', error.message)
  }

  if (error instanceof AuthorizationError) {
    return createErrorResponse(403, 'AUTHORIZATION_ERROR', error.message)
  }

  if (error instanceof NotFoundError) {
    return createErrorResponse(404, 'NOT_FOUND', error.message)
  }

  if (error instanceof ConflictError) {
    return createErrorResponse(409, 'CONFLICT', error.message)
  }

  if (error instanceof RateLimitError) {
    return createErrorResponse(429, 'RATE_LIMIT_EXCEEDED', error.message)
  }

  if (error instanceof PaymentError) {
    return createErrorResponse(422, 'PAYMENT_ERROR', error.message)
  }

  // Generic error for unhandled cases
  return createErrorResponse(
    500,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred'
  )
}

// Specific error response helpers
export const ErrorResponses = {
  validation: (message: string, details?: any) =>
    createErrorResponse(400, 'VALIDATION_ERROR', message, details),

  unauthorized: (message: string = 'Authentication required') =>
    createErrorResponse(401, 'AUTHENTICATION_ERROR', message),

  forbidden: (message: string = 'Insufficient permissions') =>
    createErrorResponse(403, 'AUTHORIZATION_ERROR', message),

  notFound: (resource: string = 'Resource') =>
    createErrorResponse(404, 'NOT_FOUND', `${resource} not found`),

  conflict: (message: string) =>
    createErrorResponse(409, 'CONFLICT', message),

  rateLimit: (message: string = 'Rate limit exceeded') =>
    createErrorResponse(429, 'RATE_LIMIT_EXCEEDED', message),

  payment: (message: string) =>
    createErrorResponse(422, 'PAYMENT_ERROR', message),

  internal: (message: string = 'Internal server error') =>
    createErrorResponse(500, 'INTERNAL_SERVER_ERROR', message),

  methodNotAllowed: (message: string = 'Method not allowed') =>
    createErrorResponse(405, 'METHOD_NOT_ALLOWED', message)
}

// Success response helpers
export const SuccessResponses = {
  ok: <T>(data: T) => createSuccessResponse(data, 200),
  created: <T>(data: T) => createSuccessResponse(data, 201),
  accepted: <T>(data: T) => createSuccessResponse(data, 202),
  noContent: () => NextResponse.json({ success: true }, { status: 204 })
}