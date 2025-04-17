import { NextRequest, NextResponse } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/products/route'
import { auth } from '@/auth'

// Mock prisma client
jest.mock('@/lib/prisma', () => ({
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET handler', () => {
    it('returns all products', async () => {
      // Mock prisma response
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 99.99 },
        { id: '2', name: 'Product 2', price: 149.99 },
      ]
      const prisma = require('@/lib/prisma')
      prisma.product.findMany.mockResolvedValue(mockProducts)

      // Call the API
      const request = new NextRequest('http://localhost:3000/api/products')
      const response = await GET(request)
      const data = await response.json()

      // Assertions
      expect(response.status).toBe(200)
      expect(data).toEqual(mockProducts)
      expect(prisma.product.findMany).toHaveBeenCalled()
    })

    it('handles errors gracefully', async () => {
      // Mock prisma error
      const prisma = require('@/lib/prisma')
      prisma.product.findMany.mockRejectedValue(new Error('Database error'))

      // Call the API
      const request = new NextRequest('http://localhost:3000/api/products')
      const response = await GET(request)

      // Assertions
      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to fetch products' })
    })

    it('applies filters correctly when provided', async () => {
      // Mock prisma response
      const mockProducts = [{ id: '1', name: 'Product 1', price: 99.99, categoryId: 'cat1' }]
      const prisma = require('@/lib/prisma')
      prisma.product.findMany.mockResolvedValue(mockProducts)

      // Call the API with query params
      const url = new URL('http://localhost:3000/api/products')
      url.searchParams.append('category', 'cat1')
      const request = new NextRequest(url)
      await GET(request)

      // Assert that filter was applied
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat1',
          }),
        })
      )
    })
  })

  describe('POST handler', () => {
    it('requires authentication', async () => {
      // Mock unauthenticated session
      ;(auth as jest.Mock).mockResolvedValue(null)

      // Call the API
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Product' }),
      })
      const response = await POST(request)

      // Assertions
      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('requires admin role', async () => {
      // Mock authenticated but non-admin user
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: 'user1', role: 'USER' },
      })

      // Call the API
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Product' }),
      })
      const response = await POST(request)

      // Assertions
      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'Forbidden' })
    })

    it('creates a product with valid data', async () => {
      // Mock admin user
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      })

      // Mock product data
      const newProduct = {
        name: 'New Product',
        description: 'Product description',
        price: 99.99,
        stock: 10,
        categoryId: 'cat1',
        images: ['image1.jpg'],
      }

      // Mock prisma response
      const createdProduct = { id: '123', ...newProduct }
      const prisma = require('@/lib/prisma')
      prisma.product.create.mockResolvedValue(createdProduct)

      // Call the API
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
      })
      const response = await POST(request)
      const data = await response.json()

      // Assertions
      expect(response.status).toBe(201)
      expect(data).toEqual(createdProduct)
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: newProduct,
      })
    })

    it('validates required fields', async () => {
      // Mock admin user
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      })

      // Invalid product data (missing required fields)
      const invalidProduct = {
        description: 'Product description',
      }

      // Call the API
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidProduct),
      })
      const response = await POST(request)

      // Assertions
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual(
        expect.objectContaining({
          error: expect.stringContaining('validation'),
        })
      )
    })
  })

  describe('PUT handler', () => {
    it('requires authentication and admin role', async () => {
      // Mock unauthenticated session
      ;(auth as jest.Mock).mockResolvedValue(null)

      // Call the API
      const request = new NextRequest('http://localhost:3000/api/products?id=123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Product' }),
      })
      const response = await PUT(request)

      // Assertions
      expect(response.status).toBe(401)
    })

    it('updates a product with valid data', async () => {
      // Mock admin user
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      })

      // Mock product update data
      const updateData = {
        name: 'Updated Product',
        price: 129.99,
      }

      // Mock prisma response
      const updatedProduct = { id: '123', ...updateData }
      const prisma = require('@/lib/prisma')
      prisma.product.update.mockResolvedValue(updatedProduct)

      // Call the API
      const url = new URL('http://localhost:3000/api/products')
      url.searchParams.append('id', '123')
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })
      const response = await PUT(request)
      const data = await response.json()

      // Assertions
      expect(response.status).toBe(200)
      expect(data).toEqual(updatedProduct)
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: updateData,
      })
    })

    it('returns 404 for non-existent product', async () => {
      // Mock admin user
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      })

      // Mock prisma throwing a not found error
      const prisma = require('@/lib/prisma')
      prisma.product.update.mockRejectedValue(new Error('Record not found'))

      // Call the API
      const url = new URL('http://localhost:3000/api/products')
      url.searchParams.append('id', 'non-existent')
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Product' }),
      })
      const response = await PUT(request)

      // Assertions
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Product not found' })
    })
  })

  describe('DELETE handler', () => {
    it('requires authentication and admin role', async () => {
      // Mock non-admin user
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: 'user1', role: 'USER' },
      })

      // Call the API
      const url = new URL('http://localhost:3000/api/products')
      url.searchParams.append('id', '123')
      const request = new NextRequest(url, { method: 'DELETE' })
      const response = await DELETE(request)

      // Assertions
      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'Forbidden' })
    })

    it('deletes a product successfully', async () => {
      // Mock admin user
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      })

      // Mock prisma response
      const deletedProduct = { id: '123', name: 'Deleted Product' }
      const prisma = require('@/lib/prisma')
      prisma.product.delete.mockResolvedValue(deletedProduct)

      // Call the API
      const url = new URL('http://localhost:3000/api/products')
      url.searchParams.append('id', '123')
      const request = new NextRequest(url, { method: 'DELETE' })
      const response = await DELETE(request)

      // Assertions
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(deletedProduct)
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      })
    })

    it('returns 400 when no ID is provided', async () => {
      // Mock admin user
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      })

      // Call the API without ID
      const request = new NextRequest('http://localhost:3000/api/products', { method: 'DELETE' })
      const response = await DELETE(request)

      // Assertions
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Product ID is required' })
    })
  })
}) 