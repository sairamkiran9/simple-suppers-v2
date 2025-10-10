import { NextRequest } from 'next/server'
import { RateLimitError } from './errors'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory storage for rate limiting (perfect for Netlify Functions)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Rate limit configurations
export const RATE_LIMITS = {
  anonymous: {
    requests: 100,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  authenticated: {
    requests: 1000,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  admin: {
    requests: 5000,
    windowMs: 60 * 60 * 1000 // 1 hour
  }
} as const

export type RateLimitTier = keyof typeof RATE_LIMITS

// Clean up expired entries periodically
function cleanupExpiredEntries() {
  const now = Date.now()
  const keysToDelete: string[] = []

  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key)
    }
  })

  keysToDelete.forEach(key => rateLimitStore.delete(key))
}

// Get client identifier from request
function getClientIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Use IP address for anonymous users
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

  return `ip:${ip}`
}

// Get rate limit tier based on user type
function getRateLimitTier(userType?: string): RateLimitTier {
  if (userType === 'admin') return 'admin'
  if (userType) return 'authenticated'
  return 'anonymous'
}

// Check rate limit for a request
export function checkRateLimit(
  request: NextRequest,
  userId?: string,
  userType?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  // Clean up expired entries occasionally (every ~100 requests)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries()
  }

  const clientId = getClientIdentifier(request, userId)
  const tier = getRateLimitTier(userType)
  const limit = RATE_LIMITS[tier]
  const now = Date.now()
  const windowStart = now - limit.windowMs

  let entry = rateLimitStore.get(clientId)

  // Create new entry if doesn't exist or expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + limit.windowMs
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(clientId, entry)

  const allowed = entry.count <= limit.requests
  const remaining = Math.max(0, limit.requests - entry.count)

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime
  }
}

// Middleware function to enforce rate limiting
export function withRateLimit(
  request: NextRequest,
  userId?: string,
  userType?: string
): void {
  const result = checkRateLimit(request, userId, userType)

  if (!result.allowed) {
    throw new RateLimitError('Rate limit exceeded. Please try again later.')
  }
}

// Get rate limit headers for response
export function getRateLimitHeaders(
  request: NextRequest,
  userId?: string,
  userType?: string
): Record<string, string> {
  const tier = getRateLimitTier(userType)
  const limit = RATE_LIMITS[tier]
  const result = checkRateLimit(request, userId, userType)

  return {
    'X-RateLimit-Limit': limit.requests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
  }
}

// Helper to add rate limit headers to any response
export function addRateLimitHeaders(
  headers: Headers,
  request: NextRequest,
  userId?: string,
  userType?: string
): void {
  const rateLimitHeaders = getRateLimitHeaders(request, userId, userType)

  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    headers.set(key, value)
  })
}

// Debug function to get current rate limit status
export function getRateLimitStatus(clientId: string): RateLimitEntry | null {
  return rateLimitStore.get(clientId) || null
}

// Reset rate limit for a client (useful for testing)
export function resetRateLimit(clientId: string): void {
  rateLimitStore.delete(clientId)
}

// Get total number of tracked clients (for monitoring)
export function getRateLimitStoreSize(): number {
  return rateLimitStore.size
}