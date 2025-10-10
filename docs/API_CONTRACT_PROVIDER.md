# Provider Meal Plan Management API Contract

**Version:** 1.0
**Date:** 2025-10-09
**Status:** Draft for Review

This document defines the API contract for provider meal plan management endpoints. These specifications ensure consistent implementation across backend and frontend layers.

---

## Table of Contents
1. [PATCH /api/providers/meal-plans/[id]](#patch-apiprovidersmeal-plansid)
2. [DELETE /api/providers/meal-plans/[id]](#delete-apiprovidersmeal-plansid)
3. [Type Definitions](#type-definitions)
4. [Security Requirements](#security-requirements)
5. [Error Handling](#error-handling)

---

## PATCH /api/providers/meal-plans/[id]

**Purpose:** Update an existing meal plan owned by the authenticated provider.

### Authentication
- **Required:** Yes (JWT Bearer token)
- **User Type:** Provider only
- **Ownership Check:** User must own the meal plan being updated

### Request

#### URL Parameters
```typescript
{
  id: string // UUID of the meal plan
}
```

#### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body Schema
```typescript
{
  title?: string                                      // min 1 character
  description?: string                                // min 1 character
  category?: string                                   // min 1 character
  dietary_tags?: string[]                            // array of strings
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  is_published?: boolean                             // publish/unpublish
  is_active?: boolean                                // activate/deactivate
}
```

**Validation Rules:**
- All fields are optional (partial update supported)
- At least one field must be provided
- `title`: minimum 1 character if provided
- `description`: minimum 1 character if provided
- `category`: minimum 1 character if provided
- `dietary_tags`: must be array of strings
- `difficulty_level`: must be one of the allowed enum values
- `is_published`: boolean only
- `is_active`: boolean only

**Fields NOT Allowed to Update:**
- `id`, `provider_id` (immutable)
- `duration_days`, `duration_type`, `suggested_price` (cannot be changed after creation)
- `final_price` (calculated field)
- `is_free` (cannot be changed after creation)
- `is_featured` (admin-only field)
- `total_purchases`, `total_views`, `average_rating`, `rating_count` (system metrics)
- `created_at`, `updated_at` (system timestamps)
- `is_deleted` (use DELETE endpoint)

#### Example Request
```json
{
  "title": "Updated Mediterranean Diet Plan",
  "description": "Revised description with more details",
  "dietary_tags": ["mediterranean", "heart-healthy", "low-sodium"],
  "difficulty_level": "intermediate",
  "is_published": true
}
```

### Response

#### Success Response (200 OK)
```typescript
{
  success: true,
  data: {
    meal_plan: {
      id: string
      title: string
      description: string
      duration_days: number
      duration_type: string
      suggested_price: number
      final_price: number
      category: string
      dietary_tags: string[]
      difficulty_level: string
      is_free: boolean
      is_published: boolean
      is_active: boolean
      is_featured: boolean
      total_purchases: number
      total_views: number
      average_rating: number
      rating_count: number
      created_at: string
      updated_at: string
    }
  }
}
```

#### Example Success Response
```json
{
  "success": true,
  "data": {
    "meal_plan": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Updated Mediterranean Diet Plan",
      "description": "Revised description with more details",
      "duration_days": 7,
      "duration_type": "weekly",
      "suggested_price": 29.99,
      "final_price": 28.49,
      "category": "Mediterranean",
      "dietary_tags": ["mediterranean", "heart-healthy", "low-sodium"],
      "difficulty_level": "intermediate",
      "is_free": false,
      "is_published": true,
      "is_active": true,
      "is_featured": false,
      "total_purchases": 15,
      "total_views": 234,
      "average_rating": 4.5,
      "rating_count": 12,
      "created_at": "2025-10-01T10:00:00.000Z",
      "updated_at": "2025-10-09T14:30:00.000Z"
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "title: Title must be at least 1 character",
    "details": {
      "fields": ["title"]
    }
  }
}
```

#### 400 Bad Request - No Fields Provided
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "At least one field must be provided for update"
  }
}
```

#### 401 Unauthorized - Missing/Invalid Token
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden - Not a Provider
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Only providers can access this endpoint"
  }
}
```

#### 403 Forbidden - Not the Owner
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "You do not have permission to update this meal plan"
  }
}
```

#### 404 Not Found - Meal Plan Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Meal plan not found"
  }
}
```

#### 404 Not Found - Provider Profile Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Provider profile not found"
  }
}
```

#### 429 Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded"
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

### Implementation Notes

**Backend Responsibilities:**
1. Validate JWT token and extract user information
2. Verify user is a provider
3. Get provider profile from `meal_plan_providers` table
4. Verify meal plan exists and is not deleted
5. Verify ownership (meal plan's `provider_id` matches provider's `id`)
6. Validate request body against `UpdateMealPlanSchema`
7. Ensure at least one field is provided
8. Update only the provided fields in the database
9. Return the complete updated meal plan record

**Security Checks (in order):**
1. Authentication (requireAuth)
2. Rate limiting (withRateLimit)
3. Provider user type check
4. Provider profile existence
5. Meal plan existence and not deleted
6. Ownership verification

**Database Operations:**
1. Query `meal_plan_providers` to get provider ID
2. Query `meal_plans` to verify existence and ownership
3. Update `meal_plans` with provided fields
4. Return updated record with all fields

---

## DELETE /api/providers/meal-plans/[id]

**Purpose:** Soft delete a meal plan owned by the authenticated provider.

### Authentication
- **Required:** Yes (JWT Bearer token)
- **User Type:** Provider only
- **Ownership Check:** User must own the meal plan being deleted

### Request

#### URL Parameters
```typescript
{
  id: string // UUID of the meal plan
}
```

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
None required

### Response

#### Success Response (200 OK)
```typescript
{
  success: true,
  data: {
    message: string
    meal_plan_id: string
  }
}
```

#### Example Success Response
```json
{
  "success": true,
  "data": {
    "message": "Meal plan deleted successfully",
    "meal_plan_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Error Responses

#### 401 Unauthorized - Missing/Invalid Token
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden - Not a Provider
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Only providers can access this endpoint"
  }
}
```

#### 403 Forbidden - Not the Owner
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "You do not have permission to delete this meal plan"
  }
}
```

