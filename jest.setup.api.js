// Jest setup for API tests (Node environment)
require('jest-extended')

// Set test environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-at-least-32-characters-long'
process.env.NODE_ENV = 'test'

// Add globals for Node environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Add ReadableStream polyfill BEFORE undici import
if (!global.ReadableStream) {
  const { ReadableStream } = require('stream/web')
  global.ReadableStream = ReadableStream
}

// Mock Web APIs for Node.js environment
// Use Node.js built-in fetch (Node 18+) or polyfill
if (!global.fetch) {
  const { fetch, Request, Response, Headers } = require('undici')
  global.fetch = fetch
  global.Request = Request
  global.Response = Response
  global.Headers = Headers
}

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