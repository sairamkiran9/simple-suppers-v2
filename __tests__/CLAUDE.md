# Testing - Development Guidelines

## Purpose and Scope
This directory contains all test files for the Simple Suppers v2 application. Tests cover API routes, React components, custom hooks, library utilities, and integration workflows.

## Directory Structure

```
__tests__/
├── api/                        # API route tests
│   ├── auth.test.ts            # Authentication endpoints
│   ├── meal-plans.test.ts      # Meal plan endpoints
│   ├── creators.test.ts        # Creator endpoints
│   ├── feed/                   # Feed-related tests
│   │   ├── posts.test.ts       # Feed posts endpoint
│   │   ├── posts-like.test.ts  # Like functionality
│   │   └── posts-comments.test.ts # Comments
│   └── ...
├── components/                 # Component tests
│   ├── Navigation.test.tsx     # Navigation component
│   ├── Feed.test.tsx           # Feed component
│   └── ...
├── hooks/                      # Custom hook tests
│   ├── useFeedPosts.test.tsx   # Feed posts hook
│   ├── useMealPlans.test.tsx   # Meal plans hook
│   └── ...
├── lib/                        # Library utility tests
│   ├── utils.test.ts           # Utility functions
│   ├── api/                    # API utility tests
│   │   ├── user.test.ts
│   │   └── feed.test.ts
│   └── ...
├── integration/                # Integration tests
│   ├── feed-workflow.test.tsx  # Feed feature workflow
│   └── user-dashboard.test.tsx # Dashboard workflow
└── database/                   # Database tests
    └── database-setup.test.ts  # DB configuration
```

## Test Environment Configuration

### Jest Projects
The application uses Jest with three separate test environments:

1. **jsdom** - For components, hooks, and integration tests
2. **node** - For API route tests
3. **node** - For database tests

See `jest.config.js` for configuration details.

### Test Setup Files
- `jest.setup.js` - Setup for component/hook tests (jsdom)
- `jest.setup.api.js` - Setup for API route tests (node)
- `jest.setup.database.js` - Setup for database tests (node)

## Core Principles

### 1. Test Organization
- **One test file per source file** - mirror the source structure
- **Descriptive test names** - what is being tested, not how
- **AAA pattern** - Arrange, Act, Assert
- **Independent tests** - no shared state between tests

### 2. Coverage Requirements
From `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

### 3. Test Types
1. **Unit Tests** - Individual functions/components in isolation
2. **Integration Tests** - Multiple components/features working together
3. **API Tests** - HTTP endpoints with mocked dependencies
4. **Hook Tests** - Custom React hooks with renderHook

## Key Patterns and Conventions

### API Route Testing Pattern

```typescript
// __tests__/api/my-route.test.ts
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/my-route/route'

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}))

jest.mock('@/lib/api/auth', () => ({
  requireAuth: jest.fn(),
  verifyToken: jest.fn()
}))

