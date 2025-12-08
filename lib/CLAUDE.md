# Library (lib/) - Development Guidelines

## Purpose and Scope
The `/lib` directory contains all shared utilities, type definitions, API clients, database configurations, and helper functions used throughout the Simple Suppers v2 application.

## Directory Structure

```
lib/
├── api/                         # API-related utilities
│   ├── auth.ts                  # Authentication & JWT handling
│   ├── errors.ts                # Error classes & response helpers
│   ├── validation.ts            # Zod schemas & validators
│   ├── rate-limit.ts            # Rate limiting logic
│   ├── meal-plans.ts            # Meal plan business logic
│   ├── feed.server.ts           # Feed operations (server-side)
│   ├── feed.client.ts           # Feed operations (client-side)
│   ├── creator.ts               # Creator-specific logic
│   ├── user.ts                  # User profile logic
│   └── payments.ts              # Payment processing
├── api-client.ts                # Generic API fetch wrapper
├── api-types.ts                 # API request/response types
├── supabase.ts                  # Supabase client config
├── database-types.ts            # Database table types
├── database-utils.ts            # Database helper functions
├── supabase-types.ts            # Generated Supabase types
├── types.ts                     # App-wide type definitions
├── utils.ts                     # General utility functions
├── theme.ts                     # Theme configuration
├── auth-context.ts              # Auth context provider
├── pdf-generator.ts             # PDF generation utilities
└── unsplash.ts                  # Unsplash API integration
```

## Core Principles

### 1. Separation of Concerns
- **API Logic** (`lib/api/`) - Server-side business logic
- **Client Logic** (`lib/*.client.ts`) - Client-side API calls
- **Type Definitions** (`lib/*-types.ts`) - TypeScript interfaces
- **Utilities** (`lib/utils.ts`) - Pure helper functions
- **Configuration** (`lib/supabase.ts`, `lib/theme.ts`) - App configuration

### 2. Server vs Client Code
```typescript
// Server-only code (lib/api/feed.server.ts)
import { supabaseAdmin } from '../supabase'

export async function getFeedPosts() {
  // Uses admin client, runs on server
  const { data } = await supabaseAdmin.from('feed_posts').select()
  return data
}

// Client-side code (lib/api/feed.client.ts)
export async function getFeedPosts() {
  // Makes fetch request to API route
  const response = await fetch('/api/feed/posts')
  return response.json()
}
```

### 3. Type Safety First
All functions must:
- Have explicit return types
- Use TypeScript generics where appropriate
- Define interfaces for all data structures
- Avoid `any` types

## Key Patterns and Conventions

### API Client Pattern
Use the generic API client for all fetch requests:

```typescript
// lib/api-client.ts
export async function apiClient<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken()

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers
    }
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}

// Usage in resource-specific client
// lib/api/meal-plans.client.ts
import { apiClient } from '../api-client'
import type { MealPlan } from '../database-types'

export async function getMealPlans(): Promise<MealPlan[]> {
  const { meal_plans } = await apiClient<{ meal_plans: MealPlan[] }>(
    '/api/meal-plans'
  )
  return meal_plans
}
```

### Authentication Pattern
JWT token management:

```typescript
// lib/api/auth.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JWTPayload {
  id: string
  email: string
  user_type: 'user' | 'provider'
  is_creator?: boolean
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token')
  }
}

export async function requireAuth(request: NextRequest): Promise<User> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided')
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)

  // Fetch full user data
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', payload.id)
    .single()

  if (error || !user) {
    throw new AuthenticationError('User not found')
  }

  return user
}
```

### Validation Pattern
Centralized Zod schemas:

```typescript
// lib/api/validation.ts
import { z } from 'zod'

// Reusable schemas
export const UUIDSchema = z.string().uuid()
export const EmailSchema = z.string().email()
export const PasswordSchema = z.string().min(6)

// Resource schemas
export const CreateMealPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  duration_days: z.number().min(1),
  category: z.string(),
  dietary_tags: z.array(z.string()).optional()
})

// Helper functions
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join(', ')

  return { success: false, error: errors }
}
```

### Error Handling Pattern
Standardized error classes and responses:

```typescript
// lib/api/errors.ts
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof ValidationError) {
    return createErrorResponse(400, 'VALIDATION_ERROR', error.message)
  }

  if (error instanceof AuthenticationError) {
    return createErrorResponse(401, 'AUTHENTICATION_ERROR', error.message)
  }

  return createErrorResponse(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred')
}

// Convenient response helpers
export const ErrorResponses = {
  validation: (message: string) =>
    createErrorResponse(400, 'VALIDATION_ERROR', message),
  unauthorized: () =>
    createErrorResponse(401, 'AUTHENTICATION_ERROR', 'Authentication required'),
  forbidden: (message: string) =>
    createErrorResponse(403, 'AUTHORIZATION_ERROR', message),
  notFound: (resource: string) =>
    createErrorResponse(404, 'NOT_FOUND', `${resource} not found`)
}

export const SuccessResponses = {
  ok: <T>(data: T) => createSuccessResponse(data, 200),
  created: <T>(data: T) => createSuccessResponse(data, 201)
}
```

