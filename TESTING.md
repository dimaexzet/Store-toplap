# Testing and Audit Documentation

This document describes how to run tests and security audits for the AI Amazona e-commerce platform.

## Quick Start

To run all tests and generate a comprehensive report, use the provided shell script:

```bash
./setup-and-run-tests.sh
```

This script will:
1. Install all necessary dependencies
2. Run unit tests with coverage
3. Run the security audit
4. Run performance tests
5. Generate a comprehensive test report

## Available Scripts

The following scripts are available to run different types of tests:

### Testing

```bash
# Run all tests (Jest)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run API endpoint tests
npm run test:api

# Run end-to-end tests
npm run test:e2e

# Run component tests
npm run test:component

# Run all tests and generate a comprehensive report
npm run test:all
```

### Security Audit

```bash
# Run security audit
npm run security-audit
```

This will check for:
- Vulnerable dependencies
- Sensitive information exposure
- Security headers configuration
- Authentication and authorization issues
- Input validation and data sanitization
- CSRF and XSS protections

### Performance Testing

```bash
# Run performance tests
npm run performance-test
```

This will test:
- Home page load time
- Product listing performance
- Search functionality response time
- Cart operations speed
- Authentication process performance

## Continuous Integration

This project uses GitHub Actions for continuous integration. On each push to the main, master, dev, or development branches, the workflow will:

1. Run linting
2. Run unit tests with coverage
3. Run API tests
4. Run the security audit
5. Run performance tests
6. Generate a comprehensive report

The workflow configuration can be found in `.github/workflows/tests.yml`.

## Test Structure

Tests are organized in the following directories:

- `__tests__/components/` - UI component tests
- `__tests__/api/` - API endpoint tests
- `__tests__/lib/` - Utility function tests
- `__tests__/auth/` - Authentication tests
- `__tests__/admin/` - Admin functionality tests
- `__tests__/e2e/` - End-to-end tests

## Writing Tests

### Component Tests

For UI components, use React Testing Library:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Button from '@/components/ui/button'

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Click me' }))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### API Tests

For API endpoints, test both success and error cases:

```ts
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/products/route'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  product: {
    findMany: jest.fn()
  }
}))

describe('Products API', () => {
  it('returns products successfully', async () => {
    const mockProducts = [{ id: '1', name: 'Test Product' }]
    require('@/lib/prisma').product.findMany.mockResolvedValue(mockProducts)
    
    const request = new NextRequest('http://localhost:3000/api/products')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(mockProducts)
  })
})
```

### End-to-End Tests

For end-to-end tests, simulate a complete user journey:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '@/app/(home)/page'
import ProductDetail from '@/app/(home)/products/[id]/page'
import Cart from '@/app/(home)/cart/page'

// Mock necessary dependencies and setup test environment

describe('Purchase Flow', () => {
  it('completes the purchase process', async () => {
    // Render home page
    render(await HomePage())
    
    // Click on a product
    fireEvent.click(screen.getByText('Test Product'))
    
    // Render product detail page
    render(await ProductDetail({ params: Promise.resolve({ id: '1' }) }))
    
    // Add to cart
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }))
    
    // Go to cart
    render(await Cart())
    
    // Verify product in cart
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })
})
```

## Test Reports

After running tests, the following reports are available:

- **Test Coverage**: `coverage/lcov-report/index.html`
- **Security Audit**: `security-audit.json`
- **Performance Reports**: `performance-reports/`
- **Comprehensive Test Report**: `test-reports/test-report-[timestamp].md`

## Security Audit

The security audit checks for common security issues:

1. **Authentication & Authorization**
   - Password hashing configuration
   - JWT security
   - Role-based access control

2. **API Security**
   - CSRF protection
   - Rate limiting
   - Input validation
   - Error handling

3. **Data Protection**
   - Content sanitization
   - SQL injection prevention
   - Sensitive data encryption

4. **Infrastructure & Configuration**
   - Security headers
   - Cookie security
   - Environment configuration

## Performance Testing

Performance tests measure:

1. **Response Time**
   - Average response time
   - 95th percentile response time
   - Maximum response time

2. **Throughput**
   - Requests per second
   - Total successful requests

3. **Error Rate**
   - Failed requests percentage
   - Timeout frequency

## CI/CD Integration

The test results are integrated into the CI/CD pipeline. Pull requests will show test status, and deployments will be blocked if critical tests fail. 