# API Integration Plan - Simple Suppers v2

## Overview
This document outlines the test-driven development (TDD) plan for integrating the remaining frontend components with the API backend. This follows the successful completion of the User Dashboard integration.

## Current Status

### ✅ Completed
1. **Foundation Layer**
   - `lib/api-client.ts` - HTTP client with auth token management
   - `lib/api-types.ts` - Complete TypeScript type definitions
   - `lib/api/errors.ts` - Error handling utilities
   - `__tests__/lib/api-client.test.ts` - 30 tests, all passing

2. **User Dashboard Integration**
   - `lib/api/user.ts` - User API functions
   - `hooks/useUserDashboard.ts` - Dashboard data fetching hook
   - `hooks/useUserProfile.ts` - Profile update hook
   - `components/UserProfileForm.tsx` - Profile editing form
   - `components/Dashboard.tsx` - Updated to use real API
   - `__tests__/lib/api/user.test.ts` - Complete test coverage

### ⏸️ Pending
1. **Meal Plans Integration** - Browse, detail, and filtering
2. **Provider Dashboard Integration** - Analytics, meal plan management

---

## Phase 1: Meal Plans Integration

### Current State Analysis

**Components to Update:**
- `components/MealPlanCard.tsx` (65 lines)
- `components/MealPlanDetail.tsx` (88 lines)
- `app/page.tsx` (137 lines)

**Current Issues:**
1. Uses mock data from `lib/data.ts` (sampleData.sampleMealPlans)
2. Uses local `MealPlan` type with `id: number`
3. API returns `ApiMealPlan` type with `id: string`
4. Missing: Filtering, sorting, pagination
5. Missing: Real meal detail data (preview_meals, recipes, shopping_list)

### Architecture Decisions Needed

**Question 1: Type Handling Strategy**
- **Option A**: Update components to use `ApiMealPlan` directly (recommended)
- **Option B**: Create adapter functions to convert API types to local types
- **Decision**: Option A - Use API types directly for consistency

**Question 2: Data Fetching Pattern**
- **Option A**: Create `useMealPlans()` and `useMealPlanDetail()` hooks
- **Option B**: Fetch directly in components
- **Decision**: Option A - Follow hook pattern from User Dashboard

**Question 3: Filter/Sort Implementation**
- **Option A**: Client-side filtering (fetch all, filter in browser)
- **Option B**: Server-side filtering (pass params to API)
- **Decision**: Option B - More scalable, matches API design

### Test Plan - Meal Plans

#### 1. API Functions Tests (`__tests__/lib/api/meal-plans.test.ts`)

**File to Create:** `lib/api/meal-plans.ts`

**Functions to Test:**
```typescript
// Browse meal plans with filters
getMealPlans(params?: {
  category?: string
  dietary_tag?: string
  difficulty?: string
  search?: string
  min_price?: number
  max_price?: number
  is_free?: boolean
  is_featured?: boolean
  sort_by?: string
  page?: number
  limit?: number
}): Promise<APIResponse<{ meal_plans: ApiMealPlan[], total: number }>>

// Get single meal plan detail
getMealPlanDetail(id: string): Promise<APIResponse<ApiMealPlanDetail>>
```

**Test Cases:**
1. ✅ Should fetch all meal plans without filters
2. ✅ Should fetch meal plans with category filter
3. ✅ Should fetch meal plans with dietary tag filter
4. ✅ Should fetch meal plans with search query
5. ✅ Should fetch meal plans with price range
6. ✅ Should fetch free plans only
7. ✅ Should fetch featured plans only
8. ✅ Should handle pagination parameters
9. ✅ Should handle sorting (price_asc, price_desc, rating, newest)
10. ✅ Should fetch meal plan detail by ID
11. ✅ Should handle API errors for browse
12. ✅ Should handle API errors for detail
13. ✅ Should handle 404 for non-existent plan

**Expected Results:**
- All API functions properly call `apiClient` with correct endpoints
- Query parameters are properly serialized
- Response types match `APIResponse<T>` discriminated union
- Error cases are handled

