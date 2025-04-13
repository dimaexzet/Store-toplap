import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { Role } from '@prisma/client'

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
    
    // Don't allow changing own role
    if (session.user.id === params.id) {
      return new NextResponse('Cannot change your own role', { status: 403 })
    }
    
    const body = await req.json()
    const { role } = body
    
    // Validate role
    if (!role || !Object.values(Role).includes(role)) {
      return new NextResponse('Invalid role value', { status: 400 })
    }
    
    const id = params.id
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })
    
    if (!existingUser) {
      return new NextResponse('User not found', { status: 404 })
    }
    
    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user role:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 