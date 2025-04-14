import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { emitStockUpdatedEvent, checkLowStock } from '@/lib/utils'
import { Product as ClientProduct } from '@/hooks/useSocket'

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
      include: {
        category: true
      }
    })
    
    if (!product) {
      return new NextResponse('Product not found', { status: 404 })
    }
    
    // Save the previous stock value for the event
    const previousStock = product.stock
    
    // Update stock
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock },
      include: {
        category: true
      }
    })
    
    // Convert Prisma product to client-safe product format
    const clientProduct: ClientProduct = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      price: Number(updatedProduct.price), // Convert Decimal to number
      stock: updatedProduct.stock,
      categoryId: updatedProduct.categoryId,
      featured: updatedProduct.featured
    }
    
    // Emit stock update event
    emitStockUpdatedEvent(clientProduct, previousStock, updatedProduct.stock)
    
    // Check for low stock and log/emit if needed
    if (checkLowStock(updatedProduct.stock)) {
      console.log(`Low stock alert for ${updatedProduct.name}: ${updatedProduct.stock} items remaining`)
    }
    
    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product stock:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 