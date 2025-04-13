import { POST } from '@/app/api/export/[type]/route'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { format } from 'date-fns'

// Mock Next.js request/response
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
    new: jest.fn((body, init) => ({ body, init }))
  }
}))

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn()
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    order: {
      findMany: jest.fn(),
      groupBy: jest.fn()
    },
    product: {
      findMany: jest.fn()
    },
    user: {
      findMany: jest.fn()
    }
  }
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => '2023-05-01'),
  subDays: jest.fn((date, days) => new Date())
}))

describe('Export API Route', () => {
  let mockRequest: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock request setup
    mockRequest = {
      json: jest.fn().mockResolvedValue({
        startDate: '2023-05-01T00:00:00.000Z',
        endDate: '2023-05-31T23:59:59.999Z',
        format: 'csv'
      })
    }
    
    // Mock authentication to return admin user
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'user-id-1', role: 'ADMIN' }
    })
  })
  
  it('rejects requests from non-admin users', async () => {
    // Set up auth to return non-admin user
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: 'user-id-2', role: 'USER' }
    })
    
    const response = await POST(
      mockRequest as NextRequest,
      { params: { type: 'orders' } }
    )
    
    expect(response.body).toBe('Unauthorized')
    expect(response.init.status).toBe(401)
  })
  
  it('rejects requests with missing date range', async () => {
    // Mock request with missing dates
    mockRequest.json = jest.fn().mockResolvedValueOnce({
      format: 'csv'
    })
    
    const response = await POST(
      mockRequest as NextRequest,
      { params: { type: 'orders' } }
    )
    
    expect(response.body).toBe('Missing date range')
    expect(response.init.status).toBe(400)
  })
  
  it('rejects requests with invalid export type', async () => {
    const response = await POST(
      mockRequest as NextRequest,
      { params: { type: 'invalid-type' } }
    )
    
    expect(response.body).toContain('Invalid export type')
    expect(response.init.status).toBe(400)
  })
  
  it('generates CSV for orders export', async () => {
    // Mock order data
    const mockOrders = [
      {
        id: 'order-1',
        status: OrderStatus.DELIVERED,
        total: 100,
        createdAt: new Date('2023-05-15'),
        user: {
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    ]
    
    prisma.order.findMany = jest.fn().mockResolvedValueOnce(mockOrders)
    
    const response = await POST(
      mockRequest as NextRequest,
      { params: { type: 'orders' } }
    )
    
    // Verify the response is a CSV file
    expect(response.init.headers['Content-Type']).toBe('text/csv')
    expect(response.init.headers['Content-Disposition']).toContain('attachment')
    expect(response.body).toContain('id,customerName,customerEmail,status,total,createdAt')
    expect(response.body).toContain('order-1,Test User,test@example.com,DELIVERED,100,2023-05-01')
  })
  
  it('generates CSV for products export', async () => {
    // Mock product data
    const mockProducts = [
      {
        id: 'product-1',
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        category: {
          name: 'Test Category'
        },
        createdAt: new Date('2023-05-15')
      }
    ]
    
    prisma.product.findMany = jest.fn().mockResolvedValueOnce(mockProducts)
    
    const response = await POST(
      mockRequest as NextRequest,
      { params: { type: 'products' } }
    )
    
    // Verify the response is a CSV file
    expect(response.init.headers['Content-Type']).toBe('text/csv')
    expect(response.body).toContain('id,name,category,price,stock,createdAt')
    expect(response.body).toContain('product-1,Test Product,Test Category,99.99,10,2023-05-01')
  })
  
  it('generates CSV for customers export', async () => {
    // Mock customer data
    const mockCustomers = [
      {
        id: 'user-1',
        name: 'Test Customer',
        email: 'customer@example.com',
        createdAt: new Date('2023-05-15'),
        orders: [{ id: 'order-1' }, { id: 'order-2' }]
      }
    ]
    
    prisma.user.findMany = jest.fn().mockResolvedValueOnce(mockCustomers)
    
    const response = await POST(
      mockRequest as NextRequest,
      { params: { type: 'customers' } }
    )
    
    // Verify the response is a CSV file
    expect(response.init.headers['Content-Type']).toBe('text/csv')
    expect(response.body).toContain('id,name,email,orderCount,createdAt')
    expect(response.body).toContain('user-1,Test Customer,customer@example.com,2,2023-05-01')
  })
  
  it('generates CSV for revenue export', async () => {
    // Mock order data for revenue
    const mockOrders = [
      {
        total: 100,
        createdAt: new Date('2023-05-01')
      },
      {
        total: 200,
        createdAt: new Date('2023-05-01')
      },
      {
        total: 150,
        createdAt: new Date('2023-05-02')
      }
    ]
    
    prisma.order.findMany = jest.fn().mockResolvedValueOnce(mockOrders)
    
    const response = await POST(
      mockRequest as NextRequest,
      { params: { type: 'revenue' } }
    )
    
    // Verify the response is a CSV file
    expect(response.init.headers['Content-Type']).toBe('text/csv')
    expect(response.body).toContain('date,revenue')
    expect(response.body).toContain('2023-05-01,300')
    expect(response.body).toContain('2023-05-01,150')
  })
  
  it('handles PDF export format', async () => {
    // Request PDF format
    mockRequest.json = jest.fn().mockResolvedValueOnce({
      startDate: '2023-05-01T00:00:00.000Z',
      endDate: '2023-05-31T23:59:59.999Z',
      format: 'pdf'
    })
    
    const response = await POST(
      mockRequest as NextRequest,
      { params: { type: 'orders' } }
    )
    
    // Should return a JSON response since PDF is not implemented
    expect(response.init.headers['Content-Type']).toBe('application/json')
    expect(response.data.message).toBe('PDF generation not implemented in this demo')
    expect(response.options.status).toBe(200)
  })
  
  it('handles errors during export', async () => {
    // Simulate an error
    prisma.order.findMany = jest.fn().mockRejectedValueOnce(new Error('Database error'))
    
    // Mock console.error
    const originalConsoleError = console.error
    console.error = jest.fn()
    
    const response = await POST(
      mockRequest as NextRequest,
      { params: { type: 'orders' } }
    )
    
    expect(response.body).toBe('Internal Server Error')
    expect(response.init.status).toBe(500)
    expect(console.error).toHaveBeenCalled()
    
    // Restore console.error
    console.error = originalConsoleError
  })
}) 