import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware for API response optimization
 * - Adds compression hints for API routes
 * - Next.js automatically compresses responses when Accept-Encoding header is present
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // For API routes, add compression hint
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Next.js automatically uses compression when client supports it
    // We just need to ensure it's not disabled
    response.headers.set('Vary', 'Accept-Encoding')
  }

  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
