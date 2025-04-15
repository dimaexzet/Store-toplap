import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { OrderStatus } from '@prisma/client'
import { sendShippingUpdateEmail } from '@/lib/mailgun'

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
    const { status, trackingNumber } = await req.json()
    
    // Validate status value
    if (!status || !Object.values(OrderStatus).includes(status)) {
      return new NextResponse('Invalid order status', { status: 400 })
    }
    
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
    })
    
    if (!order) {
      return new NextResponse('Order not found', { status: 404 })
    }
    
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status,
        ...(trackingNumber && status === OrderStatus.SHIPPED ? { trackingNumber } : {})
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        Address: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })
    
    // Send shipping update email if status is updated to SHIPPED
    if (status === OrderStatus.SHIPPED && updatedOrder.user?.email && process.env.MAILGUN_API_KEY) {
      try {
        await sendShippingUpdateEmail(
          updatedOrder.user.email,
          updatedOrder.user.name || 'Customer',
          id,
          status,
          trackingNumber
        )
      } catch (emailError) {
        console.error('Failed to send shipping update email:', emailError)
        // Continue with the order update even if email fails
      }
    } else if (status === OrderStatus.SHIPPED && !process.env.MAILGUN_API_KEY) {
      // Log that email sending was skipped due to missing API key
      console.warn('Shipping update email not sent - Mailgun API key is missing')
    }
    
    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order status:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 