import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

type tParams = Promise<{ id: string }>

export async function PATCH(
  req: NextRequest,
  { params }: { params: tParams }
) {
  try {
    const session = await auth()
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const { id } = await params
    const { stock } = await req.json()
    
    // Validate stock value
    if (stock === undefined || typeof stock !== 'number' || stock < 0) {
      return new NextResponse('Invalid stock value', { status: 400 })
    }
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    })
    
    if (!product) {
      return new NextResponse('Product not found', { status: 404 })
    }
    
    // Update stock
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock },
    })
    
    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product stock:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 