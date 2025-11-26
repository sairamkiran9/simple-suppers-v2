import { NextRequest } from 'next/server'
import { POST as registerPOST } from '@/app/api/auth/register/route'
import { POST as loginPOST } from '@/app/api/auth/login/route'

// Create a chainable mock for Supabase queries
const createChainableMock = () => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis()
})

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn()
    },
    from: jest.fn(() => createChainableMock())
  },
  supabaseAdmin: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getUser: jest.fn()
    },
    from: jest.fn(() => createChainableMock())
  },
  isSupabaseAdminConfigured: jest.fn(() => true),
  isSupabaseConfigured: jest.fn(() => true)
}))

// Mock rate limiting
jest.mock('@/lib/api/rate-limit', () => ({
  withRateLimit: jest.fn()
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('$2a$12$mocked.hash.value')),
  compare: jest.fn(() => Promise.resolve(true))
}))

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register a new user successfully', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Mock the chainable query - first call checks existing user, second call creates user
    const mockChain = createChainableMock()
    mockChain.single
      .mockResolvedValueOnce({ data: null, error: null } as any) // No existing user
      .mockResolvedValueOnce({ // User creation
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          user_type: 'user',
          subscription_tier: 'freemium'
        },
        error: null
      } as any)
    supabaseAdmin.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        user_type: 'user'
      })
    })

    const response = await registerPOST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.user.email).toBe('test@example.com')
  })

  it('should fail with invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
        user_type: 'user'
      })
    })

    const response = await registerPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('email')
  })

  it('should fail with weak password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
        user_type: 'user'
      })
    })

    const response = await registerPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('Password must be at least 6 characters')
  })

  it('should fail with missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com'
        // Missing password, name, user_type
      })
    })

    const response = await registerPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should login successfully with valid credentials', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')
    const bcrypt = require('bcryptjs')

    // Mock successful password verification
    bcrypt.compare.mockResolvedValue(true)

    // Mock the chainable query for user fetch
    const mockChain = createChainableMock()
    mockChain.single.mockResolvedValue({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        user_type: 'user',
        subscription_tier: 'freemium',
        password_hash: '$2a$12$test.hash.for.password123',
        is_active: true,
        is_deleted: false
      },
      error: null
    } as any)
    supabaseAdmin.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user.email).toBe('test@example.com')
    expect(data.data.token).toBeDefined()
  })

  it('should fail with invalid credentials', async () => {
    const { supabaseAdmin } = require('@/lib/supabase')

    // Mock user not found (invalid email)
    const mockChain = createChainableMock()
    mockChain.single.mockResolvedValue({
      data: null,
      error: { message: 'No rows returned' }
    } as any)
    supabaseAdmin.from.mockReturnValue(mockChain)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('should fail with missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        password: 'password123'
      })
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('email')
  })
})