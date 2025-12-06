# API Routes - Development Guidelines

## Purpose and Scope
This directory contains all Next.js API routes for the Simple Suppers v2 application. API routes handle server-side logic, database interactions, authentication, validation, and business logic.

## Core Principles

### 1. Standardized Route Structure
All API routes follow Next.js 13+ App Router conventions:
```
app/api/
├── auth/                   # Authentication endpoints
├── admin/                  # Admin-only endpoints
├── creators/              # Creator/provider endpoints
├── feed/                  # Social feed endpoints
├── meal-plans/            # Public meal plan endpoints
├── purchases/             # Purchase and payment endpoints
├── shopping-lists/        # Shopping list generation
└── user/                  # User profile and dashboard
```

### 2. HTTP Method Handling
Each route exports functions for specific HTTP methods:
```typescript
export async function GET(request: NextRequest) { }
export async function POST(request: NextRequest) { }
export async function PUT(request: NextRequest) { }
export async function PATCH(request: NextRequest) { }
export async function DELETE(request: NextRequest) { }
```

**IMPORTANT**: Always export method handlers for unsupported methods to return proper errors:
```typescript
export async function PUT() {
  return ErrorResponses.methodNotAllowed()
}
```

## Key Patterns and Conventions

### Authentication Pattern
Use the `requireAuth` helper for protected routes:
```typescript
import { requireAuth } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    // Require authentication - throws if not authenticated
    const user = await requireAuth(request)

    // Optional: Check user permissions
    if (!user.is_creator) {
      return ErrorResponses.forbidden('Only creators can access this endpoint')
    }

    // Continue with route logic...
  } catch (error) {
    return handleAPIError(error)
  }
}
```

### Optional Authentication Pattern
For routes that work with or without authentication:
```typescript
import { verifyToken } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from auth header if present
    let userId: string | undefined
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const payload = verifyToken(token)
        userId = payload.id
      } catch {
        // Invalid token, continue without user ID
        userId = undefined
      }
    }

    // Use userId if available
    const data = await getData(userId)
    return NextResponse.json(data)
  } catch (error) {
    return handleAPIError(error)
  }
}
```

### Validation Pattern
Use Zod schemas for all request validation:
```typescript
import { validateBody, validateQuery, CreateMealPlanSchema } from '@/lib/api/validation'
import { ErrorResponses } from '@/lib/api/errors'

// Validate request body (POST/PUT/PATCH)
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = validateBody(CreateMealPlanSchema, body)

  if (!validation.success) {
    return ErrorResponses.validation(validation.error)
  }

  const data = validation.data // Fully typed
  // Continue with validated data...
}

// Validate query parameters (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const validation = validateQuery(MealPlanQuerySchema, searchParams)

  if (!validation.success) {
    return ErrorResponses.validation(validation.error)
  }

  const { limit, offset, category } = validation.data
  // Continue with validated params...
}
```

### Error Handling Pattern
Use standardized error responses:
```typescript
import { handleAPIError, ErrorResponses, SuccessResponses } from '@/lib/api/errors'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Validate input
    if (!data) {
      return ErrorResponses.validation('Missing required fields')
    }

    // Check permissions
    if (!hasPermission) {
      return ErrorResponses.forbidden('Insufficient permissions')
    }

    // Check resource exists
    if (!resource) {
      return ErrorResponses.notFound('Meal plan')
    }

    // Success
    return SuccessResponses.created({ meal_plan: data })

  } catch (error) {
    // Centralized error handling
    return handleAPIError(error)
  }
}
```

### Rate Limiting Pattern
Apply rate limiting to prevent abuse:
```typescript
import { withRateLimit } from '@/lib/api/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Apply rate limiting based on user type
    withRateLimit(request, user.id, user.user_type)

    // Continue with route logic...
  } catch (error) {
    return handleAPIError(error)
  }
}
```

