# Instant Subscription Feature Documentation

## Overview

The **Instant Subscription Feature** allows logged-in users to subscribe to meal plans without going through payment processing. When a user clicks "Subscribe Now" on a meal plan, the system immediately creates a purchase record in the database and adds the plan to their account.

This feature is designed for development, testing, and scenarios where payment processing is bypassed.

---

## Table of Contents

1. [Feature Summary](#feature-summary)
2. [Technical Implementation](#technical-implementation)
3. [API Endpoint](#api-endpoint)
4. [Frontend Integration](#frontend-integration)
5. [User Flow](#user-flow)
6. [Code Changes](#code-changes)
7. [Testing](#testing)
8. [Future Enhancements](#future-enhancements)

---

## Feature Summary

### What It Does

- ✅ Allows logged-in users to instantly subscribe to meal plans
- ✅ Works for both **free** and **paid** plans
- ✅ Creates purchase records in the database
- ✅ Prevents duplicate purchases
- ✅ Calculates provider earnings (70/30 revenue split)
- ✅ Tracks analytics events
- ✅ Shows purchased plans in user dashboard
- ✅ Provides loading states and error handling

### What It Doesn't Do

- ❌ Does NOT process actual payments
- ❌ Does NOT integrate with Stripe or payment gateways
- ❌ Does NOT validate payment methods

---

## Technical Implementation

### Architecture

```
User clicks "Subscribe Now"
         ↓
SubscriptionModal displays
         ↓
User confirms
         ↓
Frontend calls createInstantPurchase()
         ↓
POST /api/purchases/instant
         ↓
Backend creates purchase record
         ↓
Success response returned
         ↓
User redirected to dashboard
         ↓
Dashboard shows purchased plan
```

### Revenue Split

- **Provider Earnings**: 70% of plan price
- **Platform Fee**: 30% of plan price
- **Free Plans**: $0 price, no fees

### Database Impact

Creates a record in `user_plan_purchases` table:
- `user_id`: Current authenticated user
- `meal_plan_id`: Selected plan ID
- `provider_id`: Plan provider ID
- `purchase_price`: Plan final price (or $0 for free)
- `provider_earnings`: 70% of purchase price
- `platform_fee`: 30% of purchase price
- `status`: 'completed'
- `purchased_at`: Current timestamp
- `expires_at`: Current time + plan duration_days
- `is_active`: true

---

## API Endpoint

### POST /api/purchases/instant

Creates an instant purchase record without payment processing.

#### Authentication
**Required**: Yes (JWT Bearer token)

#### Rate Limiting
Applied per user via `withRateLimit()`

#### Request Body

```json
{
  "meal_plan_id": "uuid-string"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "purchase_id": "uuid-string",
    "meal_plan_id": "uuid-string",
    "meal_plan_title": "Weekly Meal Plan",
    "purchase_price": 29.99,
    "access_granted": true,
    "message": "Meal plan purchased successfully!"
  }
}
```

#### Response (Free Plan)

```json
{
  "success": true,
  "data": {
    "purchase_id": "uuid-string",
    "meal_plan_id": "uuid-string",
    "meal_plan_title": "Free Starter Plan",
    "purchase_price": 0,
    "access_granted": true,
    "message": "Free plan added to your account!"
  }
}
```

#### Error Responses

**400 - Validation Error**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "meal_plan_id is required"
  }
}
```

**404 - Meal Plan Not Found**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Meal plan not found"
  }
}
```

**409 - Duplicate Purchase**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "You have already purchased this meal plan"
  }
}
```

**401 - Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Implementation Details

**File**: `/app/api/purchases/instant/route.ts`

**Key Checks**:
1. User authentication (via `requireAuth`)
2. Rate limiting (via `withRateLimit`)
3. Meal plan exists and is active
4. Plan is published
5. User hasn't already purchased the plan

**Database Operations**:
1. Fetch meal plan with provider details
2. Check for existing purchase
3. Create purchase record via `createPurchase()`
4. Track analytics event via `trackEvent()`

---

## Frontend Integration

### API Client Function

**File**: `lib/api/user.ts`

```typescript
/**
 * Creates an instant purchase for a meal plan
 * Bypasses payment processing and directly creates purchase record
 */
export async function createInstantPurchase(
  mealPlanId: string
): Promise<APIResponse<{
  purchase_id: string
  meal_plan_id: string
  meal_plan_title: string
  purchase_price: number
  access_granted: boolean
  message: string
}>>
```

**Usage Example**:

```typescript
import { createInstantPurchase } from '@/lib/api/user'

const handlePurchase = async (planId: string) => {
  try {
    const response = await createInstantPurchase(planId)

    if (response.success && response.data) {
      console.log(response.data.message)
      // Success: redirect or refresh dashboard
    } else {
      console.error(response.error?.message)
    }
  } catch (error) {
    console.error('Purchase failed:', error)
  }
}
```

### Main Application Handler

**File**: `app/page.tsx`

```typescript
const handleConfirmSubscription = async () => {
  if (!selectedPlanId) return;

  const plan = selectedMealPlan || mealPlansData?.meal_plans.find(p => p.id === selectedPlanId);
  if (!plan) return;

  setIsPurchasing(true);

  try {
    const response = await createInstantPurchase(selectedPlanId);

    if (response.success && response.data) {
      toast.success(response.data.message || `Successfully subscribed to ${plan.title}!`);
      setIsModalOpen(false);
      setCurrentView('dashboard'); // Navigate to dashboard
    } else {
      toast.error(response.error?.message || 'Failed to subscribe to meal plan');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    toast.error(errorMessage);
  } finally {
    setIsPurchasing(false);
  }
};
```

### Subscription Modal Component

**File**: `components/SubscriptionModal.tsx`

**Props**:
```typescript
interface SubscriptionModalProps {
  isOpen: boolean;
  plan: ApiMealPlan | ApiMealPlanDetail | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean; // New prop for loading state
}
```

**Features**:
- Shows "Processing..." when `isLoading` is true
- Disables buttons during purchase
- Displays plan details (cost, provider, duration)
- Different text for free vs paid plans

---

## User Flow

### Step-by-Step Process

1. **Browse Meal Plans**
   - User navigates to "Browse Meal Plans" view
   - Views available meal plans with pricing

2. **Select a Plan**
   - User clicks "Subscribe Now" button on a meal plan card
   - Or views plan details and clicks subscribe

3. **Confirm Subscription**
   - Subscription modal appears
   - Shows plan details: title, cost, provider, duration
   - User reviews information

4. **Process Purchase**
   - User clicks "Subscribe Now" (or "Get Free Plan")
   - Button shows "Processing..." with disabled state
   - API call creates purchase record

5. **Success Response**
   - Success toast notification appears
   - Modal closes automatically
   - User redirected to dashboard

6. **View Purchased Plan**
   - Dashboard displays purchased plan
   - User can view plan details
   - User can download shopping list

### Authentication Check

If user is not logged in:
- Subscribe button triggers login modal
- After successful login, user can subscribe

---

## Code Changes

### Files Created

1. **`/app/api/purchases/instant/route.ts`** (New)
   - Instant purchase API endpoint
   - ~120 lines

### Files Modified

1. **`lib/api/user.ts`**
   - Added `createInstantPurchase()` function
   - Lines: 43-62

2. **`app/page.tsx`**
   - Imported `createInstantPurchase` and `toast`
   - Added `isPurchasing` state
   - Made `handleConfirmSubscription` async with API call
   - Passed `isLoading` prop to SubscriptionModal
   - Lines modified: 1-22, 24-31, 80-104, 231-241

3. **`components/SubscriptionModal.tsx`**
   - Added `isLoading` prop
   - Updated button states and text
   - Lines modified: 6-14, 53-60

### Dependencies

**Required packages** (already installed):
- `@/lib/api/errors` - Error handling
- `@/lib/api/rate-limit` - Rate limiting
- `@/lib/api/auth` - Authentication
- `@/lib/database-utils` - Database operations
- `@/lib/supabase` - Supabase client
- `sonner` - Toast notifications

---

## Testing

### Manual Testing Steps

#### Prerequisites
1. Start local Supabase: `npm run supabase:start`
2. Start development server: `npm run dev`
3. Have at least one published meal plan in database

#### Test Case 1: Subscribe to Paid Plan

**Steps**:
1. Log in as a user
2. Navigate to "Browse Meal Plans"
3. Click "Subscribe Now" on a paid plan
4. Verify modal shows correct price
5. Click "Subscribe Now" button
6. Verify "Processing..." appears
7. Verify success toast appears
8. Verify redirect to dashboard
9. Verify plan appears in "Purchased Meal Plans" section

**Expected Result**: ✅ Purchase created, plan visible in dashboard

#### Test Case 2: Subscribe to Free Plan

**Steps**:
1. Log in as a user
2. Find a free meal plan (is_free = true)
3. Click "Get Free Plan" button
4. Verify modal shows "Free" cost
5. Click "Get Free Plan" button
6. Verify success toast with "Free plan added" message

**Expected Result**: ✅ Free plan added with $0 purchase price

#### Test Case 3: Duplicate Purchase Prevention

**Steps**:
1. Subscribe to a plan (complete Test Case 1)
2. Navigate back to browse
3. Try to subscribe to the same plan again
4. Verify error toast: "You have already purchased this meal plan"

**Expected Result**: ✅ Error message, no duplicate record created

#### Test Case 4: Unauthenticated User

**Steps**:
1. Log out
2. Navigate to browse meal plans
3. Click "Subscribe Now"
4. Verify login modal appears

**Expected Result**: ✅ User prompted to log in

#### Test Case 5: Invalid Meal Plan

**Steps**:
1. Make API call with non-existent meal_plan_id
2. Verify 404 error response

**Expected Result**: ✅ "Meal plan not found" error

### Automated Testing

**API Endpoint Test** (example):

```typescript
// __tests__/api/purchases/instant.test.ts
import { POST } from '@/app/api/purchases/instant/route'

describe('POST /api/purchases/instant', () => {
  it('should create purchase for valid meal plan', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user-123', user_type: 'user' }

    // Mock request
    const request = new NextRequest('http://localhost/api/purchases/instant', {
      method: 'POST',
      body: JSON.stringify({ meal_plan_id: 'plan-123' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.purchase_id).toBeDefined()
  })

  it('should reject duplicate purchase', async () => {
    // Test duplicate purchase logic
  })
})
```

### Database Verification

After successful purchase, verify in Supabase:

```sql
-- Check purchase record
SELECT * FROM user_plan_purchases
WHERE user_id = 'user-id'
AND meal_plan_id = 'plan-id';

-- Should return:
-- - status: 'completed'
-- - is_active: true
-- - purchase_price: correct amount
-- - provider_earnings: 70% of price
-- - platform_fee: 30% of price
```

### TypeScript Compilation

```bash
npm run typecheck
```

Should pass with no errors related to instant purchase feature.

---

## Future Enhancements

### Potential Improvements

1. **Refund Functionality**
   - Add endpoint to refund/cancel instant purchases
   - Update purchase status to 'refunded'

2. **Purchase Limits**
   - Limit number of free plans per user
   - Implement subscription tiers

3. **Email Notifications**
   - Send purchase confirmation email
   - Include meal plan details and access link

4. **Purchase History Export**
   - Allow users to download purchase history as CSV/PDF
   - Include filtering and date ranges

5. **Gift Purchases**
   - Allow users to purchase plans for others
   - Send gift codes via email

6. **Bulk Purchases**
   - Add ability to purchase multiple plans at once
   - Apply discounts for bulk purchases

7. **Access Control**
   - Implement plan expiration checks
   - Restrict access to expired plans
   - Add renewal functionality

8. **Analytics Dashboard**
   - Track conversion rates
   - Monitor popular plans
   - Provider earnings breakdown

---

## Troubleshooting

### Common Issues

#### Issue: "Authentication required" error

**Solution**: Ensure user is logged in and auth token is valid in localStorage

```typescript
// Check in browser console
console.log(localStorage.getItem('auth_token'))
```

#### Issue: "Meal plan not found" error

**Possible Causes**:
- Plan is not published (`is_published = false`)
- Plan is inactive (`is_active = false`)
- Plan is deleted (`is_deleted = true`)
- Invalid plan ID

**Solution**: Check plan status in database

```sql
SELECT id, title, is_published, is_active, is_deleted
FROM meal_plans
WHERE id = 'your-plan-id';
```

#### Issue: Purchase created but not showing in dashboard

**Possible Causes**:
- Dashboard not refreshing after purchase
- Purchase has `is_active = false`

**Solution**: Add explicit refresh after purchase or check purchase record

#### Issue: TypeScript errors after implementation

**Solution**: Run type check and fix any type mismatches

```bash
npm run typecheck
```

---

## API Contract Summary

### Request Requirements
- **Method**: POST
- **Endpoint**: `/api/purchases/instant`
- **Headers**:
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**: `{ "meal_plan_id": "string" }`

### Response Format
- **Success**: `{ success: true, data: {...} }`
- **Error**: `{ success: false, error: { code: string, message: string } }`

### HTTP Status Codes
- `200` - Success
- `400` - Validation error
- `401` - Unauthorized
- `404` - Resource not found
- `409` - Conflict (duplicate purchase)
- `500` - Internal server error

---

## Related Documentation

- [API Documentation](./api-documentation.md)
- [Database Schema](./simple-suppers-database-schema)
- [Authentication Flow](./API_INTEGRATION.md)
- [User Dashboard Integration](./INTEGRATION_SUMMARY.md)

---

## Changelog

### v1.0.0 - 2025-10-12

**Added**:
- Initial instant subscription feature
- `/api/purchases/instant` endpoint
- `createInstantPurchase()` API client function
- Loading states in subscription modal
- Success/error toast notifications
- Automatic dashboard redirect after purchase

**Modified**:
- `app/page.tsx` - Async subscription handler
- `components/SubscriptionModal.tsx` - Loading prop
- `lib/api/user.ts` - New purchase function

---

## Contributors

- Implementation: Claude Code Assistant
- Documentation: Claude Code Assistant

---

## License

This feature is part of the Simple Suppers v2 application.
