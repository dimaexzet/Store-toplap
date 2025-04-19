// Add testing library extensions
import '@testing-library/jest-dom'

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    toString: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: jest.fn(({ src, alt, width, height, ...props }) => (
    <img 
      src={src} 
      alt={alt} 
      width={width} 
      height={height} 
      {...props} 
    />
  )),
}))

// Mock Resend module
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-id', status: 'success' }),
    },
  })),
}))

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: 'mock-session-id', url: 'https://mock-checkout.url' }),
        retrieve: jest.fn().mockResolvedValue({ payment_status: 'paid' }),
      },
    },
    events: {
      retrieve: jest.fn().mockResolvedValue({ type: 'checkout.session.completed' }),
    },
  }))
})

// Mock for process.env
process.env = {
  ...process.env,
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
  STRIPE_SECRET_KEY: 'mock_stripe_secret',
  STRIPE_WEBHOOK_SECRET: 'mock_webhook_secret',
}

// Mock for fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  })
)

// Mock for IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Suppress console errors and warnings in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

console.error = (...args) => {
  // Filter out specific React errors that occur during testing
  if (args[0] && args[0].includes('Warning:')) {
    return
  }
  originalConsoleError(...args)
}

console.warn = (...args) => {
  // Filter out specific React warnings that occur during testing
  if (args[0] && args[0].includes('Warning:')) {
    return
  }
  originalConsoleWarn(...args)
}

// Mock Next-Auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ 
    data: null, 
    status: 'unauthenticated' 
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
}) 