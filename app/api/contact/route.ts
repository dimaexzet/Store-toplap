import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendContactFormEmail } from '@/lib/email'

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
    // Parse the request body
    const body = await request.json()
    
    // Validate the data
    const result = contactFormSchema.safeParse(body)
    
    if (!result.success) {
      // Return validation errors
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
    const emailResult = await sendContactFormEmail(
      name,
      email,
      phone || '',
      subject,
      message
    )
    
    if (!emailResult.success) {
      console.error('Error sending contact form email:', emailResult.error)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to send email. Please try again later.' 
        },
        { status: 500 }
      )
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Contact message sent successfully'
    })
    
  } catch (error) {
    console.error('Error in contact form API:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'An unexpected error occurred. Please try again later.' 
      },
      { status: 500 }
    )
  }
} 