#### 2. Hooks Tests

**File: `__tests__/hooks/useMealPlans.test.ts`**

**Hook to Create:** `hooks/useMealPlans.ts`

**Test Cases:**
1. ✅ Should fetch meal plans on mount
2. ✅ Should update when filters change
3. ✅ Should handle loading state
4. ✅ Should handle error state
5. ✅ Should support refetch functionality
6. ✅ Should support pagination
7. ✅ Should handle empty results
8. ✅ Should debounce search input (optional)

**File: `__tests__/hooks/useMealPlanDetail.test.ts`**

**Hook to Create:** `hooks/useMealPlanDetail.ts`

**Test Cases:**
1. ✅ Should fetch meal plan detail by ID
2. ✅ Should handle loading state
3. ✅ Should handle error state (404, network errors)
4. ✅ Should support refetch functionality
5. ✅ Should handle disabled state (enabled: false)

#### 3. Component Integration Tests

**File: `__tests__/components/MealPlanCard.test.tsx`**

**Test Cases:**
1. ✅ Should render meal plan with API data structure
2. ✅ Should display provider name from nested provider object
3. ✅ Should handle string IDs correctly
4. ✅ Should call onViewDetails with string ID
5. ✅ Should call onSubscribe with string ID
6. ✅ Should display dietary tags
7. ✅ Should display average_rating
8. ✅ Should show free badge for free plans
9. ✅ Should show featured badge for featured plans

**File: `__tests__/components/MealPlanDetail.test.tsx`**

**Test Cases:**
1. ✅ Should render full meal plan detail
2. ✅ Should display provider info from nested object
3. ✅ Should render preview_meals if available
4. ✅ Should handle missing preview_meals gracefully
5. ✅ Should display difficulty_level
6. ✅ Should call onSubscribe with string ID
7. ✅ Should navigate back to browse

### Implementation Plan - Meal Plans

**Step 1: Create API Functions** (TDD - Write tests first)
1. Write `__tests__/lib/api/meal-plans.test.ts` (13 test cases)
2. Run tests → All fail ❌
3. Create `lib/api/meal-plans.ts` with functions
4. Run tests → All pass ✅

**Step 2: Create Hooks** (TDD - Write tests first)
1. Write `__tests__/hooks/useMealPlans.test.ts` (8 test cases)
2. Write `__tests__/hooks/useMealPlanDetail.test.ts` (5 test cases)
3. Run tests → All fail ❌
4. Create `hooks/useMealPlans.ts`
5. Create `hooks/useMealPlanDetail.ts`
6. Run tests → All pass ✅

**Step 3: Update Components** (TDD - Write tests first)
1. Write `__tests__/components/MealPlanCard.test.tsx` (9 test cases)
2. Write `__tests__/components/MealPlanDetail.test.tsx` (7 test cases)
3. Run tests → All fail ❌
4. Update `components/MealPlanCard.tsx` to use `ApiMealPlan` type
5. Update `components/MealPlanDetail.tsx` to use `ApiMealPlanDetail` type
6. Run tests → All pass ✅

**Step 4: Update Browse Page** (Integration)
1. Update `app/page.tsx` browse view:
   - Import `useMealPlans()` hook
   - Add filter state management
   - Add loading/error states
   - Replace mock data with real API data
   - Update ID handling (string vs number)
2. Add filter UI components (optional - can be follow-up)
3. Manual testing in dev environment

**Files to Create:**
- `lib/api/meal-plans.ts`
- `hooks/useMealPlans.ts`
- `hooks/useMealPlanDetail.ts`
- `__tests__/lib/api/meal-plans.test.ts`
- `__tests__/hooks/useMealPlans.test.ts`
- `__tests__/hooks/useMealPlanDetail.test.ts`
- `__tests__/components/MealPlanCard.test.tsx`
- `__tests__/components/MealPlanDetail.test.tsx`

