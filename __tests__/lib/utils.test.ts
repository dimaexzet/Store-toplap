import { formatPrice, formatCurrency, checkLowStock, emitOrderCreatedEvent, emitStockUpdatedEvent } from '@/lib/utils'
import { Order, Product } from '@/hooks/useSocket'

// Mock console methods
const originalConsoleLog = console.log
const originalConsoleError = console.error

beforeEach(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterEach(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})

describe('Formatting Functions', () => {
  test('formatPrice formats a number as USD currency', () => {
    expect(formatPrice(10)).toBe('$10.00')
    expect(formatPrice(10.5)).toBe('$10.50')
    expect(formatPrice(1000)).toBe('$1,000.00')
    expect(formatPrice(1234567.89)).toBe('$1,234,567.89')
  })

  test('formatCurrency formats a number as EUR currency', () => {
    expect(formatCurrency(10)).toBe('€10.00')
    expect(formatCurrency(10.5)).toBe('€10.50')
    expect(formatCurrency(1000)).toBe('€1,000.00')
    expect(formatCurrency(1234567.89)).toBe('€1,234,567.89')
  })
})

describe('Inventory Functions', () => {
  test('checkLowStock returns true when stock is below or equal to threshold', () => {
    expect(checkLowStock(5)).toBe(true)
    expect(checkLowStock(4)).toBe(true)
    expect(checkLowStock(0)).toBe(true)
    expect(checkLowStock(3, 3)).toBe(true)
  })

  test('checkLowStock returns false when stock is above threshold', () => {
    expect(checkLowStock(6)).toBe(false)
    expect(checkLowStock(10)).toBe(false)
    expect(checkLowStock(5, 4)).toBe(false)
  })

  test('checkLowStock uses default threshold of 5 when not specified', () => {
    expect(checkLowStock(5)).toBe(true)
    expect(checkLowStock(6)).toBe(false)
  })
})

describe('Socket Event Functions', () => {
  test('emitOrderCreatedEvent logs order creation', async () => {
    const order: Order = { 
      id: '123', 
      total: 100,
      status: 'PENDING'
    }
    const result = await emitOrderCreatedEvent(order)
    
    expect(result).toBe(true)
    expect(console.log).toHaveBeenCalledWith('Order created event triggered')
  })

  test('emitStockUpdatedEvent logs stock update', async () => {
    const product: Product = { 
      id: '123', 
      name: 'Test Product',
      description: 'Test description',
      price: 19.99,
      stock: 8,
      categoryId: 'cat123',
      featured: false
    }
    const result = await emitStockUpdatedEvent(product, 10, 8)
    
    expect(result).toBe(true)
    expect(console.log).toHaveBeenCalledWith('Stock updated event triggered for Test Product: 10 -> 8')
  })

  test('emitOrderCreatedEvent handles errors', async () => {
    // Simulate an error
    console.log = jest.fn(() => { throw new Error('Test error') })
    
    const order: Order = { 
      id: '123', 
      total: 100,
      status: 'PENDING'
    }
    const result = await emitOrderCreatedEvent(order)
    
    expect(result).toBe(false)
    expect(console.error).toHaveBeenCalledWith('Failed to emit order created event:', expect.any(Error))
  })

  test('emitStockUpdatedEvent handles errors', async () => {
    // Simulate an error
    console.log = jest.fn(() => { throw new Error('Test error') })
    
    const product: Product = { 
      id: '123', 
      name: 'Test Product',
      description: 'Test description',
      price: 19.99,
      stock: 8,
      categoryId: 'cat123',
      featured: false
    }
    const result = await emitStockUpdatedEvent(product, 10, 8)
    
    expect(result).toBe(false)
    expect(console.error).toHaveBeenCalledWith('Failed to emit stock updated event:', expect.any(Error))
  })
}) 