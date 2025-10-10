# API Client Usage Guide

## Overview
The `apiClient` provides a type-safe, centralized way to make API requests in the Simple Suppers v2 application.

## Basic Setup

### 1. Import the client and types
```typescript
import { apiClient } from '@/lib/api-client'
import type { ApiMealPlansResponse, ApiMealPlan } from '@/lib/api-types'
import type { APIResponse } from '@/lib/api/errors'
```

### 2. Authentication
The client automatically handles JWT tokens stored in `localStorage` with the key `'auth_token'`.

```typescript
// After successful login, store the token
localStorage.setItem('auth_token', token)

// The client will automatically include it in subsequent requests
const response = await apiClient.get('/user/profile')

// To logout, simply remove the token
localStorage.removeItem('auth_token')
```

## Making Requests

### GET Requests
```typescript
// Simple GET
const response: APIResponse<ApiMealPlansResponse> = await apiClient.get('/meal-plans')

// GET with query parameters
const response = await apiClient.get('/meal-plans', {
  category: 'family',
  limit: 20,
  offset: 0,
  dietary_tags: ['vegetarian', 'gluten-free'],
  is_free: false
})
```

### POST Requests
```typescript
// Login example
const response = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
})

if (response.success) {
  const { user, token } = response.data
  localStorage.setItem('auth_token', token)
}

// Create payment intent
const response = await apiClient.post('/purchases/create-intent', {
  meal_plan_id: 'plan-uuid-123'
})
```

### PUT/PATCH Requests
```typescript
// Update user profile (PUT)
const response = await apiClient.put('/user/profile', {
  name: 'John Doe',
  dietary_preferences: ['vegetarian', 'low-carb']
})

// Partial update (PATCH)
const response = await apiClient.patch('/user/profile', {
  name: 'Jane Doe'
})
```

### DELETE Requests
```typescript
const response = await apiClient.delete('/some-resource/123')
```

## Error Handling

The client handles both simple and detailed error formats:

```typescript
try {
  const response = await apiClient.get('/meal-plans/invalid-id')
  if (response.success) {
    // Handle success
    const data = response.data
  }
} catch (error) {
  // Error is thrown with the message from the API
  console.error(error.message) // "Meal plan not found"
}
```

## Response Format

All successful responses follow this structure:
```typescript
{
  success: true,
  data: {
    // Response data here
  }
}
```

Error responses:
```typescript
// Simple format
{
  success: false,
  error: "Error message"
}

// Detailed format
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid data provided",
    details: { field: "email" }
  }
}
```

## Using with React Hooks

Example custom hook:
```typescript
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import type { ApiMealPlansResponse } from '@/lib/api-types'

export function useMealPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get<ApiMealPlansResponse>('/meal-plans')
        if (response.success) {
          setPlans(response.data.plans)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  return { plans, loading, error }
}
```

## Configuration

### Base URL
Set the base URL via environment variable:
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Falls back to `/api` if not set.

## Testing

When testing components that use the API client, mock the module:

```typescript
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}))
```

## Type Safety

Always specify the expected response type:

```typescript
import type { ApiMealPlanDetailResponse } from '@/lib/api-types'

const response = await apiClient.get<ApiMealPlanDetailResponse>('/meal-plans/123')
if (response.success) {
  // TypeScript knows the exact shape of response.data
  const mealPlan = response.data.meal_plan
}
```

## Best Practices

1. **Always handle errors**: Wrap API calls in try-catch blocks
2. **Use TypeScript types**: Import and use the types from `api-types.ts`
3. **Check success flag**: Always check `response.success` before accessing `response.data`
4. **Token management**: Handle token storage/removal on login/logout
5. **Loading states**: Show loading indicators during API calls
6. **SSR compatibility**: The client handles server-side rendering automatically
