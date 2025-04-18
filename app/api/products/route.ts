import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { calculateRelevanceScore, fuzzyMatch, highlightText } from '@/lib/search/utils'
import { auth } from '@/auth'

const ITEMS_PER_PAGE = 12
const CACHE_MAX_AGE = 60 // Cache for 1 minute

// Cache to store recent API responses
const apiCache = new Map<string, { data: any; timestamp: number }>()

// Interface for product with relevance score
interface ProductWithRelevance {
  id: string
  name: string
  description: string
  price: any // Using 'any' for Decimal from Prisma
  stock: number
  categoryId: string
  featured: boolean
  createdAt: Date
  updatedAt: Date
  category: { id: string; name: string }
  Image?: { url: string }[]
  _count?: { orderItems: number; reviews: number }
  relevanceScore?: number
  nameHighlighted?: string
  descriptionHighlighted?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
    const sort = searchParams.get('sort')
    const includeHighlights = searchParams.get('highlights') === 'true'

    // Generate a cache key based on all the parameters
    const cacheKey = `products:${page}:${category || ''}:${search || ''}:${minPrice}:${maxPrice}:${sort || ''}:${includeHighlights ? '1' : '0'}`
    
    // Check if we have a cached response
    const cachedResponse = apiCache.get(cacheKey)
    const now = Date.now()
    
