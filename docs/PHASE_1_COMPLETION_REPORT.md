# Phase 1 Completion Report - API Contract Coordination

**Agent:** Backend TypeScript Architect
**Date:** 2025-10-09
**Status:** COMPLETE - Awaiting Agent 2 Review

---

## Summary

Phase 1 (API Contract Coordination) is complete. I have analyzed the existing codebase, identified patterns, and created a comprehensive API contract document for the missing provider meal plan management endpoints.

---

## Deliverables

### 1. API Contract Document
**File:** `/mnt/e/vscode/simple-suppers-v2/docs/API_CONTRACT_PROVIDER.md`

**Contents:**
- Complete specification for `PATCH /api/providers/meal-plans/[id]`
- Complete specification for `DELETE /api/providers/meal-plans/[id]`
- Corrected type definitions for `ApiProviderDashboard`
- Security requirements and authorization flow
- Error handling patterns and status codes
- Validation schema specifications
- Testing requirements (15+ test cases minimum)
- Cascade behavior documentation for DELETE

---

## Key Findings from Analysis

### 1. Existing Patterns Identified

**Authentication Pattern:**
```typescript
const user = await requireAuth(request)
withRateLimit(request, user.id, user.user_type)
if (user.user_type !== 'provider') {
  return ErrorResponses.forbidden('Only providers can access this endpoint')
}
```

**Validation Pattern:**
```typescript
const validation = validateBody(UpdateMealPlanSchema, body)
if (!validation.success) {
  return ErrorResponses.validation(validation.error)
}
```

**Ownership Check Pattern:**
```typescript
const { data: provider } = await supabase
  .from('meal_plan_providers')
  .select('id')
  .eq('user_id', user.id)
  .single()

const { data: mealPlan } = await supabase
  .from('meal_plans')
  .select('*')
  .eq('id', mealPlanId)
  .eq('provider_id', provider.id)
  .single()
```

**Response Pattern:**
```typescript
return SuccessResponses.ok({ meal_plan: updatedPlan })
return ErrorResponses.notFound('Meal plan')
```

### 2. Type Mismatch Discovered

**Location:** `/lib/api-types.ts` lines 273-285

**Issue:** The `ApiProviderDashboard` type does not match the actual response from `GET /api/providers/dashboard`

**Current Type (WRONG):**
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

**Actual API Response:**
```typescript
{
  provider: { id, business_name, bio, ... },
  analytics: { total_meal_plans, published_plans, ... },
  recent_purchases: [...],
  top_performing_plans: [...]
}
```

**Resolution:** Phase 2 will update the type definition to match reality.

### 3. Validation Schema Status

The `UpdateMealPlanSchema` exists in `/lib/api/validation.ts` (lines 74-80) but needs enhancement:

**Current:**
```typescript
export const UpdateMealPlanSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  dietary_tags: z.array(z.string()).optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional()
})
```

**Needs:**
- Add `is_published?: boolean`
- Add `is_active?: boolean`
- Add `.refine()` check to ensure at least one field is provided

---

## API Contract Highlights

### PATCH Endpoint Specification

**Allowed Update Fields:**
- `title` (string, min 1 char)
- `description` (string, min 1 char)
- `category` (string, min 1 char)
- `dietary_tags` (string array)
- `difficulty_level` (enum)
- `is_published` (boolean)
- `is_active` (boolean)

**Forbidden Fields:**
- Cannot update: `duration_days`, `duration_type`, `suggested_price`, `final_price`, `is_free`, `is_featured`
- Immutable: `id`, `provider_id`, `created_at`
- System metrics: `total_purchases`, `total_views`, `average_rating`, `rating_count`

**Security Flow:**
1. Authentication (requireAuth)
2. Rate limiting (withRateLimit)
3. Provider type check
4. Provider profile lookup
5. Meal plan existence check
6. Ownership verification
7. Validation
8. Update operation

### DELETE Endpoint Specification

**Soft Delete Strategy:**
- Set `is_deleted = true`
- Set `is_active = false`
- Set `is_published = false`
- Decrement provider's `total_plans` count
- Keep all related data (days, meals, purchases)

**Cascade Behavior:**
- Existing purchases remain valid
- Users keep access to purchased plans
- Reviews remain visible
- Plan hidden from public listings

**Security Flow:**
1. Authentication (requireAuth)
2. Rate limiting (withRateLimit)
3. Provider type check
4. Provider profile lookup
5. Meal plan existence check
6. Already deleted check
7. Ownership verification
8. Soft delete operation

