import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { OrderStatus } from '@prisma/client'
import { sendShippingUpdateEmail } from '@/lib/email'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    // Check authentication and admin role
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const body = await req.json()
    const { status, trackingNumber } = body
    
    // Validate status
    if (!status || !Object.values(OrderStatus).includes(status)) {
      return new NextResponse('Invalid status value', { status: 400 })
    }
    
    const id = params.id
    
    // Check if order exists and get user information
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true
      }
    })
    
    if (!existingOrder) {
      return new NextResponse('Order not found', { status: 404 })
    }
    
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status: status as OrderStatus,
        // If tracking number is provided and status is SHIPPED, update it
        ...(trackingNumber && status === OrderStatus.SHIPPED ? { trackingNumber } : {})
      },
    })
    
    // Send shipping update email if user has an email
    if (existingOrder.user?.email) {
      await sendShippingUpdateEmail(
        existingOrder.user.email,
        existingOrder.user.name || 'Customer',
        id,
        status,
        trackingNumber
      ).catch(error => {
        console.error('Failed to send shipping update email:', error);
        // Continue with the update even if email fails
      });
    }
    
    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order status:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 