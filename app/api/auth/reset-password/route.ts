import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/smtp';

// Define validation schema
const resetSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request data
    const result = resetSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { email } = result.data;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    
    if (!user) {
      // We don't want to reveal if an email exists or not for security reasons
      // So we'll return a success response regardless
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }
    
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
    
    // Check if a verification token already exists for this user
    const existingToken = await prisma.verificationToken.findFirst({
      where: { identifier: email }
    });
    
    if (existingToken) {
      // Update existing token
      await prisma.verificationToken.update({
        where: {
          identifier_token: {
            identifier: email,
            token: existingToken.token
          }
        },
        data: {
          token,
          expires: expiresAt
        }
      });
    } else {
      // Create new token
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: expiresAt
        }
      });
    }
    
    // Create reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Send password reset email
    await sendPasswordResetEmail(email, user.name || 'User', token);
    
    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
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