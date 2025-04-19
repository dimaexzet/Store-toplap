import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import crypto from 'crypto'

type tParams = Promise<{ id: string }>

export async function GET(
  req: NextRequest,
  { params }: { params: tParams }
) {
  try {
    const session = await auth()
    
    // Check authentication and admin role
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const { id } = await params
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        Image: true,
      },
    })
    
    if (!existingProduct) {
      return new NextResponse('Product not found', { status: 404 })
    }
    
    // Create a new product with the same details but a different name
    const { id: _, Image: images, ...productData } = existingProduct
    
    const newProduct = await prisma.product.create({
      data: {
        ...productData,
        name: `${productData.name} (Copy)`,
        Image: {
          create: images.map(image => ({
            id: crypto.randomUUID(),
            url: image.url,
          })),
        },
      },
      include: {
        Image: true,
      },
    })
    
    // Return the new product data
    return NextResponse.json({
      message: 'Product duplicated successfully',
      product: {
        ...newProduct,
        price: Number(newProduct.price),
      },
    })
  } catch (error) {
    console.error('Error duplicating product:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 