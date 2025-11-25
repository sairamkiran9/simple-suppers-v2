import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey)

// Server-side client for admin operations
// NOTE: This will only work in server-side code (API routes, server components)
// Client-side code should use the public supabase client or API routes

const secretKey = process.env.SUPABASE_SECRET_KEY

// Lazy initialization - only create when accessed
let _supabaseAdmin: ReturnType<typeof createClient<Database>> | undefined = undefined

function initSupabaseAdmin() {
  if (_supabaseAdmin !== undefined) {
    return _supabaseAdmin
  }

  // Check if we're on server-side
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin can only be used on the server-side (API routes, server components)')
  }

  if (!secretKey || !supabaseUrl) {
    throw new Error('SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_URL must be set - check environment variables')
  }

  _supabaseAdmin = createClient<Database>(supabaseUrl, secretKey)
  return _supabaseAdmin
}

// Export the admin client - will initialize on first access
// Using a Proxy to enable lazy initialization while maintaining the same API
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    const admin = initSupabaseAdmin()
    return (admin as any)[prop]
  }
})

// Type-safe database client
export type { Database } from './supabase-types'