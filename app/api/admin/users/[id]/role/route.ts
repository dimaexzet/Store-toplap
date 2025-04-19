import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { Role } from '@prisma/client'

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
    
    // Admin cannot change their own role
    if (session.user.id === id) {
      return new NextResponse('Cannot change your own role', { status: 403 })
    }
    
    const { role } = await req.json()
    
    // Validate role value
    if (!role || !Object.values(Role).includes(role)) {
      return new NextResponse('Invalid role value', { status: 400 })
    }
    
    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
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