### Database Query Pattern
Use Supabase admin client for all database operations:
```typescript
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Build query with proper filtering
    const { data, error, count } = await supabaseAdmin
      .from('meal_plans')
      .select('*', { count: 'exact' })
      .eq('created_by_user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error('Failed to fetch meal plans')
    }

    return SuccessResponses.ok({
      meal_plans: data || [],
      total: count || 0
    })
  } catch (error) {
    return handleAPIError(error)
  }
}
```

### Dynamic Route Pattern
Handle dynamic route parameters:
```typescript
// app/api/meal-plans/[id]/route.ts
interface RouteContext {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params

    // Validate UUID
    const validation = validateBody(UUIDSchema, id)
    if (!validation.success) {
      return ErrorResponses.validation('Invalid meal plan ID')
    }

    // Fetch resource
    const { data, error } = await supabaseAdmin
      .from('meal_plans')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return ErrorResponses.notFound('Meal plan')
    }

    return SuccessResponses.ok({ meal_plan: data })
  } catch (error) {
    return handleAPIError(error)
  }
}
```

## Common Tasks

### Creating a New API Route

1. **Create the route file** in the appropriate directory:
   ```
   app/api/[resource]/route.ts
   ```

2. **Import required dependencies**:
   ```typescript
   import { NextRequest } from 'next/server'
   import { requireAuth } from '@/lib/api/auth'
   import { validateBody } from '@/lib/api/validation'
   import { handleAPIError, ErrorResponses, SuccessResponses } from '@/lib/api/errors'
   import { withRateLimit } from '@/lib/api/rate-limit'
   import { supabaseAdmin } from '@/lib/supabase'
   ```

3. **Add JSDoc documentation**:
   ```typescript
   /**
    * GET /api/resource
    * Description of what this endpoint does
    *
    * Authentication: Required/Optional
    * Query Parameters:
    *   - param1: description
    *   - param2: description
    */
   ```

4. **Implement the handler** following the patterns above

5. **Add unsupported method handlers**:
   ```typescript
   export async function PUT() {
     return ErrorResponses.methodNotAllowed()
   }
   ```

### Adding Validation Schema

1. **Define schema in `/lib/api/validation.ts`**:
   ```typescript
   export const MyResourceSchema = z.object({
     field1: z.string().min(1),
     field2: z.number().optional()
   })
   ```

2. **Use in route handler**:
   ```typescript
   const validation = validateBody(MyResourceSchema, body)
   if (!validation.success) {
     return ErrorResponses.validation(validation.error)
   }
   ```

### Implementing Pagination

```typescript
// Define query schema
const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
})

// Use in route
const { limit, offset } = validation.data
const { data, count } = await supabaseAdmin
  .from('table')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)

return SuccessResponses.ok({
  items: data || [],
  total: count || 0,
  limit,
  offset
})
```

## Important Files and Their Roles

### Core API Utilities
- `/lib/api/errors.ts` - Error classes and response helpers
- `/lib/api/validation.ts` - Zod schemas and validation helpers
- `/lib/api/auth.ts` - Authentication and JWT utilities
- `/lib/api/rate-limit.ts` - Rate limiting middleware
- `/lib/supabase.ts` - Supabase client configuration

### Business Logic
- `/lib/api/meal-plans.ts` - Meal plan business logic
- `/lib/api/feed.server.ts` - Feed operations (server-side)
- `/lib/api/creator.ts` - Creator-specific operations
- `/lib/api/user.ts` - User profile operations
- `/lib/api/payments.ts` - Payment processing logic

## Testing Requirements

### Unit Tests
Every API route must have corresponding tests in `__tests__/api/`:

```typescript
// __tests__/api/my-route.test.ts
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/my-route/route'

describe('/api/my-route', () => {
  describe('GET', () => {
    it('should return data successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/my-route')
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should require authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/my-route')
      const response = await GET(request)
      expect(response.status).toBe(401)
    })
  })
})
```

