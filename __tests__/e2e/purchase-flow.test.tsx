import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import HomePage from '@/app/(home)/page'
import ProductDetail from '@/app/(home)/products/[id]/page'
import Cart from '@/app/(home)/cart/page'
import Checkout from '@/app/(home)/checkout/page'
import OrderConfirmation from '@/app/(home)/orders/confirmation/page'
import { useRouter } from 'next/navigation'

// Mock session
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
  usePathname: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  order: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}))

// Mock Stripe
jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => children,
  CardElement: () => <div data-testid="stripe-card-element" />,
  useStripe: jest.fn(() => ({
    createPaymentMethod: jest.fn().mockResolvedValue({
      paymentMethod: { id: 'pm_test_123' },
    }),
  })),
  useElements: jest.fn(() => ({
    getElement: jest.fn(),
  })),
}))

// Mock Zustand store
jest.mock('@/store/cartStore', () => ({
  useCartStore: jest.fn(() => ({
    items: [
      { 
        id: 'product1', 
        name: 'Test Product', 
        price: 99.99, 
        quantity: 1, 
        image: '/test.jpg' 
      }
    ],
    addItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    total: 99.99,
  })),
}))

describe('E2E Purchase Flow', () => {
  // Set up authenticated user
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
        },
        expires: '2023-01-01',
      },
      status: 'authenticated',
    })

    // Setup router mock
    const mockPush = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })

    // Setup Prisma mock return values
    const prisma = require('@/lib/prisma')
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'product1',
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        stock: 10,
        images: ['/test.jpg'],
        categoryId: 'category1',
      },
    ])

    prisma.product.findUnique.mockResolvedValue({
      id: 'product1',
      name: 'Test Product',
      description: 'Test description',
      price: 99.99,
      stock: 10,
      images: ['/test.jpg'],
      categoryId: 'category1',
    })

    prisma.user.findUnique.mockResolvedValue({
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country',
      },
    })

    prisma.order.create.mockResolvedValue({
      id: 'order1',
      userId: 'user1',
      status: 'PENDING',
      total: 99.99,
      items: [
        {
          productId: 'product1',
          name: 'Test Product',
          quantity: 1,
          price: 99.99,
        },
      ],
    })
  })

  it('completes the entire purchase flow', async () => {
    // Step 1: User visits the home page
    const user = userEvent.setup()
    render(await HomePage())
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    
    // Step 2: User clicks on a product
    fireEvent.click(screen.getByText('Test Product'))
    
    // Should navigate to product detail page
    const mockRouter = useRouter()
    expect(mockRouter.push).toHaveBeenCalledWith('/products/product1')
    
    // Step 3: Render the product detail page
    render(await ProductDetail({ params: Promise.resolve({ id: 'product1' }) }))
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    
    // Step 4: User adds product to cart
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }))
    
    // Step 5: User navigates to cart
    mockRouter.push.mockClear()
    fireEvent.click(screen.getByRole('link', { name: /view cart/i }))
    expect(mockRouter.push).toHaveBeenCalledWith('/cart')
    
    // Step 6: Render cart page
    render(await Cart())
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByText('Total: $99.99')).toBeInTheDocument()
    
    // Step 7: User proceeds to checkout
    fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }))
    expect(mockRouter.push).toHaveBeenCalledWith('/checkout')
    
    // Step 8: Render checkout page
    render(await Checkout())
    
    // Verify shipping address is pre-filled
    expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test City')).toBeInTheDocument()
    
    // Step 9: User enters payment information
    const stripeElement = screen.getByTestId('stripe-card-element')
    expect(stripeElement).toBeInTheDocument()
    
    // Step 10: User places order
    fireEvent.click(screen.getByRole('button', { name: /place order/i }))
    
    // Wait for order processing
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/orders/confirmation?order=order1')
    })
    
    // Step 11: Render order confirmation page
    render(await OrderConfirmation({ 
      searchParams: { order: 'order1' } 
    }))
    
    // Verify order confirmation details
    expect(screen.getByText(/order confirmed/i)).toBeInTheDocument()
    expect(screen.getByText(/order1/i)).toBeInTheDocument()
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    
    // Verify cart was cleared
    const { clearCart } = require('@/store/cartStore').useCartStore()
    expect(clearCart).toHaveBeenCalled()
  })
}) 