describe('/api/my-route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return data successfully', async () => {
      const { requireAuth } = require('@/lib/api/auth')
      requireAuth.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com'
      })

      const request = new NextRequest('http://localhost:3000/api/my-route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should require authentication', async () => {
      const { requireAuth } = require('@/lib/api/auth')
      requireAuth.mockRejectedValue(new Error('Not authenticated'))

      const request = new NextRequest('http://localhost:3000/api/my-route')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should validate query parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/my-route?invalid=param'
      )
      const response = await GET(request)

      expect(response.status).toBe(400)
    })

    it('should handle database errors', async () => {
      const { requireAuth } = require('@/lib/api/auth')
      requireAuth.mockResolvedValue({ id: 'user-123' })

      // Mock database error
      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Database error' }
        }))
      })

      const request = new NextRequest('http://localhost:3000/api/my-route')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('should create resource successfully', async () => {
      const { requireAuth } = require('@/lib/api/auth')
      requireAuth.mockResolvedValue({
        id: 'user-123',
        is_creator: true
      })

      const request = new NextRequest('http://localhost:3000/api/my-route', {
        method: 'POST',
        headers: { authorization: 'Bearer token' },
        body: JSON.stringify({
          title: 'Test',
          description: 'Test description'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })

    it('should validate request body', async () => {
      const { requireAuth } = require('@/lib/api/auth')
      requireAuth.mockResolvedValue({ id: 'user-123' })

      const request = new NextRequest('http://localhost:3000/api/my-route', {
        method: 'POST',
        headers: { authorization: 'Bearer token' },
        body: JSON.stringify({}) // Missing required fields
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should check authorization', async () => {
      const { requireAuth } = require('@/lib/api/auth')
      requireAuth.mockResolvedValue({
        id: 'user-123',
        is_creator: false // Not a creator
      })

      const request = new NextRequest('http://localhost:3000/api/my-route', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' })
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })
  })
})
```

### Component Testing Pattern

```typescript
// __tests__/components/MyComponent.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/MyComponent'

// Mock dependencies
jest.mock('@/hooks/useData', () => ({
  useData: jest.fn()
}))

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { useData } = require('@/hooks/useData')
    useData.mockReturnValue({
      data: [{ id: '1', name: 'Test' }],
      loading: false,
      error: null
    })

    render(<MyComponent />)

    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    const { useData } = require('@/hooks/useData')
    useData.mockReturnValue({
      data: [],
      loading: true,
      error: null
    })

    render(<MyComponent />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error state', () => {
    const { useData } = require('@/hooks/useData')
    useData.mockReturnValue({
      data: [],
      loading: false,
      error: 'Failed to load'
    })

    render(<MyComponent />)

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const user = userEvent.setup()
    const onAction = jest.fn()

    render(<MyComponent onAction={onAction} />)

    const button = screen.getByRole('button', { name: /submit/i })
    await user.click(button)

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('supports dark mode', () => {
    render(<MyComponent />)

    const element = screen.getByTestId('my-element')
    expect(element).toHaveClass('dark:bg-gray-800')
  })

  it('renders children correctly', () => {
    render(
      <MyComponent>
        <div>Child content</div>
      </MyComponent>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })
})
```

### Hook Testing Pattern

```typescript
// __tests__/hooks/useMyHook.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMyHook } from '@/hooks/useMyHook'

// Mock API
jest.mock('@/lib/api/my-api.client', () => ({
  fetchData: jest.fn()
}))

describe('useMyHook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useMyHook())

    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('fetches data successfully', async () => {
    const { fetchData } = require('@/lib/api/my-api.client')
    const mockData = [{ id: '1', name: 'Test' }]
    fetchData.mockResolvedValue(mockData)

    const { result } = renderHook(() => useMyHook())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('handles API errors', async () => {
    const { fetchData } = require('@/lib/api/my-api.client')
    fetchData.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useMyHook())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('API Error')
    expect(result.current.data).toEqual([])
  })

  it('refetches data when refresh is called', async () => {
    const { fetchData } = require('@/lib/api/my-api.client')
    fetchData.mockResolvedValue([{ id: '1', name: 'Test' }])

    const { result } = renderHook(() => useMyHook())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    fetchData.mockResolvedValue([{ id: '2', name: 'Updated' }])

    act(() => {
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.data[0].name).toBe('Updated')
    })
  })

  it('debounces rapid calls', async () => {
    const { fetchData } = require('@/lib/api/my-api.client')
    fetchData.mockResolvedValue([])

    const { result } = renderHook(() => useMyHook())

    act(() => {
      result.current.refresh()
      result.current.refresh()
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should only call once despite multiple refresh calls
    expect(fetchData).toHaveBeenCalledTimes(2) // Initial + 1 debounced
  })
})
```

### Library Function Testing Pattern

```typescript
// __tests__/lib/utils.test.ts
import { generateStars, cn, formatDate } from '@/lib/utils'

describe('utils', () => {
  describe('generateStars', () => {
    it('generates correct star string for valid ratings', () => {
      expect(generateStars(0)).toBe('☆☆☆☆☆')
      expect(generateStars(1)).toBe('★☆☆☆☆')
      expect(generateStars(3)).toBe('★★★☆☆')
      expect(generateStars(5)).toBe('★★★★★')
    })

    it('handles decimal ratings', () => {
      expect(generateStars(3.7)).toBe('★★★☆☆')
      expect(generateStars(4.2)).toBe('★★★★☆')
    })

    it('clamps rating to valid range', () => {
      expect(generateStars(-5)).toBe('☆☆☆☆☆')
      expect(generateStars(10)).toBe('★★★★★')
    })
  })

  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
    })

    it('handles conditional classes', () => {
      expect(cn('base', false && 'hidden', true && 'block')).toBe('base block')
    })

    it('resolves Tailwind conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
    })
  })

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const date = '2024-01-15'
      expect(formatDate(date)).toBe('January 15, 2024')
    })

    it('handles Date objects', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('January 15, 2024')
    })
  })
})
```

### Integration Testing Pattern

```typescript
// __tests__/integration/feed-workflow.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Feed } from '@/components/Feed'

