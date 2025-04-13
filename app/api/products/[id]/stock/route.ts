import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update product stock' },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to update product stock' },
        { status: 403 }
      )
    }

    const productId = params.id
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get the new stock value from the request body
    const body = await req.json()
    const { stock } = body

    // Validate stock value
    if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json(
        { error: 'Invalid stock value' },
        { status: 400 }
      )
    }

    // Update the product stock
    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        stock,
      },
    })

    return NextResponse.json({
      product: updatedProduct,
      message: 'Product stock updated successfully',
    })
  } catch (error) {
    console.error('Error updating product stock:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 