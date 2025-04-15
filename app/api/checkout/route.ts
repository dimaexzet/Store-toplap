/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'
import { auth } from '@/auth'
import { sendOrderConfirmationEmail } from '@/lib/mailgun'
import { withRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { handleApiError } from '@/lib/security'

// Initialize Stripe only if the API key is available
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeApiKey) {
  stripe = new Stripe(stripeApiKey);
}

// Define validation schema for checkout items
const itemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().url().optional(),
})

const addressSchema = z.object({
  street: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().min(2),
})

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1),
  shippingAddress: addressSchema,
})

async function handler(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = checkoutSchema.safeParse(body)
    
    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Validation error', 
          details: validationResult.error.format() 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const { items, shippingAddress } = validationResult.data

    // Validate items against database records to prevent price manipulation
    const productIds = items.map(item => item.id)
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })
    
    // Create a map for quick lookups
    const productMap = new Map(
      dbProducts.map(p => [p.id, { price: Number(p.price), stock: p.stock }])
    )
    
    // Validate each item
    for (const item of items) {
      const dbProduct = productMap.get(item.id)
      
      // Check if product exists
      if (!dbProduct) {
        return new NextResponse(
          JSON.stringify({ error: `Product not found: ${item.id}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      // Check price manipulation
      if (Math.abs(dbProduct.price - item.price) > 0.01) {
        return new NextResponse(
          JSON.stringify({ error: 'Price mismatch detected' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      // Check stock availability
      if (dbProduct.stock < item.quantity) {
        return new NextResponse(
          JSON.stringify({ 
            error: `Not enough stock for product: ${item.id}`,
            available: dbProduct.stock 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Calculate total from validated items
    const orderTotal = items.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    )

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        paymentMethod: 'STRIPE',
        total: orderTotal,
        Address: {
          create: shippingAddress
        },
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    })

    // Update product stock
    await Promise.all(
      items.map((item: any) => 
        prisma.product.update({
          where: { id: item.id },
          data: { 
            stock: { decrement: item.quantity } 
          }
        })
      )
    )

    // Create Stripe payment intent with idempotency key
    if (!stripe) {
      throw new Error('Stripe API key is not configured');
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(
        (Number(order.total) + Number(order.total) * 0.1 + 10) * 100 // Total + 10% tax + $10 shipping
      ),
      currency: 'usd',
      metadata: {
        orderId: order.id,
        userId: session.user.id,
      },
      receipt_email: session.user.email || undefined,
    }, {
      idempotencyKey: `order_${order.id}`,
    })

    // Send order confirmation email
    if (session.user.email) {
      // Get the full order with items and products
      const orderWithItems = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          Address: true,
        },
      })

      if (orderWithItems) {
        // Send the email
        await sendOrderConfirmationEmail(
          session.user.email,
          session.user.name || 'Customer',
          order.id,
          orderWithItems.items,
          orderWithItems.Address,
          Number(order.total)
        ).catch(error => {
          console.error('Failed to send order confirmation email:', error);
          // Don't fail the checkout process if email fails
        });
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  } catch (error) {
    const { message, status } = handleApiError(error)
    return new NextResponse(
      JSON.stringify({ error: message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Apply rate limiting to checkout endpoint
export const POST = withRateLimit(handler, { limit: 5, windowInSeconds: 60 })
