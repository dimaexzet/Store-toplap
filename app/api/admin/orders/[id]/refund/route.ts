import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { OrderStatus } from '@prisma/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    // Check authentication and admin role
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const id = params.id
    
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
    })
    
    if (!order) {
      return new NextResponse('Order not found', { status: 404 })
    }
    
    // Check if order is already refunded or cancelled
    if (order.status === OrderStatus.REFUNDED) {
      return new NextResponse('Order is already refunded', { status: 400 })
    }
    
    if (order.status === OrderStatus.CANCELLED) {
      return new NextResponse('Cannot refund a cancelled order', { status: 400 })
    }
    
    // Process refund if payment intent exists
    if (order.paymentIntentId) {
      try {
        // Process the refund through Stripe
        await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
        })
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError)
        return new NextResponse('Payment processor error', { status: 500 })
      }
    }
    
    // Update order status to REFUNDED
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: OrderStatus.REFUNDED },
    })
    
    // If the order was successfully refunded, restock the items
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      include: { product: true },
    })
    
    // Restock items
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order refunded successfully',
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Error processing refund:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 