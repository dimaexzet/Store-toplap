import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface RateLimitOptions {
  limit: number
  windowInSeconds: number
}

// In-memory store for rate limiting
// In a production environment, you should use Redis or another distributed cache
const ipRequestMap = new Map<string, { count: number, timestamp: number }>()

// Simple in-memory rate limiter
export function rateLimiter(
  req: NextRequest, 
  options: RateLimitOptions = { limit: 10, windowInSeconds: 60 }
) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const currentTime = Date.now()
  const windowMs = options.windowInSeconds * 1000
  
  const requestData = ipRequestMap.get(ip)
  
  // If no previous requests or window expired, reset counter
  if (!requestData || currentTime - requestData.timestamp > windowMs) {
    ipRequestMap.set(ip, { count: 1, timestamp: currentTime })
    return { success: true, remaining: options.limit - 1 }
  }
  
  // Check if limit is reached
  if (requestData.count >= options.limit) {
    return { success: false, remaining: 0 }
  }
  
  // Increment request count
  requestData.count += 1
  ipRequestMap.set(ip, requestData)
  
  return { success: true, remaining: options.limit - requestData.count }
}

// Rate limit middleware for API routes
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse, 
  options?: RateLimitOptions
) {
  return async function rateLimit(req: NextRequest) {
    const { success, remaining } = rateLimiter(req, options)
    
    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests, please try again later' }),
        { 
          status: 429, 
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': options?.limit.toString() || '10',
            'X-RateLimit-Remaining': '0',
            'Retry-After': options?.windowInSeconds.toString() || '60'
          }
        }
      )
    }
    
    const response = await handler(req)
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', options?.limit.toString() || '10')
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    
    return response
  }
} 