    if (cachedResponse && now - cachedResponse.timestamp < CACHE_MAX_AGE * 1000) {
      // Return cached response if it hasn't expired
      return NextResponse.json(cachedResponse.data, {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, must-revalidate`,
          'X-Cache': 'HIT'
        }
      })
    }

    // Track search terms for analytics (if search term provided)
    if (search && search.trim().length > 0) {
      try {
        // Don't await this operation to avoid blocking the response
        trackSearchQuery(search.trim()).catch(err => {
          console.error('Background search tracking error:', err)
        })
      } catch (error) {
        console.error('Error tracking search query:', error)
        // Continue with search even if tracking fails
      }
    }

    // Build where clause for filtering
    const where: Prisma.ProductWhereInput = buildWhereClause(
      search,
      category,
      minPrice,
      maxPrice
    )

    // Build orderBy clause for sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = {}
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'name_asc':
        orderBy = { name: 'asc' }
        break
      case 'name_desc':
        orderBy = { name: 'desc' }
        break
      case 'popularity':
        orderBy = { orderItems: { _count: 'desc' } }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    // Execute both queries in parallel for better performance
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        include: {
          category: true,
          Image: {
            select: {
              url: true,
            },
            take: 1, // Only take the first image for efficiency
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true
            }
          }
        },
      })
    ])

    // Apply relevance scoring if search is provided
    let productsWithRelevance: ProductWithRelevance[] = products as ProductWithRelevance[]
    
    if (search && search.trim().length > 0) {
      // Calculate relevance score for each product
      productsWithRelevance = products.map(product => {
        const relevance = calculateRelevanceScore(product, search);
        
        // Add highlighted text if requested
        const result = {
          ...(product as any),
          relevanceScore: relevance,
        };
        
        if (includeHighlights) {
          result.nameHighlighted = highlightText(product.name, search);
          result.descriptionHighlighted = highlightText(
            product.description || '',
            search
          );
        }
        
        return result;
      });

      // If not explicitly sorted otherwise, sort by relevance
      if (!sort) {
        productsWithRelevance.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      }
    }

    // Format products for response
    const formattedProducts = productsWithRelevance.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      categoryId: product.categoryId,
      featured: product.featured,
      category: product.category,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Include the first image URL directly
      imageUrl: product.Image?.[0]?.url || null,
      // Add popularity metrics
      popularity: product._count?.orderItems || 0,
      reviewCount: product._count?.reviews || 0,
      // Add relevance score if available
      ...(product.relevanceScore !== undefined && { relevanceScore: product.relevanceScore }),
      // Add highlighted fields if available
      ...(product.nameHighlighted && { nameHighlighted: product.nameHighlighted }),
      ...(product.descriptionHighlighted && { descriptionHighlighted: product.descriptionHighlighted }),
    }));

    const responseData = {
      products: formattedProducts,
      total,
      perPage: ITEMS_PER_PAGE,
      page,
      query: search || null,
    }

    // Cache the response
    apiCache.set(cacheKey, {
      data: responseData,
      timestamp: now
    })

    // Clean up old cache entries if the cache is getting too big
    if (apiCache.size > 100) {
      const entriesToDelete = [...apiCache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 20)
        .map(entry => entry[0])
      
      entriesToDelete.forEach(key => apiCache.delete(key))
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, must-revalidate`,
        'X-Cache': 'MISS'
      }
    })
  } catch (error) {
    console.error('Products API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

/**
 * Build the where clause for the product query based on search and filter parameters
 */
function buildWhereClause(
  search: string | null,
  category: string | null,
  minPrice: number,
  maxPrice: number
): Prisma.ProductWhereInput {
  // Start with price range filter
  const baseWhere: Prisma.ProductWhereInput = {
    AND: [
      { price: { gte: minPrice } },
      { price: { lte: maxPrice } },
    ],
  };
  
  // Add category filter if provided
  if (category) {
    const andConditions = baseWhere.AND as Prisma.ProductWhereInput[];
    andConditions.push({ categoryId: category });
  }
  
  // Add search filters if search term provided
  if (search && search.trim().length > 0) {
    const searchTerm = search.trim();
    
    // Build search conditions
    const searchConditions: Prisma.ProductWhereInput[] = [
      // Exact match in name or description
      {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
          // Search by category name
          {
            category: {
              name: {
                contains: searchTerm,
                mode: 'insensitive' as Prisma.QueryMode,
              }
            }
          }
        ],
      },
    ];
    
    // Split search into words for more granular matching
    const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    if (searchWords.length > 1) {
      // Add individual word matches if multiple words
      const wordConditions: Prisma.ProductWhereInput[] = searchWords.map(word => ({
        OR: [
          { name: { contains: word, mode: 'insensitive' as Prisma.QueryMode } },
          { description: { contains: word, mode: 'insensitive' as Prisma.QueryMode } },
          { category: { name: { contains: word, mode: 'insensitive' as Prisma.QueryMode } } }
        ]
      }));
      
      // Add these conditions to the search conditions
      searchConditions.push({
        AND: wordConditions
      });
    }
    
    // Add search conditions to the main where clause
    const andConditions = baseWhere.AND as Prisma.ProductWhereInput[];
    andConditions.push({ OR: searchConditions });
  }
  
  return baseWhere;
}

// Track search queries for analytics
async function trackSearchQuery(query: string) {
  try {
    // Store the search query for analytics
    await prisma.$executeRaw`
      INSERT INTO "SearchQuery" (id, term, count, "lastSearchedAt", "createdAt")
      VALUES (${crypto.randomUUID()}, ${query.toLowerCase()}, 1, ${new Date()}, ${new Date()})
      ON CONFLICT (term) 
      DO UPDATE SET
        count = "SearchQuery".count + 1,
        "lastSearchedAt" = ${new Date()}
    `;
  } catch (error) {
    // Log error but don't fail the search
    console.error('Failed to track search query:', error);
    throw error; // Rethrow to handle in the main function
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.price || !body.categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields for validation' },
        { status: 400 }
      )
    }
    
    // Create product in database
    const product = await prisma.product.create({
      data: body
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get product ID from query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    // Parse request body
    const updateData = await request.json()
    
    try {
      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: updateData,
      })
      
      return NextResponse.json(updatedProduct)
    } catch (error) {
      // Handle record not found error
      console.error('Error updating product:', error)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get product ID from query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    try {
      // Delete product
      const deletedProduct = await prisma.product.delete({
        where: { id },
      })
      
      return NextResponse.json(deletedProduct)
    } catch (error) {
      // Handle record not found error
      console.error('Error deleting product:', error)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
