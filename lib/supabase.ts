import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

// Create client lazily - don't throw at import time to allow builds without Supabase configured
let _supabase: ReturnType<typeof createClient<Database>> | null = null

function getSupabaseClient() {
  if (_supabase !== null) {
    return _supabase
  }

  if (!supabaseUrl || !supabasePublishableKey) {
    console.warn('Supabase not configured - NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set')
    _supabase = null
    return null
  }

  _supabase = createClient<Database>(supabaseUrl, supabasePublishableKey)
  return _supabase
}

// Export client using Proxy for lazy initialization
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase client not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variables.')
    }
    return (client as any)[prop]
  }
})

// Server-side client for admin operations
// NOTE: This will only work in server-side code (API routes, server components)
// Client-side code should use the public supabase client or API routes

const secretKey = process.env.SUPABASE_SECRET_KEY

// Lazy initialization - only create when accessed
let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null

function initSupabaseAdmin() {
  if (_supabaseAdmin !== null) {
    return _supabaseAdmin
  }

  // Check if we're on server-side
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin can only be used on the server-side (API routes, server components)')
  }

  if (!secretKey || !supabaseUrl) {
    console.warn('Supabase Admin not configured - SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_URL must be set')
    _supabaseAdmin = null
    return null
  }

  _supabaseAdmin = createClient<Database>(supabaseUrl, secretKey)
  return _supabaseAdmin
}

// Export the admin client - will initialize on first access
// Using a Proxy to enable lazy initialization while maintaining the same API
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    const admin = initSupabaseAdmin()
    if (!admin) {
      throw new Error('Supabase Admin client not configured. Check SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_URL environment variables.')
    }
    return (admin as any)[prop]
  }
})

// Helper function to check if Supabase Admin is configured
export function isSupabaseAdminConfigured(): boolean {
  if (typeof window !== 'undefined') {
    return false // Admin client is server-side only
  }
  return !!(supabaseUrl && secretKey)
}

// Helper function to check if regular Supabase client is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabasePublishableKey)
}

// Type-safe database client
export type { Database } from './supabase-types'