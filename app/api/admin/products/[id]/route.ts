import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import crypto from 'crypto'

type tParams = Promise<{ id: string }>

export async function GET(
  req: NextRequest,
  { params }: { params: tParams }
) {
  const session = await auth()
  
  // Check authentication and admin role
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    const { id } = await params
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        Image: true,
        category: true,
      },
    })
    
    if (!product) {
      return new NextResponse('Product not found', { status: 404 })
    }
    
    // Convert Decimal to number
    const formattedProduct = {
      ...product,
      price: Number(product.price),
    }
    
    return NextResponse.json(formattedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: tParams }
) {
  const session = await auth()
  
  // Check authentication and admin role
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, price, stock, categoryId, featured, images } = body
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })
    
    if (!existingProduct) {
      return new NextResponse('Product not found', { status: 404 })
    }
    
    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        featured,
      },
    })
    
    // Update images if provided
    if (images) {
      // Delete existing images
      await prisma.image.deleteMany({
        where: { productId: id },
      })
      
      // Add new images
      if (images.length > 0) {
        await prisma.image.createMany({
          data: images.map((url: string) => ({
            id: crypto.randomUUID(),
            url,
            productId: id,
          })),
        })
      }
    }
    
    // Return the updated product with images
    const productWithImages = await prisma.product.findUnique({
      where: { id },
      include: {
        Image: true,
        category: true,
      },
    })
    
    return NextResponse.json(productWithImages)
  } catch (error) {
    console.error('Error updating product:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: tParams }
) {
  const session = await auth()
  
  // Check authentication and admin role
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    const { id } = await params
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })
    
    if (!existingProduct) {
      return new NextResponse('Product not found', { status: 404 })
    }
    
    // Delete associated images first
    await prisma.image.deleteMany({
      where: { productId: id },
    })
    
    // Delete product
    await prisma.product.delete({
      where: { id },
    })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting product:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 