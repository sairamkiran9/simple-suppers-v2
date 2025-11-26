// Jest setup for database tests (Node environment with real Supabase connection)
require('jest-extended')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Add globals for Node environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill File, Blob, and FormData for undici (required in Node.js < 20)
if (typeof global.File === 'undefined') {
  class File {
    constructor(bits, name, options = {}) {
      this.bits = bits
      this.name = name
      this.type = options.type || ''
      this.lastModified = options.lastModified || Date.now()
      this.size = bits.reduce((acc, bit) => acc + (bit.length || bit.size || 0), 0)
    }

    async text() {
      return this.bits.map(bit => bit.toString()).join('')
    }

    async arrayBuffer() {
      const text = await this.text()
      return new TextEncoder().encode(text).buffer
    }

    slice(start, end, contentType) {
      return new File(this.bits.slice(start, end), this.name, { type: contentType || this.type })
    }

    stream() {
      const chunks = this.bits
      let index = 0
      return new ReadableStream({
        pull(controller) {
          if (index < chunks.length) {
            controller.enqueue(chunks[index++])
          } else {
            controller.close()
          }
        }
      })
    }
  }
  global.File = File
}

if (typeof global.Blob === 'undefined') {
  class Blob {
    constructor(bits = [], options = {}) {
      this.bits = bits
      this.type = options.type || ''
      this.size = bits.reduce((acc, bit) => acc + (bit.length || bit.size || 0), 0)
    }

    async text() {
      return this.bits.map(bit => bit.toString()).join('')
    }

    async arrayBuffer() {
      const text = await this.text()
      return new TextEncoder().encode(text).buffer
    }

    slice(start, end, contentType) {
      return new Blob(this.bits.slice(start, end), { type: contentType || this.type })
    }
  }
  global.Blob = Blob
}

// Mock Web APIs for Node.js environment
try {
  const { Request, Response, Headers } = require('undici')
  global.Request = Request
  global.Response = Response
  global.Headers = Headers
} catch (error) {
  console.warn('Could not load undici for Web APIs:', error.message)
  console.warn('Tests may fail if they rely on Request/Response objects')
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