**Files to Modify:**
- `components/MealPlanCard.tsx` - Update types and prop handling
- `components/MealPlanDetail.tsx` - Update types and data structure
- `app/page.tsx` - Replace mock data with hooks

---

## Phase 2: Provider Dashboard Integration

### Current State Analysis

**Component to Update:**
- `components/ProviderDashboard.tsx` (142 lines)

**Current Issues:**
1. Uses mock data from `lib/data.ts`
2. Uses hardcoded stats (3 plans, 234 subscribers, $1,247)
3. Form submission shows alert(), doesn't call API
4. Missing: Analytics data, real meal plan management
5. Missing: Edit, pause/unpause, delete functionality

### Architecture Decisions Needed

**Question 1: Meal Plan Form Strategy**
- **Option A**: Single form component with all fields
- **Option B**: Multi-step wizard (basic info → meals → pricing)
- **Decision**: Option A for MVP, can enhance later

**Question 2: State Management for Dashboard**
- **Option A**: Separate hooks for each section (analytics, meal plans)
- **Option B**: Single `useProviderDashboard()` hook
- **Decision**: Option B - Matches User Dashboard pattern

**Question 3: Meal Plan CRUD Operations**
- **Option A**: Inline editing in dashboard
- **Option B**: Navigate to dedicated edit page
- **Decision**: Option B - Better UX for complex forms

### Test Plan - Provider Dashboard

#### 1. API Functions Tests (`__tests__/lib/api/provider.test.ts`)

**File to Create:** `lib/api/provider.ts`

**Functions to Test:**
```typescript
// Get provider dashboard data
getProviderDashboard(): Promise<APIResponse<ApiProviderDashboard>>

// Create new meal plan
createMealPlan(data: CreateMealPlanRequest): Promise<APIResponse<{ meal_plan: ApiMealPlan }>>

// Update existing meal plan
updateMealPlan(id: string, data: UpdateMealPlanRequest): Promise<APIResponse<{ meal_plan: ApiMealPlan }>>

// Publish/unpublish meal plan
updateMealPlanStatus(id: string, is_published: boolean): Promise<APIResponse<{ meal_plan: ApiMealPlan }>>

// Delete meal plan
deleteMealPlan(id: string): Promise<APIResponse<null>>
```

**Test Cases:**
1. ✅ Should fetch provider dashboard data
2. ✅ Should create new meal plan with all required fields
3. ✅ Should create meal plan with optional fields
4. ✅ Should update meal plan
5. ✅ Should publish meal plan
6. ✅ Should unpublish meal plan
7. ✅ Should delete meal plan
8. ✅ Should handle validation errors (missing required fields)
9. ✅ Should handle API errors
10. ✅ Should handle 404 for non-existent meal plan
11. ✅ Should handle 403 for unauthorized access

#### 2. Hooks Tests

**File: `__tests__/hooks/useProviderDashboard.test.ts`**

**Hook to Create:** `hooks/useProviderDashboard.ts`

**Test Cases:**
1. ✅ Should fetch dashboard data on mount
2. ✅ Should handle loading state
3. ✅ Should handle error state
4. ✅ Should support refetch functionality
5. ✅ Should update when data changes

**File: `__tests__/hooks/useMealPlanForm.test.ts`**

**Hook to Create:** `hooks/useMealPlanForm.ts`

**Test Cases:**
1. ✅ Should create meal plan
2. ✅ Should update meal plan
3. ✅ Should handle loading state during submission
4. ✅ Should handle validation errors
5. ✅ Should handle API errors
6. ✅ Should call success callback
7. ✅ Should call error callback

**File: `__tests__/hooks/useMealPlanActions.test.ts`**

**Hook to Create:** `hooks/useMealPlanActions.ts`

**Test Cases:**
1. ✅ Should publish meal plan
2. ✅ Should unpublish meal plan
3. ✅ Should delete meal plan
4. ✅ Should handle optimistic updates
5. ✅ Should handle error rollback

#### 3. Component Tests

**File: `__tests__/components/ProviderDashboard.test.tsx`**

