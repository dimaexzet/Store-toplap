import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateSuggestions } from '@/lib/search/utils'

// Constants for caching and performance
const CACHE_MAX_AGE = 300 // Cache for 5 minutes
const MIN_QUERY_LENGTH = 2
const MAX_PRODUCTS = 50
const MAX_SUGGESTIONS = 8

// Cache to store recent suggestion queries
const suggestionsCache = new Map<string, { suggestions: string[]; timestamp: number }>()

// Define minimal product type for suggestions
interface MinimalProduct {
  name: string;
  description: string;
  category?: {
    name: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    // Return empty array for very short queries
    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ suggestions: [] })
    }

    // Check cache first
    const cacheKey = `suggestions:${query.toLowerCase()}`
    const cachedResult = suggestionsCache.get(cacheKey)
    const now = Date.now()

    if (cachedResult && now - cachedResult.timestamp < CACHE_MAX_AGE * 1000) {
      return NextResponse.json({ 
        suggestions: cachedResult.suggestions,
        timestamp: new Date().toISOString(),
        source: 'cache'
      }, {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, must-revalidate`,
          'X-Cache': 'HIT'
        }
      })
    }

    // Get products relevant to the query for suggestion generation
    const products = await prisma.product.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ]
          },
          { stock: { gt: 0 } } // Only include products with stock > 0
        ]
      },
      select: {
        name: true,
        description: true,
        category: {
          select: {
            name: true
          }
        }
      },
      take: MAX_PRODUCTS, // Limit to specified products for performance
    })

    // Custom implementation for minimal products
    function generateSuggestionsForMinimalProducts(products: MinimalProduct[], query: string, limit: number): string[] {
      if (!query || query.length < 2) return [];
      
      const results = new Set<string>();
      const queryLower = query.toLowerCase();
      
      // Process each product
      for (const product of products) {
        // Check name matches
        if (product.name.toLowerCase().includes(queryLower)) {
          results.add(product.name);
        }
        
        // Extract words from name
        const nameWords = product.name.toLowerCase().split(/\s+/);
        for (const word of nameWords) {
          if (word.startsWith(queryLower) && word.length > 3) {
            results.add(word.charAt(0).toUpperCase() + word.slice(1));
          }
        }
        
        // Check description matches
        if (product.description && product.description.toLowerCase().includes(queryLower)) {
          const descWords = product.description.toLowerCase().split(/\s+/);
          for (let i = 0; i < descWords.length - 1; i++) {
            const word = descWords[i];
            if (word.startsWith(queryLower) && word.length > 3) {
              const phrase = `${word} ${descWords[i + 1]}`.trim();
              if (phrase.length > 5) {
                results.add(phrase.charAt(0).toUpperCase() + phrase.slice(1));
              }
            }
          }
        }
        
        // Check category matches
        if (product.category && product.category.name.toLowerCase().includes(queryLower)) {
          results.add(product.category.name);
        }
      }
      
      return Array.from(results).slice(0, limit);
    }
    
    // Generate suggestions with our minimal product data
    const suggestions = generateSuggestionsForMinimalProducts(products as MinimalProduct[], query, MAX_SUGGESTIONS)
    
    // Cache the result
    suggestionsCache.set(cacheKey, {
      suggestions,
      timestamp: now
    })

    // Clean up old cache entries if the cache is getting too big
    if (suggestionsCache.size > 100) {
      const entriesToDelete = [...suggestionsCache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 20)
        .map(entry => entry[0])
      
      entriesToDelete.forEach(key => suggestionsCache.delete(key))
    }
    
    // Return the suggestions
    return NextResponse.json({ 
      suggestions,
      timestamp: new Date().toISOString(),
      source: 'fresh'
    }, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, must-revalidate`,
        'X-Cache': 'MISS'
      }
    })
  } catch (error) {
    console.error('Search suggestions API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate search suggestions' },
      { status: 500 }
    )
  }
} 