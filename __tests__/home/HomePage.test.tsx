import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '@/app/(home)/page'

// Mock the necessary imports
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src} alt={props.alt} />
  },
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/components/home/latest-products', () => ({
  LatestProducts: (props: any) => <div data-testid="latest-products">Latest Products Mock</div>,
}))

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders the homepage with banners and latest products', async () => {
    // Mock the prisma response
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product 1',
        price: 99.99,
        description: 'Product description',
        stock: 10,
        sku: 'SKU123',
        createdAt: new Date(),
        updatedAt: new Date(),
        reviews: [],
        Image: [{ url: '/test1.jpg' }],
      },
      {
        id: '2',
        name: 'Test Product 2',
        price: 199.99,
        description: 'Product description 2',
        stock: 5,
        sku: 'SKU456',
        createdAt: new Date(),
        updatedAt: new Date(),
        reviews: [],
        Image: [{ url: '/test2.jpg' }],
      },
    ]
    
    const prisma = require('@/lib/prisma').default
    prisma.product.findMany.mockResolvedValue(mockProducts)
    
    // Render the component
    const Component = await HomePage()
    const { getByText, getAllByAltText, getByTestId } = render(Component)
    
    // Test banner content
    expect(getByText('New Arrivals')).toBeInTheDocument()
    expect(getByText('Special Offers')).toBeInTheDocument()
    expect(getByText('Free Shipping')).toBeInTheDocument()
    expect(getByText('Check out our latest collection of amazing products')).toBeInTheDocument()
    expect(getByText('Get up to 50% off on selected items')).toBeInTheDocument()
    expect(getByText('On orders over $100')).toBeInTheDocument()
    
    // Test banner images
    expect(getAllByAltText('New Arrivals').length).toBe(1)
    expect(getAllByAltText('Special Offers').length).toBe(1)
    expect(getAllByAltText('Free Shipping').length).toBe(1)
    
    // Test latest products component is rendered
    expect(getByTestId('latest-products')).toBeInTheDocument()
  })
}) 