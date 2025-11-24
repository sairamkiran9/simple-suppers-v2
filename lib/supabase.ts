import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)

// Server-side client for admin operations
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!secretKey) {
  console.warn('SUPABASE_SECRET_KEY not found - admin operations will not work')
}

const _supabaseAdmin = secretKey
  ? createClient(supabaseUrl, secretKey)
  : null

// Helper to ensure supabaseAdmin is available
function ensureSupabaseAdmin() {
  if (!_supabaseAdmin) {
    throw new Error('Supabase admin client not available - check SUPABASE_SECRET_KEY environment variable')
  }
  return _supabaseAdmin
}

export const supabaseAdmin = ensureSupabaseAdmin()

// Type-safe database client
export type { Database } from './database-types'