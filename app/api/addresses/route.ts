import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to add an address' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { street, city, state, postalCode, country } = body

    // Since addresses are tied to orders in our schema,
    // we need to create a temporary order to store the address
    // or update an existing one with this flag
    const placeholderOrder = await prisma.order.create({
      data: {
        userId: session.user.id,
        total: 0,
        status: 'PENDING',
        paymentMethod: 'CASH_ON_DELIVERY',
        Address: {
          create: {
            street,
            city,
            state,
            postalCode,
            country,
          }
        }
      },
      include: {
        Address: true
      }
    })

    return NextResponse.json({
      address: placeholderOrder.Address,
      message: 'Address added successfully'
    })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Get all addresses for the current user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to view addresses' },
        { status: 401 }
      )
    }

    // Find all orders for the user that have an address
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        Address: true,
      },
    })

    // Extract unique addresses
    const addresses = orders
      .map(order => order.Address)
      .filter((address): address is NonNullable<typeof address> => address !== null)
      .filter((address, index, self) =>
        index === self.findIndex(a => a.id === address.id)
      )

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 