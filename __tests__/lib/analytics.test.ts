import {
  getTotalRevenue,
  getAverageOrderValue,
  getOrderStats,
  getRecentOrders,
  getLowStockProducts,
  getTopProducts,
  getTopCustomers,
  getCustomerAcquisition,
  getCustomers
} from '@/lib/analytics'
import prisma from '@/lib/prisma'
import { subDays } from 'date-fns'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    order: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn()
    },
    product: {
      findMany: jest.fn()
    },
    user: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    orderItem: {
      groupBy: jest.fn()
    }
  }
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  subDays: jest.fn((date, days) => new Date('2023-04-01')),
  format: jest.fn((date, format) => '2023-05-01'),
  startOfDay: jest.fn(date => date),
  endOfDay: jest.fn(date => date),
  startOfMonth: jest.fn(date => date),
  endOfMonth: jest.fn(date => date),
  eachDayOfInterval: jest.fn(() => [
    new Date('2023-04-01'),
    new Date('2023-04-02'),
    new Date('2023-04-03')
  ]),
  getMonth: jest.fn(() => 4), // May (0-indexed)
  getDate: jest.fn(() => 1)
}))

describe('Analytics Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('getTotalRevenue', () => {
    it('returns total revenue for the past 30 days', async () => {
      // Mock prisma response
      prisma.order.aggregate = jest.fn().mockResolvedValueOnce({
        _sum: {
          total: 1250.50
        }
      })
      
      const result = await getTotalRevenue()
      
      expect(prisma.order.aggregate).toHaveBeenCalledWith({
        _sum: {
          total: true
        },
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          }
        }
      })
      
      expect(result).toBe(1250.50)
    })
    
    it('returns 0 when no orders are found', async () => {
      prisma.order.aggregate = jest.fn().mockResolvedValueOnce({
        _sum: {
          total: null
        }
      })
      
      const result = await getTotalRevenue()
      expect(result).toBe(0)
    })
  })
  
  describe('getAverageOrderValue', () => {
    it('calculates average order value correctly', async () => {
      // Mock prisma response
      prisma.order.aggregate = jest.fn().mockResolvedValueOnce({
        _avg: {
          total: 85.25
        }
      })
      
      const result = await getAverageOrderValue()
      
      expect(prisma.order.aggregate).toHaveBeenCalledWith({
        _avg: {
          total: true
        },
        where: {
          status: {
            not: 'CANCELLED'
          },
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          }
        }
      })
      
      expect(result).toBe(85.25)
    })
    
    it('returns 0 when no orders are found', async () => {
      prisma.order.aggregate = jest.fn().mockResolvedValueOnce({
        _avg: {
          total: null
        }
      })
      
      const result = await getAverageOrderValue()
      expect(result).toBe(0)
    })
  })
  
  describe('getOrderStats', () => {
    it('returns order statistics grouped by status', async () => {
      // Mock prisma response
      prisma.order.groupBy = jest.fn().mockResolvedValueOnce([
        { status: 'PENDING', _count: 5 },
        { status: 'PROCESSING', _count: 3 },
        { status: 'DELIVERED', _count: 10 }
      ])
      
      const result = await getOrderStats()
      
      expect(prisma.order.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: {
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          }
        },
        _count: true
      })
      
      expect(result).toEqual([
        { name: 'PENDING', value: 5 },
        { name: 'PROCESSING', value: 3 },
        { name: 'DELIVERED', value: 10 }
      ])
    })
  })
  
  describe('getRecentOrders', () => {
    it('returns recent orders with user details', async () => {
      // Mock prisma response
      const mockOrders = [
        {
          id: 'order-1',
          createdAt: new Date(),
          status: 'PENDING',
          total: 125,
          user: { name: 'John Doe', email: 'john@example.com' }
        }
      ]
      
      prisma.order.findMany = jest.fn().mockResolvedValueOnce(mockOrders)
      
      const result = await getRecentOrders(5)
      
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        take: 5,
        select: {
          id: true,
          createdAt: true,
          status: true,
          total: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      expect(result).toEqual(mockOrders)
    })
  })
  
  describe('getLowStockProducts', () => {
    it('returns products with low stock', async () => {
      // Mock prisma response
      const mockProducts = [
        { id: 'product-1', name: 'Low Stock Item', stock: 2 }
      ]
      
      prisma.product.findMany = jest.fn().mockResolvedValueOnce(mockProducts)
      
      const result = await getLowStockProducts(5, 3)
      
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        take: 5,
        where: {
          stock: {
            lte: 3
          }
        },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          Image: {
            take: 1,
            select: {
              url: true
            }
          }
        },
        orderBy: {
          stock: 'asc'
        }
      })
      
      expect(result).toEqual(mockProducts)
    })
  })
  
  describe('getTopProducts', () => {
    it('returns top selling products', async () => {
      // Mock prisma response
      prisma.orderItem.groupBy = jest.fn().mockResolvedValueOnce([
        { productId: 'product-1', _sum: { quantity: 10 } }
      ])
      
      const mockProducts = [
        { 
          id: 'product-1', 
          name: 'Popular Item', 
          price: 99.99,
          Image: [{ url: 'image.jpg' }] 
        }
      ]
      
      prisma.product.findMany = jest.fn().mockResolvedValueOnce(mockProducts)
      
      const result = await getTopProducts(5)
      
      expect(prisma.orderItem.groupBy).toHaveBeenCalled()
      expect(prisma.product.findMany).toHaveBeenCalled()
      
      expect(result).toEqual([
        {
          id: 'product-1',
          name: 'Popular Item',
          price: 99.99,
          Image: [{ url: 'image.jpg' }],
          soldQuantity: 10
        }
      ])
    })
  })
  
  describe('getTopCustomers', () => {
    it('returns top customers by total spent', async () => {
      // Mock orders for customer aggregation
      const mockOrders = [
        { userId: 'user-1', _sum: { total: 500 } },
        { userId: 'user-2', _sum: { total: 300 } }
      ]
      
      prisma.order.groupBy = jest.fn().mockResolvedValueOnce(mockOrders)
      
      // Mock user data
      const mockUsers = [
        { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
        { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' }
      ]
      
      prisma.user.findMany = jest.fn().mockResolvedValueOnce(mockUsers)
      
      const result = await getTopCustomers(5)
      
      expect(prisma.order.groupBy).toHaveBeenCalled()
      expect(prisma.user.findMany).toHaveBeenCalled()
      
      expect(result).toEqual([
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          totalSpent: 500
        },
        {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          totalSpent: 300
        }
      ])
    })
  })
  
  describe('getCustomerAcquisition', () => {
    it('returns customer acquisition data by day', async () => {
      // Mock user counts
      prisma.user.count = jest.fn()
        .mockResolvedValueOnce(10) // Total count
        .mockResolvedValueOnce(3)  // Day 1
        .mockResolvedValueOnce(5)  // Day 2
        .mockResolvedValueOnce(2)  // Day 3
      
      const result = await getCustomerAcquisition('daily')
      
      expect(prisma.user.count).toHaveBeenCalledTimes(4)
      
      expect(result).toEqual({
        totalCustomers: 10,
        timeSeries: [
          { date: '2023-05-01', value: 3 },
          { date: '2023-05-01', value: 5 },
          { date: '2023-05-01', value: 2 }
        ]
      })
    })
  })
  
  describe('getCustomers', () => {
    it('returns customer data with order details', async () => {
      // Mock customers with orders
      const mockCustomers = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          image: 'avatar.jpg',
          createdAt: new Date(),
          orders: [
            { id: 'order-1', total: 100 },
            { id: 'order-2', total: 150 }
          ]
        }
      ]
      
      prisma.user.findMany = jest.fn().mockResolvedValueOnce(mockCustomers)
      
      const result = await getCustomers(10)
      
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        take: 10,
        where: {
          role: 'USER'
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          orders: {
            select: {
              id: true,
              total: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      expect(result).toEqual([
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          image: 'avatar.jpg',
          createdAt: expect.any(Date),
          orders: [
            { id: 'order-1', total: 100 },
            { id: 'order-2', total: 150 }
          ],
          orderCount: 2,
          totalSpent: 250
        }
      ])
    })
  })
}) 