#### 404 Not Found - Meal Plan Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Meal plan not found"
  }
}
```

#### 404 Not Found - Provider Profile Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Provider profile not found"
  }
}
```

#### 409 Conflict - Already Deleted
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Meal plan is already deleted"
  }
}
```

#### 429 Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded"
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

### Cascade Behavior

**Soft Delete Strategy:**
- Set `is_deleted = true` on the meal plan
- Set `is_active = false` and `is_published = false`
- Related records (meal_plan_days, meals) are NOT deleted
- Existing purchases remain valid
- Meal plan is excluded from public listings
- Provider can still view in their dashboard (filtered by frontend)

**Related Data Handling:**
- `meal_plan_days` and `meals`: Remain in database (not deleted)
- `user_plan_purchases`: Remain active (users keep access to purchased plans)
- `shopping_lists`: Remain accessible to users who purchased
- `meal_plan_reviews`: Remain visible on deleted plans
- `provider.total_plans`: Decremented by 1

**Future Access:**
- Users with active purchases can still access the meal plan
- Provider can no longer edit or re-publish
- Plan does not appear in public searches or listings
- Admin can view and restore if needed

### Implementation Notes

**Backend Responsibilities:**
1. Validate JWT token and extract user information
2. Verify user is a provider
3. Get provider profile from `meal_plan_providers` table
4. Verify meal plan exists and is not already deleted
5. Verify ownership (meal plan's `provider_id` matches provider's `id`)
6. Perform soft delete by updating flags
7. Decrement provider's total_plans count
8. Return success confirmation

**Security Checks (in order):**
1. Authentication (requireAuth)
2. Rate limiting (withRateLimit)
3. Provider user type check
4. Provider profile existence
5. Meal plan existence check
6. Already deleted check
7. Ownership verification

**Database Operations:**
1. Query `meal_plan_providers` to get provider ID
2. Query `meal_plans` to verify existence, ownership, and not already deleted
3. Update `meal_plans` set `is_deleted = true, is_active = false, is_published = false`
4. Update `meal_plan_providers` decrement `total_plans` by 1
5. Return success message

---

## Type Definitions

### Provider Dashboard Response (CORRECTED)

**Endpoint:** `GET /api/providers/dashboard`

**Current Implementation Returns:**
```typescript
{
  success: true,
  data: {
    provider: {
      id: string
      business_name: string
      bio: string | null
      profile_image_url: string | null
      email_verified: boolean
      is_active: boolean
      total_earnings: number
      total_plans: number
      average_rating: number
    },
    analytics: {
      total_meal_plans: number
      published_plans: number
      draft_plans: number
      total_views: number
      total_sales: number
      current_month_earnings: number
      all_time_earnings: number
    },
    recent_purchases: Array<{
      id: string
      meal_plan_title: string
      customer_name: string
      customer_email: string
      purchase_price: number
      provider_earnings: number
      purchased_at: string
      status: string
    }>,
    top_performing_plans: Array<{
      id: string
      title: string
      total_purchases: number
      total_views: number
      average_rating: number
      final_price: number
    }>
  }
}
```

**Corrected Type Definition:**

The existing `ApiProviderDashboard` type in `/lib/api-types.ts` (lines 273-285) is **INCOMPLETE** and does not match the actual API response.

**Current (INCORRECT):**
```typescript
export interface ApiProviderDashboard {
  overview: {
    total_plans: number
    total_earnings: number
    total_purchases: number
    average_rating: number
  }
  recent_purchases: ApiPurchaseHistoryItem[]
  performance_metrics?: {
    views_this_month: number
    purchases_this_month: number
  }
}
```

**Should be (CORRECT):**
```typescript
export interface ApiProviderDashboardResponse {
  provider: {
    id: string
    business_name: string
    bio: string | null
    profile_image_url: string | null
    email_verified: boolean
    is_active: boolean
    total_earnings: number
    total_plans: number
    average_rating: number
  }
  analytics: {
    total_meal_plans: number
    published_plans: number
    draft_plans: number
    total_views: number
    total_sales: number
    current_month_earnings: number
    all_time_earnings: number
  }
  recent_purchases: Array<{
    id: string
    meal_plan_title: string
    customer_name: string
    customer_email: string
    purchase_price: number
    provider_earnings: number
    purchased_at: string
    status: string
  }>
  top_performing_plans: Array<{
    id: string
    title: string
    total_purchases: number
    total_views: number
    average_rating: number
    final_price: number
  }>
}
```

### Provider Meal Plans Response

**Endpoint:** `GET /api/providers/meal-plans`

**Current Implementation Returns:**
```typescript
{
  success: true,
  data: {
    meal_plans: Array<{
      id: string
      title: string
      description: string
      duration_days: number
      duration_type: string
      suggested_price: number
      final_price: number
      category: string
      dietary_tags: string[]
      difficulty_level: string
      is_free: boolean
      is_featured: boolean
      is_published: boolean
      is_active: boolean
      total_purchases: number
      total_views: number
      average_rating: number
      rating_count: number
      created_at: string
      updated_at: string
    }>,
    total: number
  }
}
```

The existing `ApiProviderMealPlansResponse` type (lines 287-290) is **CORRECT**.

---

## Security Requirements

### Authentication Flow
1. Client includes `Authorization: Bearer <token>` header
2. Backend extracts token using `extractTokenFromHeader()`
3. Backend verifies token using `requireAuth(request)`
4. Backend retrieves user from database and validates `is_active = true` and `is_deleted = false`

### Authorization Flow
1. Verify user type is `'provider'`
2. Query `meal_plan_providers` table to get provider profile
3. Verify provider profile exists and `is_active = true`
4. Query `meal_plans` table with meal plan ID
5. Verify `meal_plans.provider_id` matches `meal_plan_providers.id`
6. For DELETE: Also check `is_deleted = false`

### Rate Limiting
- Applied using `withRateLimit(request, user.id, user.user_type)`
- Provider rate limits (as configured in system)
- Returns 429 if exceeded

### Input Validation
- Use Zod schema validation (`UpdateMealPlanSchema`)
- Sanitize all string inputs
- Validate UUIDs for meal plan IDs
- Reject any attempt to update immutable or system fields

### Database Security
- Use parameterized queries (Supabase handles this)
- Never expose internal database errors to client
- Log security-relevant events (ownership violations, etc.)

---

## Error Handling

### Error Response Format
All errors follow the standard format:
```typescript
{
  success: false,
  error: {
    code: string        // Error code (e.g., "VALIDATION_ERROR")
    message: string     // Human-readable error message
    details?: any       // Optional additional error details
  }
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors, missing fields)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions, not owner)
- `404` - Not Found (meal plan or provider not found)
- `409` - Conflict (already deleted)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error (unexpected errors)

