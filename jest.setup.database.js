// Jest setup for database tests (Node environment with real Supabase connection)
require('jest-extended')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Add globals for Node environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Web APIs for Node.js environment
const { Request, Response, Headers } = require('undici')
global.Request = Request
global.Response = Response
global.Headers = Headers

// Extend Jest matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass: uuidRegex.test(received)
    }
  }
})

// Validate environment variables for database tests
beforeAll(() => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    console.warn('Missing environment variables for database tests:', missingVars)
    console.warn('Using default localhost Supabase configuration for testing.')
  } else {
    console.log('✓ Database test environment configured')
    console.log(`  Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  }
})