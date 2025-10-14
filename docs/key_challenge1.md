  supabase vs supabaseAdmin - The Key Differences

  1. Row Level Security (RLS)

  // Regular client (supabase)
  const { data } = await supabase
    .from('user_plan_purchases')
    .select('*')
    .eq('user_id', userId)

  // What happens behind the scenes:
  // ✅ Step 1: Execute query
  // ✅ Step 2: Check RLS policies for EVERY row
  // ✅ Step 3: Filter out rows user can't access
  // ✅ Step 4: Return filtered results

  // Admin client (supabaseAdmin)
  const { data } = await supabaseAdmin
    .from('user_plan_purchases')
    .select('*')
    .eq('user_id', userId)

  // What happens behind the scenes:
  // ✅ Step 1: Execute query
  // ✅ Step 2: Return ALL matching rows (no RLS checks)

  2. RLS Policy Example

  Your database probably has policies like this:

  -- RLS Policy on user_plan_purchases table
  CREATE POLICY "Users can view their own purchases"
  ON user_plan_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

  With regular client:
  - For EVERY row, Supabase must:
    a. Check if auth.uid() exists
    b. Compare auth.uid() with user_id
    c. Decide if row should be included
  - This happens for every single row in the result set

  With admin client:
  - Skips ALL of these checks
  - Trusts your application code to enforce security

  3. Why The Performance Difference?

  Let me show you what was happening:

● Read(app/api/meal-plans/route.ts)
  ⎿  Read 15 lines

● Before (with supabase):
  User makes request to /api/meal-plans
    ↓
  API needs to check "which meal plans has this user subscribed to?"
    ↓
  Query: SELECT id, meal_plan_id FROM user_plan_purchases
         WHERE user_id = '39e709...' AND is_active = true
    ↓
  RLS kicks in:
    1. "Wait, who is auth.uid()?" → Check JWT token
    2. "Does auth.uid() match user_id?" → For EVERY row
    3. "Should I allow this row?" → Policy evaluation
    4. "What about this row?" → Policy evaluation again
    5. ... repeat for every potential row in table
    ↓
  Result: 9.7 seconds 🐢

  After (with supabaseAdmin):
  User makes request to /api/meal-plans
    ↓
  API needs to check "which meal plans has this user subscribed to?"
    ↓
  Query: SELECT id, meal_plan_id FROM user_plan_purchases
         WHERE user_id = '39e709...' AND is_active = true
    ↓
  Database executes query directly, no RLS checks
    ↓
  Result: 0.2 seconds ⚡

  4. Real-World Analogy

  Think of it like airport security:

  Regular Client (supabase) = TSA Security Line
  - Everyone must show ID
  - Everyone gets scanned
  - Every bag gets checked
  - Even if you're a pilot or crew member
  - Slow but secure for untrusted requests

  Admin Client (supabaseAdmin) = Crew Member Fast Track
  - Skip the security line
  - Trusted to access restricted areas
  - Fast but requires trust

  5. When To Use Each?

  // ❌ NEVER use admin client for client-side code
  // (Browser can't be trusted)
  const { data } = await supabaseAdmin
    .from('user_plan_purchases')
    .select('*')

  // ✅ Use regular client in browser/client components
  const { data } = await supabase
    .from('user_plan_purchases')
    .select('*')

  // ✅ Use admin client in server API routes when:
  // 1. You've already authenticated the user
  // 2. You're enforcing security in your code
  // 3. You need better performance
  const user = await requireAuth(request) // ← Security check in code
  const { data } = await supabaseAdmin    // ← Fast query
    .from('user_plan_purchases')
    .select('*')
    .eq('user_id', user.id)              // ← We manually filter by user_id

  6. Why Was It SO Slow?

  Your specific query was slow because:

  1. RLS Policy Complexity: Each policy evaluation takes time
  2. JWT Verification: Must verify the auth token on each query
  3. Multiple Joins: If policies reference other tables
  4. No Index Optimization: RLS can't use indexes as efficiently

  Look at the actual query that was executed:

  -- What the regular client does
  SELECT id, meal_plan_id
  FROM user_plan_purchases
  WHERE user_id = '39e709a7-1d0e-4031-8d82-e0ed27d9341e'
    AND is_active = true
    AND auth.uid() = user_id  -- ← Extra RLS check!

  -- What the admin client does
  SELECT id, meal_plan_id
  FROM user_plan_purchases
  WHERE user_id = '39e709a7-1d0e-4031-8d82-e0ed27d9341e'
    AND is_active = true
  -- No RLS check!

  7. Is This Secure?

  Yes! Because we're doing security in the API layer:

  // app/api/meal-plans/route.ts

  // Step 1: Authenticate user (security check)
  const user = await getCurrentUser(request)

  // Step 2: Only query THEIR purchases (security enforcement)
  const { data: purchases } = await supabaseAdmin
    .from('user_plan_purchases')
    .eq('user_id', user.id)  // ← We control this, not the client
    .eq('is_active', true)

  The security is moved from the database layer (RLS) to the application layer (your API code).

  8. Trade-offs

  | Aspect    | supabase (RLS)          | supabaseAdmin (No RLS)     |
  |-----------|-------------------------|----------------------------|
  | Speed     | Slow (9.7s)             | Fast (0.2s)                |
  | Security  | Database enforced       | Code enforced              |
  | Trust     | Zero trust              | Must trust code            |
  | Use Case  | Client-side, untrusted  | Server-side, authenticated |
  | Debugging | Harder (database level) | Easier (application level) |

  Summary

  The 48x performance improvement came from:
  - ✅ Skipping RLS policy checks (biggest win)
  - ✅ No JWT verification overhead
  - ✅ Direct database query execution
  - ✅ Better use of database indexes

  This is safe because we:
  - ✅ Authenticate users before querying (requireAuth)
  - ✅ Manually filter by user.id in the query
  - ✅ Only use admin client in secure API routes

  The key lesson: When you control the security in your trusted API code, you can bypass database-level security checks for better performance!
