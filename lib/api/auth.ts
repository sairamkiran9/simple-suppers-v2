import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../supabase'
import { AuthenticationError, AuthorizationError } from './errors'

export interface AuthUser {
  id: string
  email: string
  name: string
  user_type: 'user' | 'provider' | 'admin'
  subscription_tier: 'freemium' | 'premium'
}

// JWT configuration
if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
  throw new Error('NEXTAUTH_SECRET environment variable must be set to a secure value (minimum 32 characters) in production.')
}
const JWT_SECRET = process.env.NEXTAUTH_SECRET
const JWT_EXPIRES_IN = '7d'

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT utilities
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      user_type: user.user_type
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token: string): { id: string; email: string; user_type: string } {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return {
      id: payload.id,
      email: payload.email,
      user_type: payload.user_type
    }
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token')
  }
}

// Extract token from Authorization header
function extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7) // Remove "Bearer " prefix
}

// Get current user from request
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  const token = extractTokenFromHeader(request)
  if (!token) {
    return null
  }

  try {
    const payload = verifyToken(token)

    // Fetch full user data from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', payload.id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .single()

    if (error || !user) {
      throw new AuthenticationError('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      user_type: (user.user_type as 'user' | 'provider' | 'admin') || 'user',
      subscription_tier: (user.subscription_tier as 'freemium' | 'premium') || 'freemium'
    }
  } catch (error) {
    return null
  }
}

// Require authentication middleware
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new AuthenticationError('Authentication required')
  }
  return user
}

// Require specific user type
export async function requireUserType(
  request: NextRequest,
  allowedTypes: Array<'user' | 'provider' | 'admin'>
): Promise<AuthUser> {
  const user = await requireAuth(request)

  if (!allowedTypes.includes(user.user_type)) {
    throw new AuthorizationError(`Access denied. Required user type: ${allowedTypes.join(' or ')}`)
  }

  return user
}

// Require admin access
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  return requireUserType(request, ['admin'])
}

// Require provider access
export async function requireProvider(request: NextRequest): Promise<AuthUser> {
  return requireUserType(request, ['provider'])
}

// Check if user has access to a meal plan
export async function checkMealPlanAccess(
  userId: string,
  mealPlanId: string
): Promise<{ hasAccess: boolean; accessType: 'free' | 'purchased' | 'denied' }> {
  // First check if it's a free plan
  const { data: mealPlan } = await supabaseAdmin
    .from('meal_plans')
    .select('is_free')
    .eq('id', mealPlanId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .eq('is_published', true)
    .single()

  if (mealPlan?.is_free) {
    return { hasAccess: true, accessType: 'free' }
  }

  // Check if user has purchased the plan
  const { data: purchase } = await supabaseAdmin
    .from('user_plan_purchases')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('meal_plan_id', mealPlanId)
    .eq('status', 'completed')
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (purchase) {
    return { hasAccess: true, accessType: 'purchased' }
  }

  return { hasAccess: false, accessType: 'denied' }
}

// Check if user owns a meal plan (for providers)
export async function checkMealPlanOwnership(
  userId: string,
  mealPlanId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('meal_plans')
    .select(`
      provider_id,
      meal_plan_providers!inner(user_id)
    `)
    .eq('id', mealPlanId)
    .eq('meal_plan_providers.user_id', userId)
    .single()

  return !!data
}

// User registration
export async function registerUser(userData: {
  email: string
  password: string
  name: string
  user_type: 'user' | 'provider'
}): Promise<AuthUser> {
  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', userData.email)
    .single()

  if (existingUser) {
    throw new Error('Email already exists')
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password)

  // Create user with hashed password
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: userData.email,
      name: userData.name,
      user_type: userData.user_type,
      auth_provider: 'email',
      subscription_tier: 'freemium',
      password_hash: hashedPassword
    })
    .select()
    .single()

  if (error || !user) {
    console.error('Database error creating user:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to create user: ${error?.message || 'Unknown error'}`)
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    user_type: (user.user_type as 'user' | 'provider' | 'admin') || 'user',
    subscription_tier: (user.subscription_tier as 'freemium' | 'premium') || 'freemium'
  }
}

// User login
export async function loginUser(email: string, password: string): Promise<AuthUser> {
  // Fetch user with password hash
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single()

  if (error || !user) {
    throw new AuthenticationError('Invalid email or password')
  }

  // Verify password
  const passwordHash = (user as any).password_hash
  if (!passwordHash) {
    throw new AuthenticationError('Password authentication not configured for this account')
  }

  const isPasswordValid = await verifyPassword(password, passwordHash)
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password')
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    user_type: (user.user_type as 'user' | 'provider' | 'admin') || 'user',
    subscription_tier: (user.subscription_tier as 'freemium' | 'premium') || 'freemium'
  }
}

// Check if user is a provider (has provider profile)
export async function checkIsProvider(userId: string): Promise<{
  isProvider: boolean
  providerProfile?: {
    id: string
    business_name: string
    bio: string | null
    profile_image_url: string | null
    total_earnings: number
    total_plans: number
    average_rating: number
  }
}> {
  const { data: provider, error } = await supabaseAdmin
    .from('meal_plan_providers')
    .select('id, business_name, bio, profile_image_url, total_earnings, total_plans, average_rating')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single()

  if (error || !provider) {
    return { isProvider: false }
  }

  return {
    isProvider: true,
    providerProfile: {
      id: provider.id,
      business_name: provider.business_name,
      bio: provider.bio,
      profile_image_url: provider.profile_image_url,
      total_earnings: Number(provider.total_earnings || 0),
      total_plans: provider.total_plans || 0,
      average_rating: Number(provider.average_rating)
    }
  }
}