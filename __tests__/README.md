# Testing Documentation for AI Amazona

This directory contains tests for the AI Amazona e-commerce platform using Jest and React Testing Library.

## Test Structure

The tests are organized according to the application structure:

- `__tests__/auth/` - Tests for authentication components
- `__tests__/admin/` - Tests for admin dashboard components
- `__tests__/components/` - Tests for UI components
- `__tests__/home/` - Tests for home page components
- `__tests__/lib/` - Tests for utility functions and shared logic
- `__tests__/api/` - Tests for API routes

## Running Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run a specific test file
npx jest __tests__/components/Button.test.tsx

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for specific directories with coverage
npm run test:coverage -- --testPathPattern='__tests__/(components|lib)/'
```

## Current Test Status

### Working Tests
- UI Components:
  - Button component - Tests button rendering, variants, sizes, click events, and disabled state (90% coverage)
- Utility Functions:
  - utils.ts - Tests formatting functions, inventory functions, and socket event functions (100% coverage)
- Analytics and Reporting:
  - ExportReports component - Tests component rendering, format selection, and export functionality
  - Export API - Tests CSV generation for different data types and error handling
  - Analytics utility functions - Tests data retrieval and aggregation for dashboards
  
### Tests Being Developed
- Authentication:
  - SignUp component
- Admin:
  - SearchAnalytics component
- Home:
  - HomePage component

## Coverage Summary

Current coverage for tested components:
- Button.tsx: 90% statements, 66.66% branches, 100% functions, 100% lines
- utils.ts: 100% statements, 100% branches, 100% functions, 100% lines
- ExportReports.tsx: Testing component rendering and interactions
- export/[type]/route.ts: Testing API functionality for different export types
- analytics.ts: Testing data retrieval and aggregation functions

Overall project coverage is low as we're just beginning to implement tests. Focus areas for improving coverage:
1. Core UI components
2. Utility functions 
3. Hooks
4. Critical user flows (authentication, checkout, etc.)

## Writing Tests

### Component Tests

When writing tests for components, follow these guidelines:

1. Test the component's rendering
2. Test user interactions
3. Test component props and variants
4. Mock external dependencies

Example:

```tsx
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import YourComponent from '@/path/to/component'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Testing Utility Functions

For utility functions, focus on testing:

1. Expected outputs for various inputs
2. Edge cases and boundary conditions
3. Error handling

Example:

```ts
import { myFunction } from '@/lib/utils'

describe('myFunction', () => {
  test('returns expected output for normal input', () => {
    expect(myFunction(10)).toBe('expected result')
  })
  
  test('handles edge cases', () => {
    expect(myFunction(0)).toBe('edge case result')
    expect(myFunction(-1)).toBe('negative case result')
  })
  
  test('throws error for invalid input', () => {
    expect(() => myFunction(null)).toThrow('Invalid input')
  })
})
```

### Testing API Routes

For API routes, focus on testing:

1. Authentication and authorization
2. Expected responses for valid inputs
3. Error handling for invalid inputs
4. Different data scenarios (empty data, partial data, etc.)

Example:

```ts
import { POST } from '@/app/api/route'
import { NextRequest } from 'next/server'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { role: 'ADMIN' } })
}))

describe('API Route', () => {
  it('handles valid request correctly', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ /* request data */ })
    }
    
    const response = await POST(mockRequest as unknown as NextRequest)
    expect(response.status).toBe(200)
  })
})
```

### Testing Server Components

For server components:

1. Mock the Prisma client and other server dependencies
2. Await the component before rendering
3. Test the rendered output

Example:

```tsx
// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    model: {
      findMany: jest.fn(),
    },
  },
}))

describe('ServerComponent', () => {
  it('renders with data', async () => {
    // Setup mock data
    const mockData = [...]
    require('@/lib/prisma').default.model.findMany.mockResolvedValue(mockData)
    
    // Render the component
    const Component = await ServerComponent()
    const { getByText } = render(Component)
    
    // Test output
    expect(getByText('Expected Output')).toBeInTheDocument()
  })
})
```

## Known Issues

Currently there are a few challenges with testing:

1. TypeScript issues with the testing library imports
2. ESM module transformations required for dependencies like lucide-react and @radix-ui
3. Server component testing requires careful mocking

The Jest configuration in `jest.config.js` has been updated to handle ESM modules by adding:

```js
transformIgnorePatterns: [
  '/node_modules/(?!lucide-react|@radix-ui|).+\\.js$'
]
```

## Next Steps

1. Fix TypeScript errors in test files
2. Add more UI component tests
3. Implement tests for hooks
4. Create integration tests for critical user flows
5. Setup CI/CD pipeline with automated testing

## Coverage Goals

We aim for:
- 80% coverage for UI components
- 70% coverage for page components 
- 90% coverage for utility functions 