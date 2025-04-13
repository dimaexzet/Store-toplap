import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'
import { hash } from 'bcrypt'
import { z } from 'zod'

// Schema for validating user input
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['USER', 'ADMIN']),
  image: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const userData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as Role,
      image: formData.get('image') as string || null,
    }

    // Validate user data
    const validatedData = userSchema.parse(userData)

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await hash(validatedData.password, 10)

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        image: validatedData.image,
      },
    })

    // Return the created user (without password)
    const { password, ...userWithoutPassword } = newUser
    
    // Redirect to the user details page
    return NextResponse.redirect(new URL(`/admin/users/${newUser.id}`, request.url))
  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error instanceof z.ZodError) {
      // Return validation errors
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
} 