**Test Cases:**
1. ✅ Should render dashboard with real analytics
2. ✅ Should display meal plans list
3. ✅ Should handle loading state
4. ✅ Should handle error state
5. ✅ Should show empty state when no plans
6. ✅ Should navigate to create form
7. ✅ Should navigate to edit form

**File: `__tests__/components/MealPlanForm.test.tsx`** (new component)

**Test Cases:**
1. ✅ Should render form for new meal plan
2. ✅ Should render form for editing existing plan
3. ✅ Should validate required fields
4. ✅ Should submit valid form data
5. ✅ Should display validation errors
6. ✅ Should display API errors
7. ✅ Should disable form during submission
8. ✅ Should reset form after successful creation
9. ✅ Should handle cancel action

### Implementation Plan - Provider Dashboard

**Step 1: Create API Functions** (TDD - Write tests first)
1. Write `__tests__/lib/api/provider.test.ts` (11 test cases)
2. Run tests → All fail ❌
3. Create `lib/api/provider.ts` with functions
4. Run tests → All pass ✅

**Step 2: Create Hooks** (TDD - Write tests first)
1. Write `__tests__/hooks/useProviderDashboard.test.ts` (5 test cases)
2. Write `__tests__/hooks/useMealPlanForm.test.ts` (7 test cases)
3. Write `__tests__/hooks/useMealPlanActions.test.ts` (5 test cases)
4. Run tests → All fail ❌
5. Create `hooks/useProviderDashboard.ts`
6. Create `hooks/useMealPlanForm.ts`
7. Create `hooks/useMealPlanActions.ts`
8. Run tests → All pass ✅

**Step 3: Create/Update Components** (TDD - Write tests first)
1. Write `__tests__/components/MealPlanForm.test.tsx` (9 test cases)
2. Write `__tests__/components/ProviderDashboard.test.tsx` (7 test cases)
3. Run tests → All fail ❌
4. Create `components/MealPlanForm.tsx` (new component)
5. Update `components/ProviderDashboard.tsx` to use real API
6. Run tests → All pass ✅

**Step 4: Integration** (Manual Testing)
1. Update routing to support create/edit views
2. Add toast notifications for actions
3. Add confirmation dialogs for delete/unpublish
4. Manual testing in dev environment

**Files to Create:**
- `lib/api/provider.ts`
- `hooks/useProviderDashboard.ts`
- `hooks/useMealPlanForm.ts`
- `hooks/useMealPlanActions.ts`
- `components/MealPlanForm.tsx`
- `__tests__/lib/api/provider.test.ts`
- `__tests__/hooks/useProviderDashboard.test.ts`
- `__tests__/hooks/useMealPlanForm.test.ts`
- `__tests__/hooks/useMealPlanActions.test.ts`
- `__tests__/components/MealPlanForm.test.tsx`
- `__tests__/components/ProviderDashboard.test.tsx`

**Files to Modify:**
- `components/ProviderDashboard.tsx` - Replace mock data with hooks
- `app/page.tsx` - Add routing for create/edit views (if needed)

---

## Quality Assurance Checklist

### Before Each Phase
- [ ] All test files written before implementation
- [ ] Test cases cover happy paths and error cases
- [ ] Type definitions match API documentation

### After Each Phase
- [ ] `npm run typecheck` passes with 0 errors
- [ ] All new tests passing
- [ ] All existing tests still passing
- [ ] No console errors in dev environment
- [ ] Error states properly handled (network, validation, 404, 403)
- [ ] Loading states properly displayed
- [ ] Toast notifications working correctly

### Final Integration
- [ ] All components use real API data
- [ ] No mock data remaining in production code
- [ ] All TypeScript errors resolved
- [ ] Responsive design maintained
- [ ] Accessibility maintained (keyboard navigation, ARIA labels)
- [ ] Theme switching works correctly (light/dark)
- [ ] Forms validate properly (React Hook Form + Zod)

---

## Risk Mitigation

### Potential Issues

