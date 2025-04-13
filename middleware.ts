import NextAuth from 'next-auth'
import authConfig from './auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Authenticate routes
export const { auth: authMiddleware } = NextAuth(authConfig)

// Security middleware
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.uploadthing.com blob: https://utfs.io; connect-src 'self' https://api.stripe.com https://uploadthing.com https://api.uploadthing.com https://*.uploadthing.com https://uploadthing.com/* wss://*.uploadthing.com; frame-src 'self' https://js.stripe.com; font-src 'self';")
  
  return response
}

// Middleware configuration
export const config = {
  matcher: [
    // Match all routes except static files, api routes, auth routes, and other excluded paths
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
}
