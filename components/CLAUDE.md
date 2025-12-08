# Components - Development Guidelines

## Purpose and Scope
This directory contains all React components for the Simple Suppers v2 application. Components range from reusable UI primitives to complex feature-specific components.

## Directory Structure

```
components/
├── ui/                          # shadcn/ui components (DO NOT MODIFY)
│   ├── button.tsx               # Base button component
│   ├── card.tsx                 # Card layouts
│   ├── dialog.tsx               # Modal dialogs
│   ├── form.tsx                 # Form components
│   └── ...                      # Other primitives
├── [Feature]Component.tsx       # Feature-specific components
├── Navigation.tsx               # Global navigation
├── ThemeToggle.tsx              # Theme switcher
└── ...
```

## Core Principles

### 1. Component Types

#### UI Primitives (ui/ directory)
- Generated and managed by shadcn/ui
- DO NOT modify directly - regenerate if changes needed
- Provide base styling with Tailwind CSS
- Use Radix UI for accessibility

#### Feature Components
- Domain-specific business logic
- Use UI primitives for consistent styling
- Export as default or named export
- Located in root components directory

#### Layout Components
- Navigation, Footer, Hero
- Global application structure
- Responsive design patterns

### 2. TypeScript Requirements
All components MUST:
- Use TypeScript with strict mode
- Define explicit prop interfaces
- Export type definitions for reuse
- Avoid `any` types

```typescript
interface MyComponentProps {
  title: string
  onAction: (id: string) => void
  optional?: boolean
  children?: React.ReactNode
}

export default function MyComponent({
  title,
  onAction,
  optional = false,
  children
}: MyComponentProps) {
  // Component implementation
}
```

## Key Patterns and Conventions

### Client Component Pattern
Use `'use client'` directive for components with interactivity:

```typescript
'use client'

import { useState } from 'react'
import { Button } from './ui/button'

interface InteractiveComponentProps {
  initialValue: string
}

export default function InteractiveComponent({ initialValue }: InteractiveComponentProps) {
  const [value, setValue] = useState(initialValue)

  return (
    <div>
      <p>{value}</p>
      <Button onClick={() => setValue('new value')}>Update</Button>
    </div>
  )
}
```

### Form Component Pattern
Use React Hook Form with Zod validation:

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Button } from './ui/button'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters')
})

type FormValues = z.infer<typeof formSchema>

interface MyFormProps {
  onSubmit: (values: FormValues) => void
  defaultValues?: Partial<FormValues>
}

