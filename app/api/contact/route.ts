import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendContactFormEmail, testSmtpConnection } from '@/lib/email'

// Schema for validating contact form data
const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must contain at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must contain at least 5 characters')
    .max(100, 'Email must not exceed 100 characters'),
  
  phone: z
    .string()
    .optional()
    .or(z.literal('')),
  
  subject: z
    .string()
    .min(2, 'Subject must contain at least 2 characters')
    .max(100, 'Subject must not exceed 100 characters'),
  
  message: z
    .string()
    .min(10, 'Message must contain at least 10 characters')
    .max(1000, 'Message must not exceed 1000 characters'),
})

export async function POST(request: NextRequest) {
  try {
    // Проверяем SMTP соединение перед отправкой
    console.log('Testing SMTP connection before processing contact form...');
    const connectionTest = await testSmtpConnection();
    
    if (!connectionTest.success) {
      console.error('SMTP connection test failed before form processing:', connectionTest.error);
      // Продолжаем выполнение, так как у нас может быть доступен Resend API
    } else {
      console.log('SMTP connection test successful');
    }
    
    // Parse the request body
    const body = await request.json()
    console.log('Received contact form submission:', { ...body, message: body.message?.substring(0, 20) + '...' });
    
    // Validate the data
    const result = contactFormSchema.safeParse(body)
    
    if (!result.success) {
      // Return validation errors
      console.error('Contact form validation failed:', result.error.format());
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors: result.error.format() 
        },
        { status: 400 }
      )
    }
    
    const { name, email, phone, subject, message } = result.data
    
    // Send the email using SMTP
    console.log('Attempting to send contact form email...');
    const emailResult = await sendContactFormEmail(
      name,
      email,
      phone || '',
      subject,
      message
    )
    
    console.log('Email sending result:', emailResult);
    
    if (!emailResult.success) {
      console.error('Error sending contact form email:', emailResult.error)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to send email. Please try again later.',
          details: emailResult
        },
        { status: 500 }
      )
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Contact message sent successfully',
      provider: emailResult.provider
    })
    
  } catch (error) {
    console.error('Error in contact form API:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'An unexpected error occurred. Please try again later.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 