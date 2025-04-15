import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

type tParams = Promise<{ id: string }>

// Get user details
export async function GET(
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
    
    // Get user with their orders
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            paymentMethod: true,
            trackingNumber: true,
            items: {
              select: {
                quantity: true,
                price: true,
                product: {
                  select: {
                    name: true,
                    Image: {
                      take: 1,
                      select: {
                        url: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    })
    
    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }
    
    // Format the user data
    const formattedUser = {
      ...user,
      orders: user.orders.map(order => ({
        ...order,
        total: Number(order.total),
        items: order.items.map(item => ({
          ...item,
          price: Number(item.price),
        })),
      })),
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
  { params }: { params: tParams }
) {
  try {
    const session = await auth()
    
    // Check if user is authenticated
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const { id } = await params
    
    // Users can only update their own profiles unless they're admins
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    const { name, email, role } = await req.json()
    
    // Basic validation
    if ((!name || typeof name !== 'string' || name.trim() === '') && 
        (!email || typeof email !== 'string' || email.trim() === '') &&
        (!role)) {
      return new NextResponse('Invalid request data', { status: 400 })
    }
    
    // Build update data
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    
    // Only admins can update role
    if (role && session.user.role === 'ADMIN') {
      if (role !== 'USER' && role !== 'ADMIN') {
        return new NextResponse('Invalid role', { status: 400 })
      }
      updateData.role = role
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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
  { params }: { params: tParams }
) {
  try {
    const session = await auth()
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const { id } = await params
    
    // Prevent admin from deleting their own account via this API
    if (session.user.id === id) {
      return new NextResponse('Cannot delete your own account', { status: 403 })
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id },
    })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 