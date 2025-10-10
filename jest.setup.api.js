// Jest setup for API tests (Node environment)
require('jest-extended')

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

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