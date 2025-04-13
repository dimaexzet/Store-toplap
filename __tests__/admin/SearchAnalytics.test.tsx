import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import SearchAnalyticsPage from '@/app/(admin)/admin/search-analytics/page'

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
}))

// Mock the date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn((date) => '01/01/2023')
}))

describe('SearchAnalyticsPage', () => {
  const mockPrisma = require('@/lib/prisma').default
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders search analytics with data correctly', async () => {
    // Mock data
    const mockPopularSearches = [
      { term: 'laptop', count: 150, lastSearchedAt: new Date('2023-01-15') },
      { term: 'smartphone', count: 120, lastSearchedAt: new Date('2023-01-14') }
    ]
    
    const mockRecentSearches = [
      { term: 'headphones', count: 50, lastSearchedAt: new Date('2023-01-20') },
      { term: 'smartwatch', count: 30, lastSearchedAt: new Date('2023-01-19') }
    ]
    
    const mockUniqueSearchCount = [{ count: 45 }]
    
    // Setup mock implementation
    mockPrisma.$queryRaw.mockImplementation((query) => {
      const queryString = query.strings.join('')
      
      if (queryString.includes('ORDER BY count DESC')) {
        return Promise.resolve(mockPopularSearches)
      }
      if (queryString.includes('ORDER BY "lastSearchedAt" DESC')) {
        return Promise.resolve(mockRecentSearches)
      }
      if (queryString.includes('COUNT(*)')) {
        return Promise.resolve(mockUniqueSearchCount)
      }
      return Promise.resolve([])
    })
    
    // Render the component
    const Component = await SearchAnalyticsPage()
    const { getByText, getAllByText } = render(Component)
    
    // Test summary stats
    expect(getByText('270')).toBeInTheDocument() // Total searches (150 + 120)
    expect(getByText('45')).toBeInTheDocument() // Unique search terms
    expect(getByText('laptop')).toBeInTheDocument() // Most popular search
    expect(getByText('150 searches')).toBeInTheDocument() // Count of most popular
    expect(getByText('headphones')).toBeInTheDocument() // Latest search
    
    // Test tables
    expect(getAllByText('laptop').length).toBeGreaterThan(0)
    expect(getAllByText('smartphone').length).toBeGreaterThan(0)
    expect(getAllByText('headphones').length).toBeGreaterThan(0)
    expect(getAllByText('smartwatch').length).toBeGreaterThan(0)
  })
  
  it('renders empty state correctly when no search data', async () => {
    // Setup empty data responses
    mockPrisma.$queryRaw.mockImplementation(() => Promise.resolve([]))
    
    // Render the component
    const Component = await SearchAnalyticsPage()
    const { getByText } = render(Component)
    
    // Check for empty states
    expect(getByText('0')).toBeInTheDocument() // Total searches
    expect(getByText('N/A')).toBeInTheDocument() // Most popular search
    expect(getByText('No search data available')).toBeInTheDocument()
  })
}) 