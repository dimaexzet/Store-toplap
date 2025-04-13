import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// Get user details
export async function GET(
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
    
    // Get user with orders
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    })
    
    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }
    
    // Format response (convert Decimal values to numbers)
    const formattedOrders = user.orders.map(order => ({
      ...order,
      total: Number(order.total),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
      })),
    }))
    
    const formattedUser = {
      ...user,
      orders: formattedOrders,
    }
    
    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Update user
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
    
    const id = params.id
    const body = await req.json()
    
    // Validate input
    const { name, email, image } = body
    
    if (email) {
      // Check if email already exists for another user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })
      
      if (existingUser && existingUser.id !== id) {
        return new NextResponse('Email already in use', { status: 400 })
      }
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(image !== undefined && { image }),
      },
    })
    
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    // Check authentication and admin role
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    // Don't allow deleting self
    if (session.user.id === params.id) {
      return new NextResponse('Cannot delete your own account', { status: 403 })
    }
    
    const id = params.id
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })
    
    if (!existingUser) {
      return new NextResponse('User not found', { status: 404 })
    }
    
    // Delete the user - Prisma will cascade delete related records
    await prisma.user.delete({
      where: { id },
    })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 