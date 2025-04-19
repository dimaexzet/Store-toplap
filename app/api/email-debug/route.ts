import { NextResponse } from 'next/server';
import { testSmtpConnection, sendTestEmail } from '@/lib/email';

export async function GET() {
  try {
    // Get environment variables
    const envInfo = {
      SMTP_HOST: process.env.SMTP_HOST || 'not set',
      SMTP_PORT: process.env.SMTP_PORT || 'not set',
      SMTP_USER: process.env.SMTP_USER ? process.env.SMTP_USER : 'not set',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'set (hidden)' : 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'not set',
      SENDER_NAME: process.env.SENDER_NAME || 'not set',
      SENDER_EMAIL: process.env.SENDER_EMAIL || 'not set',
    };

    // Test SMTP connection
    const connectionResult = await testSmtpConnection();
    
    // Попытка отправить тестовое письмо себе
    let testEmailResult = null;
    if (process.env.SMTP_USER) {
      try {
        testEmailResult = await sendTestEmail(
          process.env.SMTP_USER, 
          'Test User'
        );
      } catch (error) {
        testEmailResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      connectionTest: connectionResult,
      testEmail: testEmailResult
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
} 