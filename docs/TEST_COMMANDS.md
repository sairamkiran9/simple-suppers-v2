# Test Commands

## Check All Tests
```bash
npm test
```

## Run Specific Test Suites

### API Tests
```bash
# All API tests
npm test -- __tests__/api/

# Specific API test files
npm test -- __tests__/api/providers.test.ts
npm test -- __tests__/api/user.test.ts
```

### Library Tests
```bash
# All lib tests
npm test -- __tests__/lib/

# API client tests
npm test -- __tests__/lib/api-client.test.ts

# Meal plans API tests (new)
npm test -- __tests__/lib/api/meal-plans.test.ts

# User API tests
npm test -- __tests__/lib/api/user.test.ts
```

### Hook Tests
```bash
# All hook tests
npm test -- __tests__/hooks/

# Specific hooks (new)
npm test -- __tests__/hooks/useMealPlans.test.ts
npm test -- __tests__/hooks/useMealPlanDetail.test.ts
```

### Component Tests
```bash
# All component tests
npm test -- __tests__/components/

# Specific components
npm test -- __tests__/components/UserProfileForm.test.tsx
npm test -- __tests__/components/MealPlanCard.test.tsx
npm test -- __tests__/components/MealPlanDetail.test.tsx
```

### Database Tests
```bash
npm test -- __tests__/database/
```

### Integration Tests
```bash
npm test -- __tests__/integration/
```

## Watch Mode (for development)
```bash
# Watch all tests
npm test -- --watch

# Watch specific file
npm test -- __tests__/lib/api/meal-plans.test.ts --watch
```

## Coverage Report
```bash
npm test -- --coverage
```

## Verbose Output (see detailed errors)
```bash
npm test -- --verbose
```

## Only Failed Tests
```bash
npm test -- --onlyFailures
```

## Current Status Check
Run this to see which tests exist and their status:
```bash
# List all test files
find __tests__ -name "*.test.ts" -o -name "*.test.tsx"

# Count test files
find __tests__ -name "*.test.ts" -o -name "*.test.tsx" | wc -l
```
