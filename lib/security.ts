import { z } from 'zod'
import sanitizeHtml from 'sanitize-html'

// HTML sanitization options
const sanitizeOptions = {
  allowedTags: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span'
  ],
  allowedAttributes: {
    'a': ['href', 'name', 'target'],
    'span': ['style']
  },
  allowedStyles: {
    '*': {
      'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'text-align': [/^left$/, /^right$/, /^center$/],
      'font-size': [/^\d+(?:px|em|%)$/]
    }
  }
}

// Sanitize HTML content
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, sanitizeOptions)
}

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(100, 'Email must be less than 100 characters')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name must contain only letters, spaces, hyphens, and apostrophes')

export const productNameSchema = z
  .string()
  .min(3, 'Product name must be at least 3 characters')
  .max(100, 'Product name must be less than 100 characters')

export const productDescriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters')
  .max(5000, 'Description must be less than 5000 characters')
  .transform(sanitizeContent)

export const priceSchema = z
  .number()
  .positive('Price must be positive')
  .min(0.01, 'Price must be at least 0.01')
  .max(1000000, 'Price must be less than 1,000,000')

export const stockSchema = z
  .number()
  .int('Stock must be an integer')
  .min(0, 'Stock cannot be negative')
  .max(1000000, 'Stock must be less than 1,000,000')

// File validation
export const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
]

export const maxFileSize = 5 * 1024 * 1024 // 5MB

export function validateFile(file: File): boolean {
  return allowedMimeTypes.includes(file.type) && file.size <= maxFileSize
}

// API response error handler - avoid leaking sensitive information
export function handleApiError(error: unknown): { message: string, status: number } {
  console.error('API error:', error)
  
  if (error instanceof z.ZodError) {
    return {
      message: 'Validation error',
      status: 400
    }
  }
  
  if (error instanceof Error) {
    // Log the detailed error but return a generic message
    return {
      message: 'An error occurred while processing your request',
      status: 500
    }
  }
  
  return {
    message: 'Unknown error',
    status: 500
  }
} 