describe('Feed Workflow', () => {
  it('completes full create-view-delete workflow', async () => {
    const user = userEvent.setup()

    // Mock authentication
    jest.mock('@/lib/auth-context', () => ({
      useAuth: () => ({
        user: { id: 'user-123', name: 'Test User' },
        isAuthenticated: true
      })
    }))

    render(<Feed />)

    // Step 1: Open create modal
    const createButton = screen.getByRole('button', { name: /share something/i })
    await user.click(createButton)

    // Step 2: Fill form
    const titleInput = screen.getByLabelText(/title/i)
    const contentInput = screen.getByLabelText(/content/i)

    await user.type(titleInput, 'Test Post')
    await user.type(contentInput, 'This is a test post')

    // Step 3: Submit
    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)

    // Step 4: Verify post appears
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
      expect(screen.getByText('This is a test post')).toBeInTheDocument()
    })

    // Step 5: Delete post
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)

    // Step 6: Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    // Step 7: Verify post removed
    await waitFor(() => {
      expect(screen.queryByText('Test Post')).not.toBeInTheDocument()
    })
  })
})
```

## Common Tasks

### Creating a New Test File

1. **Create test file** mirroring source structure:
   ```
   Source: components/MyComponent.tsx
   Test: __tests__/components/MyComponent.test.tsx
   ```

2. **Import dependencies**:
   ```typescript
   import { render, screen } from '@testing-library/react'
   import { MyComponent } from '@/components/MyComponent'
   ```

3. **Set up mocks**:
   ```typescript
   jest.mock('@/hooks/useData')
   ```

4. **Write describe block**:
   ```typescript
   describe('MyComponent', () => {
     beforeEach(() => {
       jest.clearAllMocks()
     })

     it('renders correctly', () => {
       // Test implementation
     })
   })
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test MyComponent.test

# Run tests matching pattern
npm test -- --testNamePattern="renders correctly"

# Run only API tests
npm test -- --selectProjects=api

# Run only component tests
npm test -- --selectProjects=jsdom
```

### Debugging Tests

```typescript
// Add debug output
import { render, screen } from '@testing-library/react'

render(<MyComponent />)
screen.debug() // Prints DOM

// Use only/skip for focused testing
it.only('runs only this test', () => {})
it.skip('skips this test', () => {})

// Add console logs
console.log('Current state:', result.current)
```

## Important Testing Utilities

### Testing Library Queries
```typescript
// Prefer accessible queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByText(/hello/i)

// Use queryBy for assertions about absence
expect(screen.queryByText('Not here')).not.toBeInTheDocument()

// Use findBy for async elements
await screen.findByText('Async content')
```

### User Event
```typescript
import userEvent from '@testing-library/user-event'

const user = userEvent.setup()

