import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail, testSmtpConnection } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Получаем данные из запроса
    const body = await request.json();
    const { email, name } = body;
    
    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: 'Email and name are required' },
        { status: 400 }
      );
    }
    
    // Сначала проверяем соединение
    const connectionResult = await testSmtpConnection();
    
    // Отправляем тестовое письмо
    const emailResult = await sendTestEmail(email, name);
    
    return NextResponse.json({
      success: emailResult.success,
      connection: connectionResult,
      email: emailResult,
    });
    
  } catch (error) {
    console.error('Test email API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Получаем данные об окружении
    const envInfo = {
      SMTP_HOST: process.env.SMTP_HOST || 'not set',
      SMTP_PORT: process.env.SMTP_PORT || 'not set',
      SMTP_USER: process.env.SMTP_USER ? 'set (hidden)' : 'not set',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'set (hidden)' : 'not set',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'set (hidden)' : 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    };
    
    // Тестируем SMTP соединение
    const connectionResult = await testSmtpConnection();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      connectionTest: connectionResult,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
} 