### Test Coverage Requirements
- All HTTP methods: GET, POST, PUT, PATCH, DELETE
- Authentication scenarios: authenticated, unauthenticated, invalid token
- Authorization scenarios: correct permissions, insufficient permissions
- Validation scenarios: valid input, missing fields, invalid types
- Error scenarios: database errors, not found, conflicts

## Common Pitfalls to Avoid

### 1. Missing Error Handling
ALWAYS wrap route handlers in try-catch:
```typescript
// BAD
export async function GET(request: NextRequest) {
  const data = await fetchData() // Can throw
  return NextResponse.json(data)
}

// GOOD
export async function GET(request: NextRequest) {
  try {
    const data = await fetchData()
    return SuccessResponses.ok(data)
  } catch (error) {
    return handleAPIError(error)
  }
}
```

### 2. Inconsistent Response Format
ALWAYS use standardized response helpers:
```typescript
// BAD
return NextResponse.json({ data: result })

// GOOD
return SuccessResponses.ok({ data: result })
```

### 3. Missing Input Validation
ALWAYS validate input before processing:
```typescript
// BAD
const { title, description } = await request.json()
// Use title and description directly

// GOOD
const body = await request.json()
const validation = validateBody(MySchema, body)
if (!validation.success) {
  return ErrorResponses.validation(validation.error)
}
const { title, description } = validation.data
```

### 4. Direct Database Access Without Error Checking
```typescript
// BAD
const { data } = await supabaseAdmin.from('table').select()
return NextResponse.json(data)

// GOOD
const { data, error } = await supabaseAdmin.from('table').select()
if (error) {
  throw new Error('Failed to fetch data')
}
return SuccessResponses.ok({ items: data || [] })
```

### 5. Not Handling Soft Deletes
Always filter out soft-deleted records:
```typescript
// GOOD
const { data } = await supabaseAdmin
  .from('meal_plans')
  .select('*')
  .eq('is_deleted', false) // Important!
```

### 6. Exposing Sensitive Information
Never return sensitive fields directly:
```typescript
// BAD
return SuccessResponses.ok({ user: userData })

// GOOD
const { password_hash, ...safeUserData } = userData
return SuccessResponses.ok({ user: safeUserData })
```

### 7. Not Applying Rate Limiting
Apply rate limiting to all mutation endpoints:
```typescript
export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  withRateLimit(request, user.id, user.user_type) // Important!
  // Continue...
}
```

## Integration Points

### Frontend Integration
Frontend code calls APIs using:
- `/lib/api-client.ts` - Generic fetch wrapper
- `/lib/api/*.client.ts` - Resource-specific client functions
- React Query hooks in `/hooks/use*.ts`

### Database Integration
All database operations use:
- `supabaseAdmin` from `/lib/supabase.ts`
- Type definitions from `/lib/database-types.ts`
- Utility functions from `/lib/database-utils.ts`

### Authentication Integration
Authentication is handled by:
- JWT tokens generated in `/lib/api/auth.ts`
- Tokens stored in client-side auth context
- Tokens sent in `Authorization: Bearer {token}` header

## Performance Best Practices

1. **Use database indexes** - Ensure queries on frequently filtered columns are indexed
2. **Implement pagination** - Always paginate large result sets
3. **Use select specific fields** - Don't select all columns if not needed
4. **Avoid N+1 queries** - Use joins or batch queries when fetching related data
5. **Apply rate limiting** - Prevent abuse and ensure fair usage

## Security Checklist

Before merging any API route:
- [ ] Input validation using Zod schemas
- [ ] Authentication required (if applicable)
- [ ] Authorization checks implemented
- [ ] Rate limiting applied
- [ ] Error messages don't expose sensitive data
- [ ] SQL injection prevented (Supabase parameterizes queries)
- [ ] CORS headers configured correctly
- [ ] Sensitive data filtered from responses
- [ ] Tests cover security scenarios