1. **Type Mismatches Between API and Frontend**
   - **Risk**: API might return slightly different structure than documented
   - **Mitigation**: Comprehensive testing, proper error handling
   - **Fallback**: Add adapter layer if needed

2. **Breaking Changes in Existing Components**
   - **Risk**: Type changes might break other parts of the app
   - **Mitigation**: TypeScript compilation check after each change
   - **Fallback**: Keep backup of original types during transition

3. **Missing API Functionality**
   - **Risk**: API might not support all documented features
   - **Mitigation**: Test against real API early
   - **Fallback**: Mock unavailable features, document for backend team

4. **Performance Issues**
   - **Risk**: Fetching large meal plan lists might be slow
   - **Mitigation**: Implement pagination, lazy loading
   - **Fallback**: Add client-side caching layer

---

## Timeline Estimate

### Phase 1: Meal Plans Integration
- **Tests**: 2-3 hours (35 test cases across 5 files)
- **Implementation**: 3-4 hours (3 new files, 3 modified files)
- **Testing & Fixes**: 1-2 hours
- **Total**: 6-9 hours

### Phase 2: Provider Dashboard Integration
- **Tests**: 2-3 hours (37 test cases across 6 files)
- **Implementation**: 4-5 hours (4 new files, 1 new component, 1 modified file)
- **Testing & Fixes**: 1-2 hours
- **Total**: 7-10 hours

### Overall Project
- **Total Estimated Time**: 13-19 hours
- **Recommended Approach**: Complete Phase 1 fully before starting Phase 2

---

## Open Questions for User

Before proceeding with implementation, please confirm:

### Meal Plans Integration
1. ✅ **Confirmed**: Use API types directly (no adapters)
2. ✅ **Confirmed**: Server-side filtering (pass params to API)
3. ❓ **Needed**: Should we implement filter UI in this phase, or just the data layer?
4. ❓ **Needed**: Should search be debounced? If yes, what delay (300ms, 500ms)?

### Provider Dashboard Integration
5. ❓ **Needed**: Should meal plan form be in a modal or separate page/view?
6. ❓ **Needed**: Should delete action require confirmation dialog?
7. ❓ **Needed**: Should unpublishing a plan require confirmation?
8. ❓ **Needed**: Do we need inline editing for quick changes (title, price), or always navigate to full edit form?

### General
9. ❓ **Needed**: Should I proceed with Phase 1 immediately, or do you want to review this plan first?
10. ❓ **Needed**: Any specific testing priorities or concerns?

---

## Next Steps

**Awaiting User Approval to Proceed**

Once approved, the execution order will be:

1. **Phase 1.1**: Meal Plans API Tests → Implementation
2. **Phase 1.2**: Meal Plans Hooks Tests → Implementation
3. **Phase 1.3**: Meal Plans Component Tests → Implementation
4. **Phase 1.4**: Integration & Manual Testing
5. **Phase 1.5**: Bug Fixes & TypeScript Check
6. **Phase 2.1**: Provider Dashboard API Tests → Implementation
7. **Phase 2.2**: Provider Dashboard Hooks Tests → Implementation
8. **Phase 2.3**: Provider Dashboard Component Tests → Implementation
9. **Phase 2.4**: Integration & Manual Testing
10. **Phase 2.5**: Bug Fixes & TypeScript Check
11. **Final**: Comprehensive testing and documentation update

---

## Success Criteria

The integration will be considered complete when:

- ✅ All test suites passing (100+ tests total)
- ✅ TypeScript compilation: 0 errors
- ✅ No console errors in dev environment
- ✅ All components use real API data (no mock data)
- ✅ Loading states properly implemented
- ✅ Error states properly handled
- ✅ Forms validate correctly
- ✅ Toast notifications work for all actions
- ✅ Responsive design maintained
- ✅ Theme switching functional
- ✅ Accessibility maintained

---

**Document Version**: 1.0
**Last Updated**: 2025-10-09
**Author**: Claude Code
**Status**: Awaiting User Approval