export function MyForm({ onSubmit, defaultValues }: MyFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Data Fetching Pattern
Use custom hooks for data fetching:

```typescript
'use client'

import { useMealPlans } from '@/hooks/useMealPlans'
import { MealPlanCard } from './MealPlanCard'
import { Button } from './ui/button'
import { RefreshCw } from 'lucide-react'

export function MealPlanList() {
  const { mealPlans, loading, error, refresh } = useMealPlans()

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mealPlans.map((plan) => (
        <MealPlanCard key={plan.id} mealPlan={plan} />
      ))}
    </div>
  )
}
```

### Loading State Pattern
Implement skeleton screens for better UX:

```typescript
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Modal/Dialog Pattern
Use Dialog component for modals:

```typescript
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Authentication-Aware Pattern
Use auth context for conditional rendering:

```typescript
'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from './ui/button'

export function UserActions() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return <Button onClick={onLogin}>Login</Button>
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {user?.name}
      </span>
      {user?.is_creator && (
        <Button variant="outline" onClick={goToCreatorDashboard}>
          Creator Dashboard
        </Button>
      )}
      <Button variant="outline" onClick={logout}>
        Logout
      </Button>
    </div>
  )
}
```

### Styling Conventions

#### Tailwind CSS Classes
```typescript
// Use semantic class groups
<div className="
  flex items-center justify-between    // Layout
  px-4 py-2                            // Spacing
  bg-white dark:bg-gray-800            // Colors
  border border-gray-200               // Borders
  rounded-lg                           // Border radius
  shadow-sm                            // Shadows
  hover:shadow-md                      // Interactions
  transition-shadow                    // Transitions
">
```

#### Dark Mode Support
ALWAYS include dark mode variants:
```typescript
<div className="
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-700
">
```

#### Responsive Design
Use responsive breakpoints:
```typescript
<div className="
  grid
  grid-cols-1        // Mobile
  md:grid-cols-2     // Tablet
  lg:grid-cols-3     // Desktop
  gap-4 md:gap-6
">
```

## Common Tasks

### Creating a New Component

1. **Create the file** in the components directory:
   ```
   components/MyFeature.tsx
   ```

2. **Set up the basic structure**:
   ```typescript
   'use client' // If using hooks or interactivity

   import { ComponentProps } from '@/lib/types'

   interface MyFeatureProps {
     // Define props
   }

   export default function MyFeature({ ...props }: MyFeatureProps) {
     return (
       <div>
         {/* Component JSX */}
       </div>
     )
   }
   ```

3. **Add styling** with Tailwind CSS

4. **Export** from the file (default or named export)

### Adding a shadcn/ui Component

DO NOT create manually. Use the CLI:
```bash
npx shadcn-ui@latest add [component-name]
```

This ensures:
- Correct Radix UI integration
- Proper TypeScript types
- Consistent styling
- Accessibility features

### Creating a Form Component

1. **Define validation schema**:
   ```typescript
   const schema = z.object({
     field: z.string().min(1)
   })
   ```

2. **Set up React Hook Form**:
   ```typescript
   const form = useForm({
     resolver: zodResolver(schema),
     defaultValues: {}
   })
   ```

3. **Use Form components** from ui/form

4. **Handle submission**:
   ```typescript
   const onSubmit = async (values: FormValues) => {
     try {
       await submitData(values)
       toast.success('Success!')
     } catch (error) {
       toast.error('Failed to submit')
     }
   }
   ```

## Important Files and Their Roles

### Core Components
- `Navigation.tsx` - Global navigation bar with auth-aware menu
- `ThemeToggle.tsx` - Dark/light mode switcher
- `Hero.tsx` - Landing page hero section
- `Footer.tsx` - Global footer

### Feature Components
- `Feed.tsx` - Social feed display with infinite scroll
- `FeedPost.tsx` - Individual feed post card
- `CreatePostModal.tsx` - Modal for creating feed posts
- `MealPlanCard.tsx` - Meal plan preview card
- `MealPlanDetail.tsx` - Full meal plan details view
- `Dashboard.tsx` - User dashboard
- `CreatorDashboard.tsx` - Creator-specific dashboard

### Form Components
- `LoginForm.tsx` - User login form
- `SignupForm.tsx` - User registration form
- `UserProfileForm.tsx` - Profile update form

### UI Components (ui/)
All shadcn/ui components - see [shadcn/ui docs](https://ui.shadcn.com)

## Testing Requirements

### Component Tests
Every component should have corresponding tests:

```typescript
// __tests__/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const onAction = jest.fn()
    render(<MyComponent title="Test" onAction={onAction} />)

    const button = screen.getByRole('button')
    await userEvent.click(button)

    expect(onAction).toHaveBeenCalled()
  })

  it('supports dark mode', () => {
    render(<MyComponent title="Test" />)
    // Test dark mode classes are applied
  })
})
```

### Test Coverage Requirements
- Rendering with different props
- User interactions (clicks, form submissions)
- Error states and loading states
- Conditional rendering based on auth state
- Dark mode support
- Responsive behavior (if applicable)

## Common Pitfalls to Avoid

### 1. Missing 'use client' Directive
```typescript
// BAD - Will cause server-side errors
import { useState } from 'react'

export default function Component() {
  const [state, setState] = useState()
  // Error: useState can't be used in server components
}

// GOOD
'use client'

import { useState } from 'react'

export default function Component() {
  const [state, setState] = useState()
}
```

### 2. Not Handling Loading States
```typescript
// BAD
export function DataList() {
  const { data } = useData()
  return data.map(item => <Item key={item.id} {...item} />)
  // Error: data might be undefined
}

// GOOD
export function DataList() {
  const { data, loading, error } = useData()

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <EmptyState />

  return data.map(item => <Item key={item.id} {...item} />)
}
```

### 3. Inconsistent Dark Mode Support
```typescript
// BAD
<div className="bg-white text-black">

// GOOD
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

### 4. Missing Accessibility Features
```typescript
// BAD
<div onClick={handleClick}>Click me</div>

// GOOD
<button
  onClick={handleClick}
  aria-label="Descriptive label"
  className="..."
>
  Click me
</button>
```

### 5. Not Using TypeScript Properly
```typescript
// BAD
export default function Component(props: any) {

// GOOD
interface ComponentProps {
  title: string
  onAction: () => void
}

export default function Component({ title, onAction }: ComponentProps) {
```

### 6. Direct DOM Manipulation
```typescript
// BAD
document.getElementById('element').style.display = 'none'

// GOOD
const [isVisible, setIsVisible] = useState(true)
return isVisible && <div>Content</div>
```

### 7. Not Memoizing Expensive Computations
```typescript
// BAD
export function Component({ data }) {
  const processed = expensiveOperation(data) // Runs every render
  return <div>{processed}</div>
}

// GOOD
import { useMemo } from 'react'

export function Component({ data }) {
  const processed = useMemo(() => expensiveOperation(data), [data])
  return <div>{processed}</div>
}
```

## Integration Points

### With Hooks
Components use custom hooks from `/hooks/`:
- `useAuth()` - Authentication state
- `useMealPlans()` - Meal plan data
- `useFeedPosts()` - Feed data
- `useUserDashboard()` - Dashboard data

### With API
Components don't call APIs directly:
- Use custom hooks that wrap API calls
- Hooks use React Query for caching
- API calls use `/lib/api/*.client.ts` functions

### With Context
Global state via context:
- `AuthContext` from `/lib/auth-context.ts`
- Theme context from `next-themes`

## Performance Best Practices

1. **Use React.memo for expensive components**:
   ```typescript
   export const ExpensiveComponent = React.memo(function ExpensiveComponent(props) {
     // Component implementation
   })
   ```

2. **Optimize re-renders**:
   ```typescript
   const memoizedCallback = useCallback(() => {
     doSomething(a, b)
   }, [a, b])
   ```

3. **Lazy load heavy components**:
   ```typescript
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <LoadingSkeleton />
   })
   ```

4. **Use proper key props** in lists

5. **Avoid inline object/array creation** in props

## Accessibility Checklist

Before merging any component:
- [ ] Semantic HTML elements used
- [ ] Proper heading hierarchy
- [ ] ARIA labels for interactive elements
- [ ] Keyboard navigation supported
- [ ] Focus states visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader friendly
- [ ] Form inputs have associated labels
- [ ] Error messages are accessible
