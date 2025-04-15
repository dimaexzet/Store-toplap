import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import formData from 'form-data'
import Mailgun from 'mailgun.js'
import { z } from 'zod'

// Mailgun configuration
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'no-reply@example.com'
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'mg.yourdomain.com'
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY

// Create Mailgun client
const mailgun = new Mailgun(formData)
const mg = MAILGUN_API_KEY
  ? mailgun.client({ username: 'api', key: MAILGUN_API_KEY })
  : null

// Schema for validation
const emailTestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  type: z.enum(['test', 'order', 'shipping', 'reset']),
})

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const result = emailTestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      )
    }

    const { email, name, type } = result.data

    // Check if Mailgun client is configured
    if (!mg) {
      return NextResponse.json(
        { error: 'Mailgun API key is not configured' },
        { status: 503 }
      )
    }

    // Generate test email content based on type
    let subject = 'Test Email'
    let html = ''

    switch (type) {
      case 'test':
        subject = 'Mailgun Test Email'
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Test Email</h1>
            <p>Hello ${name},</p>
            <p>This is a test email from Mailgun integration in AI Amazona.</p>
            <p>If you're receiving this email, it means the email service is working correctly!</p>
            <p>Server time: ${new Date().toLocaleString()}</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p>This is a demo of email styling capabilities.</p>
              <ul>
                <li>HTML formatting</li>
                <li>Styled content</li>
                <li>Responsive design</li>
              </ul>
            </div>
            <p>Thank you for testing the email service!</p>
            <p>The AI Amazona Team</p>
          </div>
        `
        break
      case 'order':
        subject = 'Order Confirmation #TEST-123'
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Order Confirmation</h1>
            <p>Hello ${name},</p>
            <p>Thank you for your order! This is a <strong>TEST</strong> order confirmation.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Order #TEST-123</h2>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Payment Method:</strong> STRIPE</p>
              <p><strong>Total:</strong> $99.99</p>
            </div>
            <p>This is a test email. No actual order has been placed.</p>
            <p>The AI Amazona Team</p>
          </div>
        `
        break
      case 'shipping':
        subject = 'Your Order #TEST-123 Has Shipped'
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Shipping Update</h1>
            <p>Hello ${name},</p>
            <p>Your order has been shipped! This is a <strong>TEST</strong> shipping notification.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Order #TEST-123</h2>
              <p><strong>Status:</strong> SHIPPED</p>
              <p><strong>Tracking Number:</strong> TEST-TRACKING-123</p>
            </div>
            <p>This is a test email. No actual order has been shipped.</p>
            <p>The AI Amazona Team</p>
          </div>
        `
        break
      case 'reset':
        subject = 'Reset Your Password'
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Password Reset</h1>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password. This is a <strong>TEST</strong> password reset email.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background-color: #f0c14b; color: #111; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
            </div>
            <p>This is a test email. No actual password reset has been requested.</p>
            <p>The AI Amazona Team</p>
          </div>
        `
        break
    }

    // Send the email
    const data = await mg.messages.create(MAILGUN_DOMAIN, {
      from: SENDER_EMAIL,
      to: email,
      subject,
      html,
    })

    return NextResponse.json({
      success: true,
      message: `Test email (${type}) sent successfully`,
      details: data,
    })
  } catch (error) {
    console.error('[EMAIL_TEST_ERROR]', error)
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
} 