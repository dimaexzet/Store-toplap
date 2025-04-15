import { NextResponse } from 'next/server'
import { sendPasswordResetEmail, sendOrderConfirmationEmail, sendShippingUpdateEmail } from '@/lib/mailgun'
import { z } from 'zod'

// Mailgun configuration
const SENDER_NAME = process.env.SENDER_NAME || 'Toplap';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'info@toplap.store';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sandbox10c96c42fded4deaa2c239a8c091d20b.mailgun.org';
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;

// Подробнее печатаем информацию для отладки
console.log('===================== MAILGUN CONFIG =====================');
console.log('API Key Length:', MAILGUN_API_KEY ? MAILGUN_API_KEY.length : 'no key');
console.log('API Key Last 5 chars:', MAILGUN_API_KEY ? MAILGUN_API_KEY.slice(-5) : 'no key');
console.log('Domain:', MAILGUN_DOMAIN);
console.log('Sender:', `${SENDER_NAME} <${SENDER_EMAIL}>`);
console.log('============================================================');

// Валидация данных запроса
const EmailRequestSchema = z.object({
  type: z.enum(['passwordReset', 'orderConfirmation', 'shippingUpdate']),
  email: z.string().email(),
  name: z.string().optional()
});

// Для sandbox доменов Mailgun требуется добавить email получателя в список "Authorized Recipients"
// в панели управления Mailgun, иначе письма не будут отправляться
export async function POST(req: Request) {
  try {
    // Временно отключаем проверку авторизации для тестирования
    // const session = await auth()
    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return new NextResponse('Unauthorized', { status: 401 })
    // }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = EmailRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { type, email, name } = validationResult.data

    // Check if Mailgun API key is configured
    if (!MAILGUN_API_KEY) {
      return NextResponse.json(
        { error: 'Mailgun API key is not configured' },
        { status: 503 }
      )
    }

    let emailResult;

    switch (type) {
      case 'passwordReset':
        emailResult = await sendPasswordResetEmail(
          email,
          name || 'User',
          'test-reset-token-12345'
        );
        break;
      case 'orderConfirmation':
        const testOrderItems = [
          {
            product: {
              name: 'Test Product 1',
              Image: [{ url: 'https://placehold.co/100x100' }],
            },
            quantity: 2,
            price: 19.99,
          },
          {
            product: {
              name: 'Test Product 2',
              Image: [{ url: 'https://placehold.co/100x100' }],
            },
            quantity: 1,
            price: 29.99,
          },
        ];

        const testAddress = {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country',
        };

        emailResult = await sendOrderConfirmationEmail(
          email,
          name || 'Test Customer',
          'TEST12345',
          testOrderItems,
          testAddress,
          79.97
        );
        break;
      case 'shippingUpdate':
        emailResult = await sendShippingUpdateEmail(
          email,
          name || 'Test Customer',
          'TEST12345',
          'SHIPPED',
          'TRK123456789'
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type} email sent successfully`,
      details: emailResult.data
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
} 