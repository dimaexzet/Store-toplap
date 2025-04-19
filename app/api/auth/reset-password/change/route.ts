import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

// Define validation schema
const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  token: z.string().min(1, { message: 'Token is required' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request data
    const result = resetPasswordSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { email, token, password } = result.data;
    
    // Check if token exists and is valid
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    });
    
    if (!verificationToken) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      return NextResponse.json(
        { message: 'Token has expired' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await hash(password, 10);
    
    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    
    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    });
    
    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 