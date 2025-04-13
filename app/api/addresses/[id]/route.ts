import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete an address' },
        { status: 401 }
      )
    }

    const addressId = params.id

    // First, find the address to confirm it exists and to get the orderId
    const address = await prisma.address.findUnique({
      where: {
        id: addressId,
      },
      include: {
        Order: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    // Ensure the user owns this address by checking the associated order
    if (address.Order?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this address' },
        { status: 403 }
      )
    }

    // In our schema, the address is linked to an order
    // Since Prisma cascades the delete, we need to delete the order
    // which will automatically delete the address
    await prisma.order.delete({
      where: {
        id: address.orderId,
      },
    })

    return NextResponse.json({
      message: 'Address deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 