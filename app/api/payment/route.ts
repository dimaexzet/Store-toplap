import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

// Check if Stripe API key is available
const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build';
const stripe = new Stripe(stripeApiKey);

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if Stripe API key is properly configured
    if (process.env.STRIPE_SECRET_KEY === 'dummy_key_for_build' || !process.env.STRIPE_SECRET_KEY) {
      return new NextResponse('Payment processing is not configured', { status: 503 })
    }

    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return new NextResponse('Order ID is required', { status: 400 })
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        Address: true,
      },
    })

    if (!order) {
      return new NextResponse('Order not found', { status: 404 })
    }

    // If order is already paid, return error
    if (order.paymentIntentId) {
      return new NextResponse('Order is already paid', { status: 400 })
    }

    // Calculate final amount including tax and shipping
    const subtotal = Number(order.total)
    const shipping = 10 // Fixed shipping cost
    const tax = subtotal * 0.1 // 10% tax
    const total = Math.round((subtotal + shipping + tax) * 100) // Convert to cents

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      metadata: {
        orderId: order.id,
        userId: session.user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Update order with payment intent ID
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentIntentId: paymentIntent.id,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error('[PAYMENT_ERROR]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
