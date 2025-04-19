import { NextResponse } from 'next/server'
import { testSmtpConnection, sendTestEmail } from '@/lib/smtp'

export async function GET() {
  try {
    // Test the SMTP connection
    const connectionResult = await testSmtpConnection()
    
    if (!connectionResult.success) {
      return NextResponse.json({
        success: false,
        message: 'SMTP connection test failed',
        error: connectionResult.error
      }, { status: 500 })
    }
    
    // Try sending a test email to the admin
    const emailResult = await sendTestEmail(
      'info@toplap.store', 
      'Administrator'
    )
    
    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        message: 'SMTP connection established but test email failed',
        error: emailResult.error
      }, { status: 500 })
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'SMTP connection verified and test email sent successfully',
      data: {
        connection: connectionResult,
        email: emailResult
      }
    })
  } catch (error) {
    console.error('Error in SMTP test route:', error)
    
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred during SMTP testing',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 