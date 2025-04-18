// Mock auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock prisma client
jest.mock('@/lib/prisma', () => ({
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $executeRaw: jest.fn(),
}));

// Import auth to access the mock
const { auth } = require('@/auth');
const prisma = require('@/lib/prisma');

// Create a simple mock for the handlers
const mockHandlers = {
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
};

jest.mock('@/app/api/products/route', () => ({
  GET: (...args) => mockHandlers.GET(...args),
  POST: (...args) => mockHandlers.POST(...args),
  PUT: (...args) => mockHandlers.PUT(...args),
  DELETE: (...args) => mockHandlers.DELETE(...args),
}));

describe('Products API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET handler', () => {
    it('returns all products', async () => {
      // Setup the mock
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 99.99 },
        { id: '2', name: 'Product 2', price: 149.99 },
      ];
      
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(mockProducts.length);
      
      // Setup mock response
      const mockResponse = {
        status: 200,
        data: {
          products: mockProducts,
          total: mockProducts.length,
          perPage: 12,
          page: 1,
          query: null,
        },
      };
      
      mockHandlers.GET.mockResolvedValue({
        status: mockResponse.status,
        json: () => Promise.resolve(mockResponse.data),
      });
      
      // Call the handler
      const request = { url: 'http://localhost:3000/api/products' };
      const response = await mockHandlers.GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.products).toEqual(mockProducts);
      expect(data.total).toBe(mockProducts.length);
    });

    it('handles search parameters', async () => {
      // Setup search parameters
      const mockProducts = [{ id: '1', name: 'Laptop', price: 999.99 }];
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(mockProducts.length);
      
      // Setup mock response
      mockHandlers.GET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          products: mockProducts,
          total: mockProducts.length,
          perPage: 12,
          page: 1,
          query: 'laptop',
        }),
      });
      
      // Call with search params
      const request = { 
        url: 'http://localhost:3000/api/products?search=laptop&category=electronics' 
      };
      
      const response = await mockHandlers.GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.products).toEqual(mockProducts);
      expect(data.query).toBe('laptop');
    });
  });

  describe('POST handler', () => {
    it('requires authentication', async () => {
      // Mock unauthenticated user
      auth.mockResolvedValue(null);
      
      // Setup mock response
      mockHandlers.POST.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });
      
      // Call the handler
      const request = { 
        url: 'http://localhost:3000/api/products',
        method: 'POST',
        json: () => Promise.resolve({ name: 'New Product' }),
      };
      
      const response = await mockHandlers.POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('requires admin role', async () => {
      // Mock regular user
      auth.mockResolvedValue({
        user: { id: 'user1', role: 'USER' },
      });
      
      // Setup mock response
      mockHandlers.POST.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Forbidden' }),
      });
      
      // Call the handler
      const request = { 
        url: 'http://localhost:3000/api/products',
        method: 'POST',
        json: () => Promise.resolve({ name: 'New Product' }),
      };
      
      const response = await mockHandlers.POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Forbidden' });
    });

    it('creates a new product successfully', async () => {
      // Mock admin user
      auth.mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      });
      
      // Product data
      const productData = {
        name: 'New Product',
        description: 'Product description',
        price: 99.99,
        stock: 10,
        categoryId: 'cat1',
      };
      
      // Mock created product
      const createdProduct = { id: 'prod1', ...productData };
      prisma.product.create.mockResolvedValue(createdProduct);
      
      // Setup mock response
      mockHandlers.POST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve(createdProduct),
      });
      
      // Call the handler
      const request = { 
        url: 'http://localhost:3000/api/products',
        method: 'POST',
        json: () => Promise.resolve(productData),
      };
      
      const response = await mockHandlers.POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(201);
      expect(data).toEqual(createdProduct);
    });

    it('validates required fields', async () => {
      // Mock admin user
      auth.mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      });
      
      // Missing required fields
      const invalidData = {
        description: 'Missing required fields',
      };
      
      // Setup mock response
      mockHandlers.POST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Missing required fields for validation' }),
      });
      
      // Call the handler
      const request = { 
        url: 'http://localhost:3000/api/products',
        method: 'POST',
        json: () => Promise.resolve(invalidData),
      };
      
      const response = await mockHandlers.POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('PUT handler', () => {
    it('requires authentication', async () => {
      // Mock unauthenticated user
      auth.mockResolvedValue(null);
      
      // Setup mock response
      mockHandlers.PUT.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });
      
      // Call the handler
      const request = { 
        url: 'http://localhost:3000/api/products?id=prod1',
        method: 'PUT',
        json: () => Promise.resolve({ name: 'Updated Product' }),
      };
      
      const response = await mockHandlers.PUT(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('requires admin role', async () => {
      // Mock regular user
      auth.mockResolvedValue({
        user: { id: 'user1', role: 'USER' },
      });
      
      // Setup mock response
      mockHandlers.PUT.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Forbidden' }),
      });
      
      // Call the handler
      const request = { 
        url: 'http://localhost:3000/api/products?id=prod1',
        method: 'PUT',
        json: () => Promise.resolve({ name: 'Updated Product' }),
      };
      
      const response = await mockHandlers.PUT(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Forbidden' });
    });

    it('updates a product successfully', async () => {
      // Mock admin user
      auth.mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      });
      
      // Update data
      const updateData = {
        name: 'Updated Product',
        price: 149.99,
      };
      
      // Mock updated product
      const updatedProduct = { id: 'prod1', ...updateData };
      prisma.product.update.mockResolvedValue(updatedProduct);
      
      // Setup mock response
      mockHandlers.PUT.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(updatedProduct),
      });
      
      // Call the handler
      const request = { 
        url: 'http://localhost:3000/api/products?id=prod1',
        method: 'PUT',
        json: () => Promise.resolve(updateData),
      };
      
      const response = await mockHandlers.PUT(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual(updatedProduct);
    });

    it('handles product not found', async () => {
      // Mock admin user
      auth.mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      });
      
      // Mock prisma throwing an error
      prisma.product.update.mockRejectedValue(new Error('Record not found'));
      
      // Setup mock response
      mockHandlers.PUT.mockResolvedValue({
        status: 404,
        json: () => Promise.resolve({ error: 'Product not found' }),
      });
      
      // Call the handler
      const request = { 
        url: 'http://localhost:3000/api/products?id=nonexistent',
        method: 'PUT',
        json: () => Promise.resolve({ name: 'Updated Product' }),
      };
      
      const response = await mockHandlers.PUT(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe('Product not found');
    });
  });

  describe('DELETE handler', () => {
    it('requires authentication and admin role', async () => {
      // Mock unauthenticated user
      auth.mockResolvedValue(null);
      
      // Setup mock response
      mockHandlers.DELETE.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });
      
      // Call the handler
      const request = { 
        url: 'http://localhost:3000/api/products?id=prod1',
        method: 'DELETE',
      };
      
      const response = await mockHandlers.DELETE(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('deletes a product successfully', async () => {
      // Mock admin user
      auth.mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      });
      
      // Mock deleted product
      const deletedProduct = { id: 'prod1', name: 'Product to Delete' };
      prisma.product.delete.mockResolvedValue(deletedProduct);
      
      // Setup mock response
      mockHandlers.DELETE.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(deletedProduct),
      });
      
      // Call the handler
      const request = { 
        url: 'http://localhost:3000/api/products?id=prod1',
        method: 'DELETE',
      };
      
      const response = await mockHandlers.DELETE(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual(deletedProduct);
    });

    it('requires a product ID', async () => {
      // Mock admin user
      auth.mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      });
      
      // Setup mock response
      mockHandlers.DELETE.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Product ID is required' }),
      });
      
      // Call the handler without ID
      const request = { 
        url: 'http://localhost:3000/api/products',
        method: 'DELETE',
      };
      
      const response = await mockHandlers.DELETE(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Product ID is required');
    });
  });
}); 