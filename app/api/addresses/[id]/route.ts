import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

type tParams = Promise<{ id: string }>

// DELETE address
export async function DELETE(
  request: NextRequest,
  { params }: { params: tParams }
) {
  try {
    // Auth check
    const session = await auth()
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const { id } = await params
    
    // Check if address exists and belongs to user
    const address = await prisma.address.findUnique({
      where: { id },
      select: { orderId: true, Order: { select: { userId: true } } },
    })
    
    if (!address) {
      return new NextResponse('Address not found', { status: 404 })
    }
    
    // Only allow user to delete their own address
    if (address.Order.userId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    // Delete address
    await prisma.address.delete({
      where: { id },
    })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting address:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 