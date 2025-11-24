// Simple test script to verify feed implementation
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFeedTables() {
  try {
    console.log('Testing feed tables...')
    
    // Test if feed_posts table exists
    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Feed tables not found:', error.message)
      console.log('You need to run the database migrations first.')
      return false
    }
    
    console.log('✅ Feed tables exist and are accessible')
    console.log('Sample data:', data)
    return true
    
  } catch (error) {
    console.error('Test failed:', error.message)
    return false
  }
}

testFeedTables()