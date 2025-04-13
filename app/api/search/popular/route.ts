import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Constants for caching
const CACHE_MAX_AGE = 600 // Cache for 10 minutes
const DEFAULT_LIMIT = 10
const MIN_TERM_LENGTH = 2

// Define search term type
interface PopularSearch {
  term: string;
  count: number;
}

// Cache for popular search terms
const popularSearchCache = new Map<string, { popular: PopularSearch[]; timestamp: number }>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`)
    
    // Generate cache key based on limit
    const cacheKey = `popular:${limit}`
    
    // Check if we have a cached response
    const cachedResponse = popularSearchCache.get(cacheKey)
    const now = Date.now()
    
    if (cachedResponse && now - cachedResponse.timestamp < CACHE_MAX_AGE * 1000) {
      // Return cached response if it hasn't expired
      return NextResponse.json({
        popular: cachedResponse.popular,
        timestamp: new Date().toISOString(),
        source: 'cache'
      }, {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, must-revalidate`,
          'X-Cache': 'HIT'
        }
      })
    }
    
    // Get most popular search terms using raw SQL for better performance
    const popularSearches = await prisma.$queryRaw<PopularSearch[]>`
      SELECT term, count 
      FROM "SearchQuery" 
      WHERE LENGTH(term) > ${MIN_TERM_LENGTH}
      ORDER BY count DESC 
      LIMIT ${limit}
    `;
    
    // Cache the response
    popularSearchCache.set(cacheKey, {
      popular: popularSearches,
      timestamp: now
    })
    
    return NextResponse.json({
      popular: popularSearches,
      timestamp: new Date().toISOString(),
      source: 'fresh'
    }, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, must-revalidate`,
        'X-Cache': 'MISS'
      }
    })
  } catch (error) {
    console.error('Popular searches API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve popular searches' },
      { status: 500 }
    )
  }
} 