### Database Client Pattern
Supabase configuration and usage:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!

// Client-side Supabase (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Configuration checks
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

export function isSupabaseAdminConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey)
}
```

### Type Definition Pattern
Centralized type definitions:

```typescript
// lib/types.ts
export type ViewType =
  | 'landing'
  | 'browse'
  | 'feed'
  | 'dashboard'
  | 'creator'

export interface User {
  id: string
  email: string
  name: string
  user_type: 'user' | 'provider'
  is_creator: boolean
  is_active: boolean
  created_at: string
}

// Database types (lib/database-types.ts)
export interface MealPlan {
  id: string
  created_by_user_id: string
  title: string
  description: string
  duration_days: number
  suggested_price: number
  final_price: number
  is_published: boolean
  created_at: string
  updated_at: string
}

// API types (lib/api-types.ts)
export interface CreateMealPlanRequest {
  title: string
  description: string
  duration_days: number
  suggested_price: number
}

export interface MealPlanResponse {
  meal_plan: MealPlan
}
```

### Utility Functions Pattern
Pure, reusable helper functions:

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Rating display
export function generateStars(rating: number): string {
  const clampedRating = Math.max(0, Math.min(5, rating))
  const fullStars = Math.floor(clampedRating)
  const emptyStars = 5 - fullStars
  return '★'.repeat(fullStars) + '☆'.repeat(emptyStars)
}

// Date formatting
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
```

### Rate Limiting Pattern
Simple in-memory rate limiting:

