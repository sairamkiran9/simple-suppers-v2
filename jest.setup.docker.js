// Jest setup for Docker environment
import '@testing-library/jest-dom'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres-test:5432/simple_suppers_test'
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://postgres-test:5432'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'test-key'
process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'test-secret'
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-nextauth-secret-min-32-chars-long'

// Global test timeout
jest.setTimeout(30000)

// Mock console methods to reduce noise
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

// Database connection helper
let dbConnection = null

export async function getTestDbConnection() {
  if (!dbConnection) {
    // Initialize database connection here if needed
    // For now, we'll use Supabase client
  }
  return dbConnection
}

// Cleanup after all tests
afterAll(async () => {
  if (dbConnection) {
    // Close database connection
    await dbConnection.end()
  }
})

// Reset database state between test suites
beforeEach(async () => {
  // Optional: Reset specific tables or data
  // This can be implemented based on your needs
})
