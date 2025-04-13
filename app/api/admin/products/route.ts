import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const session = await auth()
  
  // Check authentication and admin role
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    // Get query parameters
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''
    const category = url.searchParams.get('category') || ''
    const sortBy = url.searchParams.get('sort') || 'createdAt'
    const sortOrder = url.searchParams.get('order') || 'desc'
    
    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Build filter conditions
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (category) {
      where.categoryId = category
    }
    
    // Get products with pagination, filtering, and sorting
    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          featured: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
          Image: {
            select: {
              id: true,
              url: true,
            },
            take: 1,
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])
    
    // Format response data
    const formattedProducts = products.map(product => ({
      ...product,
      price: Number(product.price),
      imageUrl: product.Image[0]?.url || null,
    }))
    
    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  
  // Check authentication and admin role
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    const body = await req.json()
    const { name, description, price, stock, categoryId, featured, images } = body
    
    // Validate required fields
    if (!name || price === undefined || !categoryId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }
    
    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock: stock || 0,
        categoryId,
        featured: featured || false,
      },
      select: {
        id: true,
      },
    })
    
    // Add images if provided
    if (images && images.length > 0) {
      await prisma.image.createMany({
        data: images.map((url: string) => ({
          id: crypto.randomUUID(),
          url,
          productId: product.id,
        })),
      })
    }
    
    // Return the created product with images
    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        Image: true,
        category: true,
      },
    })
    
    return NextResponse.json(createdProduct, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 