```typescript
// lib/api/rate-limit.ts
const rateLimitMap = new Map<string, number[]>()

export function withRateLimit(
  request: NextRequest,
  userId: string,
  userType: 'user' | 'provider'
): void {
  const limit = userType === 'provider' ? 100 : 50 // requests per minute
  const key = `${userId}-${request.url}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute

  const timestamps = rateLimitMap.get(key) || []
  const recentTimestamps = timestamps.filter(ts => now - ts < windowMs)

  if (recentTimestamps.length >= limit) {
    throw new RateLimitError('Rate limit exceeded. Please try again later.')
  }

  recentTimestamps.push(now)
  rateLimitMap.set(key, recentTimestamps)
}
```

## Common Tasks

### Adding a New Type Definition

1. **Determine the appropriate file**:
   - App-wide types → `lib/types.ts`
   - Database types → `lib/database-types.ts`
   - API types → `lib/api-types.ts`

2. **Define the interface**:
   ```typescript
   export interface MyNewType {
     id: string
     name: string
     optional?: boolean
   }
   ```

3. **Export and use** throughout the app

### Creating a New Validation Schema

1. **Add to `lib/api/validation.ts`**:
   ```typescript
   export const MyResourceSchema = z.object({
     field1: z.string().min(1),
     field2: z.number().optional()
   })
   ```

2. **Use in API routes**:
   ```typescript
   const validation = validateBody(MyResourceSchema, body)
   ```

### Adding a New API Client Function

1. **Create in appropriate client file** (`lib/api/*.client.ts`):
   ```typescript
   export async function getMyResource(id: string): Promise<MyResource> {
     return apiClient<MyResourceResponse>(`/api/my-resource/${id}`)
       .then(res => res.data)
   }
   ```

2. **Use in components/hooks**:
   ```typescript
   const data = await getMyResource(id)
   ```

### Adding a Server-Side Business Logic Function

1. **Create in appropriate server file** (`lib/api/*.server.ts` or `lib/api/*.ts`):
   ```typescript
   export async function processData(input: Input): Promise<Output> {
     const { data, error } = await supabaseAdmin
       .from('table')
       .select()

     if (error) throw new Error('Failed to fetch')

     // Business logic
     return processedData
   }
   ```

2. **Use in API routes only** (not in components)

## Important Files and Their Roles

### API Utilities
- `lib/api/auth.ts` - JWT generation/verification, authentication helpers
- `lib/api/errors.ts` - Error classes, response helpers, error handling
- `lib/api/validation.ts` - Zod schemas, validation helpers
- `lib/api/rate-limit.ts` - Rate limiting implementation

### Business Logic
- `lib/api/meal-plans.ts` - Meal plan CRUD operations
- `lib/api/feed.server.ts` - Feed operations (server-side)
- `lib/api/creator.ts` - Creator-specific operations
- `lib/api/user.ts` - User profile operations
- `lib/api/payments.ts` - Payment processing logic

### Client Functions
- `lib/api/feed.client.ts` - Feed API client functions
- `lib/api-client.ts` - Generic fetch wrapper

### Configuration
- `lib/supabase.ts` - Supabase client configuration
- `lib/theme.ts` - Theme configuration
- `lib/auth-context.ts` - Authentication context provider

### Types
- `lib/types.ts` - App-wide type definitions
- `lib/database-types.ts` - Database table interfaces
- `lib/supabase-types.ts` - Generated Supabase types (DO NOT EDIT)
- `lib/api-types.ts` - API request/response types

### Utilities
- `lib/utils.ts` - General utility functions
- `lib/database-utils.ts` - Database helper functions
- `lib/pdf-generator.ts` - PDF generation
- `lib/unsplash.ts` - Unsplash API integration

## Testing Requirements

### Unit Tests
All library functions must have unit tests:

```typescript
// __tests__/lib/utils.test.ts
import { generateStars, cn } from '@/lib/utils'

describe('utils', () => {
  describe('generateStars', () => {
    it('generates correct star string', () => {
      expect(generateStars(3)).toBe('★★★☆☆')
      expect(generateStars(5)).toBe('★★★★★')
      expect(generateStars(0)).toBe('☆☆☆☆☆')
    })

    it('clamps rating between 0 and 5', () => {
      expect(generateStars(-1)).toBe('☆☆☆☆☆')
      expect(generateStars(6)).toBe('★★★★★')
    })
  })

  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('p-4', 'bg-white')).toBe('p-4 bg-white')
    })
  })
})
```

### API Function Tests
```typescript
// __tests__/lib/api/user.test.ts
import { getUserProfile } from '@/lib/api/user'

describe('User API', () => {
  it('fetches user profile', async () => {
    const profile = await getUserProfile('user-id')
    expect(profile).toBeDefined()
    expect(profile.id).toBe('user-id')
  })
})
```

## Common Pitfalls to Avoid

### 1. Mixing Server and Client Code
```typescript
// BAD - Using server-side code in client component
'use client'
import { supabaseAdmin } from '@/lib/supabase'

// GOOD - Use client-appropriate code
'use client'
import { getMealPlans } from '@/lib/api/meal-plans.client'
```

### 2. Not Validating Input
```typescript
// BAD
export function processData(input: any) {
  return input.field.toUpperCase()
}

// GOOD
export function processData(input: unknown) {
  const validation = validateBody(InputSchema, input)
  if (!validation.success) {
    throw new ValidationError(validation.error)
  }
  return validation.data.field.toUpperCase()
}
```

### 3. Exposing Secrets in Client Code
```typescript
// BAD - Service key exposed to client
export const API_KEY = process.env.SUPABASE_SECRET_KEY

// GOOD - Only use public keys on client
export const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

### 4. Not Handling Errors
```typescript
// BAD
export async function getData() {
  const { data } = await supabaseAdmin.from('table').select()
  return data
}

// GOOD
export async function getData() {
  const { data, error } = await supabaseAdmin.from('table').select()
  if (error) {
    throw new Error('Failed to fetch data')
  }
  return data || []
}
```

### 5. Using 'any' Type
```typescript
// BAD
export function process(data: any): any {
  return data
}

// GOOD
export function process<T>(data: T): T {
  return data
}
```

### 6. Not Exporting Types
```typescript
// BAD - Type only used internally
interface InternalType {
  field: string
}

// GOOD - Export for reuse
export interface SharedType {
  field: string
}
```

### 7. Hardcoding Configuration
```typescript
// BAD
const API_URL = 'http://localhost:3000'

// GOOD
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
```

## Integration Points

### With API Routes
- API routes import server-side functions from `lib/api/*.ts`
- Use validation schemas from `lib/api/validation.ts`
- Use error handling from `lib/api/errors.ts`

### With Components
- Components import client-side functions from `lib/api/*.client.ts`
- Use types from `lib/types.ts` and `lib/database-types.ts`
- Use utilities from `lib/utils.ts`

### With Hooks
- Hooks wrap client-side API functions
- Use types for hook return values
- Handle errors using error classes

### With Database
- All database operations use `supabaseAdmin` from `lib/supabase.ts`
- Types match database schema from `lib/database-types.ts`
- Helper functions from `lib/database-utils.ts`

## Best Practices

1. **Keep functions pure** when possible - no side effects
2. **Export everything** that might be reused
3. **Document complex logic** with JSDoc comments
4. **Use TypeScript generics** for flexible, type-safe functions
5. **Separate concerns** - one responsibility per function
6. **Handle all error cases** explicitly
7. **Validate all inputs** from external sources
8. **Use environment variables** for configuration
9. **Write tests** for all exported functions
10. **Follow naming conventions** - descriptive, consistent names

## Performance Considerations

1. **Memoize expensive computations**
2. **Use database indexes** for frequently queried fields
3. **Batch database operations** when possible
4. **Cache API responses** appropriately
5. **Avoid unnecessary data transformations**
6. **Use pagination** for large datasets
7. **Minimize bundle size** - tree-shake unused code

## Security Checklist

Before merging library code:
- [ ] No secrets in client-accessible code
- [ ] All inputs validated
- [ ] SQL injection prevented (Supabase handles this)
- [ ] Authentication required where needed
- [ ] Authorization checks implemented
- [ ] Rate limiting applied to sensitive operations
- [ ] Error messages don't expose sensitive data
- [ ] Dependencies up to date and secure
