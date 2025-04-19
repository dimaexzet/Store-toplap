import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { emitOrderCreatedEvent, emitStockUpdatedEvent, checkLowStock } from '@/lib/utils'
import { Order as ClientOrder, Product as ClientProduct } from '@/hooks/useSocket'

interface CartItem {
  id: string
  productId: string
  quantity: number
  price: number
}

interface ShippingInfo {
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface OrderBody {
  items: CartItem[]
  shippingInfo: ShippingInfo
  total: number
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized: User ID is required', {
        status: 401,
      })
    }

    const body = await req.json()
    const { items, shippingInfo, total } = body as OrderBody

    if (!items?.length) {
      return new NextResponse('Bad Request: Cart items are required', {
        status: 400,
      })
    }

    if (!shippingInfo) {
      return new NextResponse('Bad Request: Shipping information is required', {
        status: 400,
      })
    }

    // Verify all products exist and are in stock
    const productIds = items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    })

    // Check if all products exist
    if (products.length !== items.length) {
      const foundProductIds = products.map((p) => p.id)
      const missingProductIds = productIds.filter(
        (id) => !foundProductIds.includes(id)
      )
      return new NextResponse(
        `Products not found: ${missingProductIds.join(', ')}`,
        {
          status: 400,
        }
      )
    }

    // Check stock levels
    const insufficientStock = items.filter((item) => {
      const product = products.find((p) => p.id === item.productId)
      return product && product.stock < item.quantity
    })

    if (insufficientStock.length > 0) {
      return new NextResponse(
        `Insufficient stock for products: ${insufficientStock
          .map((item) => item.productId)
          .join(', ')}`,
        { status: 400 }
      )
    }

    // Start a transaction to ensure all operations succeed or fail together
    const order = await prisma.$transaction(async (tx) => {
      // Create order with items
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total,
          paymentMethod: 'STRIPE', // Default payment method
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          Address: {
            create: {
              street: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              postalCode: shippingInfo.zipCode,
              country: shippingInfo.country,
            },
          },
        },
        include: {
          items: true,
          Address: true,
        },
      })

      // Update product stock levels and check for low stock
      for (const item of items) {
        const product = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
          include: {
            category: true,
          },
        })

        // Convert Prisma product to client-safe product format
        const clientProduct: ClientProduct = {
          id: product.id,
          name: product.name,
          description: product.description,
          price: Number(product.price), // Convert Decimal to number
          stock: product.stock,
          categoryId: product.categoryId,
          featured: product.featured
        }

        // Emit stock update event - this now just logs, actual socket emission happens on client
        emitStockUpdatedEvent(clientProduct, product.stock + item.quantity, product.stock)
        
        // Check if stock is low
        if (checkLowStock(product.stock)) {
          console.log(`Low stock alert for ${product.name}: ${product.stock} items remaining`);
          
          // Since the actual emission happens on the client-side,
          // we just log it server-side for now, but in a real app
          // you would want to store these alerts in the database
          // and/or trigger client notifications
        }
      }

      return newOrder
    })

    // Emit order created event - this now just logs, actual socket emission happens on client
    // Convert Prisma order to client-safe order format
    const clientOrder: ClientOrder = {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      trackingNumber: order.trackingNumber || undefined,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price)
      }))
    }
    
    emitOrderCreatedEvent(clientOrder)

    return NextResponse.json({ orderId: order.id })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Could not create order' }, { status: 500 })
  }
}