// Click
await user.click(button)

// Type
await user.type(input, 'Hello')

// Clear and type
await user.clear(input)
await user.type(input, 'New value')

// Select
await user.selectOptions(select, 'option1')

// Keyboard
await user.keyboard('{Enter}')
```

### Wait Utilities
```typescript
import { waitFor, waitForElementToBeRemoved } from '@testing-library/react'

// Wait for condition
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})

// Wait for element to be removed
await waitForElementToBeRemoved(() => screen.queryByText('Loading'))
```

## Mock Patterns

### Supabase Mock
```typescript
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({
        data: mockData,
        error: null
      }))
    }))
  }
}))
```

### API Client Mock
```typescript
jest.mock('@/lib/api-client', () => ({
  apiClient: jest.fn()
}))

// In test
const { apiClient } = require('@/lib/api-client')
apiClient.mockResolvedValue({ data: mockData })
```

### Next Router Mock
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}))
```

## Common Pitfalls to Avoid

### 1. Not Cleaning Up Between Tests
```typescript
// BAD
describe('Tests', () => {
  it('test 1', () => {
    // Leaves mocks in place
  })
})

// GOOD
describe('Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
})
```

### 2. Testing Implementation Details
```typescript
// BAD - Testing internal state
expect(component.state.value).toBe('test')

// GOOD - Testing behavior
expect(screen.getByText('test')).toBeInTheDocument()
```

### 3. Not Waiting for Async Updates
```typescript
// BAD
render(<Component />)
expect(screen.getByText('Loaded')).toBeInTheDocument() // Fails

// GOOD
render(<Component />)
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### 4. Using Wrong Queries
```typescript
// BAD - Not accessible
screen.getByTestId('submit-button')

// GOOD - Accessible
screen.getByRole('button', { name: /submit/i })
```

### 5. Not Mocking Dependencies
```typescript
// BAD - Real API calls in tests
import { fetchData } from '@/lib/api'
// Uses real API

// GOOD
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn()
}))
```

### 6. Shared Test State
```typescript
// BAD
let sharedData = []

it('test 1', () => {
  sharedData.push('item')
})

it('test 2', () => {
  expect(sharedData).toHaveLength(0) // Fails!
})

// GOOD
describe('Tests', () => {
  let testData: string[]

  beforeEach(() => {
    testData = []
  })

  it('test 1', () => {
    testData.push('item')
  })

  it('test 2', () => {
    expect(testData).toHaveLength(0) // Passes
  })
})
```

### 7. Not Testing Error Cases
```typescript
// BAD - Only happy path
it('fetches data', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})

// GOOD - Test errors too
it('handles fetch errors', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'))
  await expect(fetchData()).rejects.toThrow('Network error')
})
```

## Test Coverage Best Practices

### What to Test
- All exported functions and components
- Success and error paths
- Edge cases and boundary conditions
- User interactions
- Async operations
- Conditional rendering
- Form validation
- Authentication flows
- Authorization checks

### What NOT to Test
- Third-party library internals
- Generated code (shadcn/ui components)
- TypeScript type definitions
- Constants and configuration
- Trivial getters/setters

## Integration Points

### With API Routes
- Mock Supabase responses
- Test all HTTP methods
- Verify authentication
- Check authorization
- Validate input/output

### With Components
- Test rendering
- User interactions
- Loading/error states
- Props variations
- Context integration

### With Hooks
- Test state changes
- API call integration
- Side effects
- Cleanup

## Performance Testing Considerations

```typescript
// Test component performance
it('renders large lists efficiently', () => {
  const largeData = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }))

  const { container } = render(<List data={largeData} />)

  // Should virtualize or paginate
  expect(container.querySelectorAll('[role="listitem"]').length).toBeLessThan(100)
})
```

## Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Continuous Integration

Tests run automatically on:
- Every push to feature branches
- Pull requests to main
- Before deployment

See `.github/workflows/ci.yml` for CI configuration.
