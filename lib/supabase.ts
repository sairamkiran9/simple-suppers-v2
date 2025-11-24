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

export const supabaseAdmin = secretKey
  ? createClient(supabaseUrl, secretKey)
  : null

// Type-safe database client
export type { Database } from './database-types'