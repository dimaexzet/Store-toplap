import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// PATCH - Update multiple products
export async function PATCH(req: NextRequest) {
  const session = await auth()
  
  // Check authentication and admin role
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    const body = await req.json()
    const { ids, data } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return new NextResponse('Product IDs array is required', { status: 400 })
    }
    
    if (!data || Object.keys(data).length === 0) {
      return new NextResponse('Update data is required', { status: 400 })
    }
    
    // Update all products in one transaction
    const updatedCount = await prisma.$transaction(async (tx) => {
      // Perform update for each product
      let count = 0
      for (const id of ids) {
        try {
          await tx.product.update({
            where: { id },
            data,
          })
          count++
        } catch (error) {
          console.error(`Error updating product ${id}:`, error)
          // Continue with other products even if one fails
        }
      }
      return count
    })
    
    return NextResponse.json({
      success: true,
      updatedCount,
      message: `${updatedCount} products updated successfully`,
    })
  } catch (error) {
    console.error('Error updating products in bulk:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// DELETE - Delete multiple products
export async function DELETE(req: NextRequest) {
  const session = await auth()
  
  // Check authentication and admin role
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    const body = await req.json()
    const { ids } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return new NextResponse('Product IDs array is required', { status: 400 })
    }
    
    // Delete all products in one transaction
    const deletedCount = await prisma.$transaction(async (tx) => {
      // First delete all associated images
      await tx.image.deleteMany({
        where: {
          productId: {
            in: ids,
          },
        },
      })
      
      // Then delete the products
      const result = await tx.product.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      })
      
      return result.count
    })
    
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} products deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting products in bulk:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 