---

## Testing Requirements

**Total Test Cases Required:** 15+

**PATCH Tests (10):**
- 3 success cases (single field, multiple fields, publish/unpublish)
- 3 validation failures (empty body, invalid fields, wrong types)
- 2 authentication failures (missing token, invalid token)
- 2 authorization failures (not provider, not owner)
- 1 not found (meal plan doesn't exist)

**DELETE Tests (5+):**
- 1 success case (soft delete and verify)
- 2 authentication failures (missing/invalid token)
- 2 authorization failures (not provider, not owner)
- 1 not found (meal plan doesn't exist)
- 1 conflict (already deleted)

---

## Database Schema Reference

**Relevant Tables:**

1. **users**
   - `id`, `email`, `name`, `user_type`, `is_active`, `is_deleted`

2. **meal_plan_providers**
   - `id`, `user_id`, `business_name`, `total_plans`, `total_earnings`, `average_rating`, `is_active`

3. **meal_plans**
   - `id`, `provider_id`, `title`, `description`, `duration_days`, `duration_type`
   - `suggested_price`, `final_price`, `category`, `dietary_tags`, `difficulty_level`
   - `is_free`, `is_featured`, `is_published`, `is_active`, `is_deleted`
   - `total_purchases`, `total_views`, `average_rating`, `rating_count`
   - `created_at`, `updated_at`

4. **meal_plan_days**
   - `id`, `meal_plan_id`, `day_number`, `day_title`

5. **meals**
   - `id`, `meal_plan_day_id`, `meal_type`, `meal_name`, `ingredients`, etc.

---

## Next Steps - Phase 2

Once Agent 2 reviews and approves this API contract, I will proceed with Phase 2:

1. **Create Backend Endpoints**
   - File: `/app/api/providers/meal-plans/[id]/route.ts`
   - Implement PATCH handler
   - Implement DELETE handler

2. **Enhance Validation**
   - Update `UpdateMealPlanSchema` to include `is_published` and `is_active`
   - Add `.refine()` check for at least one field

3. **Fix Type Definitions**
   - Replace `ApiProviderDashboard` with corrected `ApiProviderDashboardResponse`
   - Ensure alignment with actual API response

4. **Write Comprehensive Tests**
   - File: `/__tests__/api/providers-meal-plans-id.test.ts`
   - Minimum 15 test cases covering all scenarios

5. **Verify Everything**
   - Run tests: `npm test`
   - Run typecheck: `npm run typecheck`
   - Ensure 0 errors

---

## Questions for Agent 2 (Frontend Integration Specialist)

Before proceeding to implementation, please review the API contract and confirm:

1. **PATCH Endpoint:**
   - Are the allowed update fields sufficient for the provider dashboard UI?
   - Is the response format what you need?
   - Any additional fields needed in the response?

2. **DELETE Endpoint:**
   - Is the soft delete approach acceptable?
   - Do you need additional data in the success response?
   - Should we return the deleted meal plan details?

3. **Type Definitions:**
   - Does the corrected `ApiProviderDashboardResponse` type match your frontend needs?
   - Any additional fields or nested structures needed?

4. **Error Handling:**
   - Are the error codes and messages clear enough for UI feedback?
   - Do you need any additional error details?

5. **Testing:**
   - Are there any edge cases I should add to the testing requirements?
   - Any specific scenarios your frontend integration will rely on?

---

## Coordination Notes

- This API contract is a **living document**
- Changes can be made if both agents agree
- Backend implementation will strictly follow this contract
- Frontend implementation should strictly follow this contract
- Any deviations should be discussed and documented

---

## Files to Review

1. **API Contract:** `/docs/API_CONTRACT_PROVIDER.md`
2. **Existing POST Pattern:** `/app/api/providers/meal-plans/route.ts`
3. **Existing Dashboard:** `/app/api/providers/dashboard/route.ts`
4. **Type Definitions:** `/lib/api-types.ts`
5. **Validation Schemas:** `/lib/api/validation.ts`

---

## Conclusion

Phase 1 is complete. The API contract provides a comprehensive specification for:
- PATCH and DELETE endpoints
- Request/response formats
- Validation rules
- Security requirements
- Error handling
- Testing requirements

Awaiting Agent 2's review and approval before proceeding to Phase 2 implementation.
