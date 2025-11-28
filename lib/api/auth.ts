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
  is_creator: boolean
  is_active?: boolean | null
  creator_display_name?: string | null
  creator_bio?: string | null
  creator_profile_image_url?: string | null
  creator_email_verified?: boolean | null
  total_earnings?: number | null
  total_meal_plans_created?: number | null
  creator_rating?: number | null
  is_verified?: boolean | null
  creator_tier?: string | null
  created_at?: string | null
  updated_at?: string | null
}

// JWT configuration - lazy initialization to allow builds without NEXTAUTH_SECRET
let _jwtSecret: string | null = null
let _jwtConfigChecked = false

function getJWTSecret(): string {
  // Return cached value if already initialized
  if (_jwtSecret !== null) {
    return _jwtSecret
  }

  // Only check once and log warning
  if (!_jwtConfigChecked) {
    _jwtConfigChecked = true

    const secret = process.env.NEXTAUTH_SECRET

    if (!secret || secret.length < 32) {
      console.warn('NEXTAUTH_SECRET not configured or less than 32 characters. JWT operations will fail at runtime.')
      _jwtSecret = null
      return null as any // Will throw when actually used
    }

    _jwtSecret = secret
  }

  if (!_jwtSecret) {
    throw new Error(
      'NEXTAUTH_SECRET environment variable must be set to a secure value (minimum 32 characters). ' +
      'Generate one using: openssl rand -base64 32'
    )
  }

  return _jwtSecret
}

const JWT_EXPIRES_IN = '7d'

// Helper function to check if JWT is configured
export function isJWTConfigured(): boolean {
  const secret = process.env.NEXTAUTH_SECRET
  return !!(secret && secret.length >= 32)
}

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
  const secret = getJWTSecret()
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      user_type: user.user_type
    },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token: string): { id: string; email: string; user_type: string } {
  try {
    const secret = getJWTSecret()
    const payload = jwt.verify(token, secret) as any
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
      subscription_tier: (user.subscription_tier as 'freemium' | 'premium') || 'freemium',
      is_creator: user.is_creator || false,
      is_active: user.is_active,
      creator_display_name: user.creator_display_name,
      creator_bio: user.creator_bio,
      creator_profile_image_url: user.creator_profile_image_url,
      creator_email_verified: user.creator_email_verified,
      total_earnings: user.total_earnings,
      total_meal_plans_created: user.total_meal_plans_created,
      creator_rating: user.creator_rating,
      is_verified: user.is_verified,
      creator_tier: user.creator_tier,
      created_at: user.created_at,
      updated_at: user.updated_at
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
    subscription_tier: (user.subscription_tier as 'freemium' | 'premium') || 'freemium',
    is_creator: user.is_creator || false,
    is_active: user.is_active,
    creator_display_name: user.creator_display_name,
    creator_bio: user.creator_bio,
    creator_profile_image_url: user.creator_profile_image_url,
    creator_email_verified: user.creator_email_verified,
    total_earnings: user.total_earnings,
    total_meal_plans_created: user.total_meal_plans_created,
    creator_rating: user.creator_rating,
    is_verified: user.is_verified,
    creator_tier: user.creator_tier,
    created_at: user.created_at,
    updated_at: user.updated_at
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
    subscription_tier: (user.subscription_tier as 'freemium' | 'premium') || 'freemium',
    is_creator: user.is_creator || false,
    is_active: user.is_active,
    creator_display_name: user.creator_display_name,
    creator_bio: user.creator_bio,
    creator_profile_image_url: user.creator_profile_image_url,
    creator_email_verified: user.creator_email_verified,
    total_earnings: user.total_earnings,
    total_meal_plans_created: user.total_meal_plans_created,
    creator_rating: user.creator_rating,
    is_verified: user.is_verified,
    creator_tier: user.creator_tier,
    created_at: user.created_at,
    updated_at: user.updated_at
  }
}

// Check if user is a creator (has creator profile)
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
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, is_creator, creator_display_name, creator_bio, creator_profile_image_url, total_earnings, total_meal_plans_created, creator_rating')
    .eq('id', userId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single()

  if (error || !user || !user.is_creator) {
    return { isProvider: false }
  }

  return {
    isProvider: true,
    providerProfile: {
      id: user.id,
      business_name: user.creator_display_name || user.id,
      bio: user.creator_bio,
      profile_image_url: user.creator_profile_image_url,
      total_earnings: Number(user.total_earnings || 0),
      total_plans: user.total_meal_plans_created || 0,
      average_rating: Number(user.creator_rating || 0)
    }
  }
}
