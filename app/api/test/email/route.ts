import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendTestEmail, sendOrderConfirmationEmail, sendShippingUpdateEmail } from '@/lib/smtp'

// Environment variables
const MAILGUN_TESTMODE = process.env.MAILGUN_TESTMODE === 'true';

// Валидация входящих данных
const emailSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  type: z.enum(['test', 'order', 'shipping']).default('test'),
  orderId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, type, orderId } = emailSchema.parse(body)

    let result;

    // Log test mode status
    console.log(`Email test endpoint called. Test mode: ${MAILGUN_TESTMODE ? 'ON' : 'OFF'}`);

    switch (type) {
      case 'test':
        // Отправка тестового письма
        result = await sendTestEmail(email, name)
        break
      
      case 'order':
        // Эмуляция подтверждения заказа
        if (!orderId) {
          return NextResponse.json(
            { error: 'Order ID is required for order confirmation emails' },
            { status: 400 }
          )
        }
        
        // Создаем пример товаров для демонстрационных целей
        const mockOrderItems = [
          {
            product: {
              name: 'Тестовый товар 1',
              Image: [{ url: '/placeholder.png' }]
            },
            quantity: 1,
            price: 100
          },
          {
            product: {
              name: 'Тестовый товар 2',
              Image: [{ url: '/placeholder.png' }]
            },
            quantity: 2,
            price: 50
          }
        ]
        
        // Пример адреса доставки
        const mockAddress = {
          street: 'Тестовая улица, 123',
          city: 'Москва',
          state: 'МО',
          postalCode: '123456',
          country: 'Россия'
        }
        
        result = await sendOrderConfirmationEmail(
          email,
          name,
          orderId,
          mockOrderItems,
          mockAddress,
          250 // Общая стоимость заказа
        )
        break
      
      case 'shipping':
        // Эмуляция обновления статуса заказа
        if (!orderId) {
          return NextResponse.json(
            { error: 'Order ID is required for shipping update emails' },
            { status: 400 }
          )
        }
        
        result = await sendShippingUpdateEmail(
          email,
          name,
          orderId,
          'SHIPPED',
          'TRK123456789'
        )
        break
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Email test error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
} 