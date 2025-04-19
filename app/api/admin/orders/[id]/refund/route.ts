import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import Stripe from 'stripe'

type tParams = Promise<{ id: string }>

export async function POST(
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
    
    // Get order data to check if it can be refunded
    const order = await prisma.order.findUnique({
      where: { id },
    })
    
    if (!order) {
      return new NextResponse('Order not found', { status: 404 })
    }
    
    // Check if order has a payment intent ID (was paid with Stripe)
    if (!order.paymentIntentId) {
      return new NextResponse('Order cannot be refunded - no payment intent found', { status: 400 })
    }
    
    // Check if order status allows refund
    if (order.status === 'REFUNDED') {
      return new NextResponse('Order is already refunded', { status: 400 })
    }
    
    if (order.status === 'CANCELLED') {
      return new NextResponse('Cancelled orders cannot be refunded', { status: 400 })
    }
    
    // Process the refund with Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    
    await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
    })
    
    // Update order status to REFUNDED
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'REFUNDED' },
      include: {
        items: true,
        Address: true,
      },
    })
    
    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error processing refund:', error)
    return new NextResponse('Failed to process refund', { status: 500 })
  }
} 