### Error Handling Best Practices
1. Use custom error classes (`ValidationError`, `AuthenticationError`, etc.)
2. Always use `handleAPIError()` in catch blocks
3. Log errors server-side with `console.error()`
4. Never expose sensitive data in error messages
5. Provide actionable error messages to clients
6. Include field names in validation errors

---

## Validation Schema

The `UpdateMealPlanSchema` should be added to `/lib/api/validation.ts`:

```typescript
export const UpdateMealPlanSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  dietary_tags: z.array(z.string()).optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  is_published: z.boolean().optional(),
  is_active: z.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
})
```

**Note:** This schema already exists in the validation file (lines 74-80) but needs the `.refine()` check added.

---

## Testing Requirements

### PATCH Endpoint Tests (Minimum)
1. **Success Cases:**
   - Update single field (title)
   - Update multiple fields
   - Update all allowed fields
   - Publish a draft plan
   - Unpublish a published plan
   - Activate an inactive plan
   - Deactivate an active plan

2. **Validation Failures:**
   - Empty request body (no fields)
   - Invalid title (empty string)
   - Invalid difficulty_level (invalid enum value)
   - Invalid dietary_tags (not an array)

3. **Authentication Failures:**
   - Missing token
   - Invalid token
   - Expired token

4. **Authorization Failures:**
   - User is not a provider
   - Provider doesn't own the meal plan
   - Provider profile not found

5. **Not Found:**
   - Meal plan ID doesn't exist
   - Meal plan is deleted

### DELETE Endpoint Tests (Minimum)
1. **Success Cases:**
   - Delete an active meal plan
   - Verify soft delete (is_deleted = true)
   - Verify provider total_plans decremented

2. **Authentication Failures:**
   - Missing token
   - Invalid token

3. **Authorization Failures:**
   - User is not a provider
   - Provider doesn't own the meal plan

4. **Not Found:**
   - Meal plan ID doesn't exist

5. **Conflict:**
   - Meal plan already deleted

---

## Changelog

### Version 1.0 - 2025-10-09
- Initial API contract specification
- PATCH endpoint specification
- DELETE endpoint specification
- Type definition corrections for `ApiProviderDashboard`
- Security requirements documented
- Testing requirements outlined

---

## Review and Approval

**Created by:** Backend TypeScript Architect Agent
**Review Status:** Pending review by Agent 2 (Frontend Integration Specialist)
**Approval Required:** Yes

**Next Steps:**
1. Agent 2 reviews this contract
2. Discuss any clarifications or changes needed
3. Both agents agree on final contract
4. Backend implements endpoints according to contract
5. Frontend implements API client according to contract
