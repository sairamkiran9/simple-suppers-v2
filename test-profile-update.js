/**
 * Test script for PATCH /api/user/profile endpoint
 *
 * This script tests the profile update functionality with various scenarios
 * to ensure the 500 error is fixed and all edge cases are handled properly.
 *
 * Usage:
 * 1. Start the development server: npm run dev
 * 2. Register a test user via POST /api/auth/register
 * 3. Copy the session token from the response
 * 4. Update the SESSION_TOKEN constant below
 * 5. Run: node test-profile-update.js
 */

const BASE_URL = 'http://localhost:3000'

// Replace with actual session token from login/register
const SESSION_TOKEN = 'YOUR_SESSION_TOKEN_HERE'

async function testProfileUpdate(testName, body, expectedStatus) {
  console.log(`\n🧪 Test: ${testName}`)
  console.log(`📤 Request body:`, JSON.stringify(body, null, 2))

  try {
    const response = await fetch(`${BASE_URL}/api/user/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SESSION_TOKEN}`
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    console.log(`📊 Status: ${response.status} ${response.ok ? '✅' : '❌'}`)
    console.log(`📥 Response:`, JSON.stringify(data, null, 2))

    if (response.status === expectedStatus) {
      console.log(`✅ PASS: Got expected status ${expectedStatus}`)
    } else {
      console.log(`❌ FAIL: Expected status ${expectedStatus}, got ${response.status}`)
    }

    return { success: response.ok, data, status: response.status }
  } catch (error) {
    console.error(`❌ ERROR:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('=' .repeat(60))
  console.log('🧪 Profile Update API Tests')
  console.log('=' .repeat(60))

  if (SESSION_TOKEN === 'YOUR_SESSION_TOKEN_HERE') {
    console.error('\n❌ ERROR: Please set SESSION_TOKEN variable in the script')
    console.log('\nSteps to get a session token:')
    console.log('1. Start dev server: npm run dev')
    console.log('2. Register a user via POST /api/auth/register')
    console.log('3. Copy the session token from the response')
    console.log('4. Update SESSION_TOKEN in this script')
    process.exit(1)
  }

  // Test 1: Update name only
  await testProfileUpdate(
    'Update name only',
    { name: 'John Updated' },
    200
  )

  // Test 2: Update dietary_preferences only (with values)
  await testProfileUpdate(
    'Update dietary_preferences with values',
    { dietary_preferences: ['vegetarian', 'gluten-free'] },
    200
  )

  // Test 3: Update dietary_preferences to empty array (critical test case)
  await testProfileUpdate(
    'Update dietary_preferences to empty array',
    { dietary_preferences: [] },
    200
  )

  // Test 4: Update both fields
  await testProfileUpdate(
    'Update both name and dietary_preferences',
    {
      name: 'John Fully Updated',
      dietary_preferences: ['vegan', 'nut-free']
    },
    200
  )

  // Test 5: Empty payload (should fail with validation error)
  await testProfileUpdate(
    'Empty payload (should fail)',
    {},
    400
  )

  // Test 6: Invalid name (empty string, should fail)
  await testProfileUpdate(
    'Invalid name - empty string (should fail)',
    { name: '' },
    400
  )

  // Test 7: Invalid dietary_preferences (not an array, should fail)
  await testProfileUpdate(
    'Invalid dietary_preferences - not an array (should fail)',
    { dietary_preferences: 'vegetarian' },
    400
  )

  console.log('\n' + '=' .repeat(60))
  console.log('🏁 Tests completed')
  console.log('=' .repeat(60))
}

// Run tests
runTests().catch(console.error)
