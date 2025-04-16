import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { sendOrderConfirmationEmail } from '@/lib/smtp'

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('[MOCK_PAYMENT] Processing payment request');
    const body = await req.json()
    const { orderId, paymentDetails } = body

    if (!orderId) {
      return new NextResponse('Order ID is required', { status: 400 })
    }

    // Получаем заказ
    console.log(`[MOCK_PAYMENT] Fetching order: ${orderId}`);
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        Address: true,
      },
    })

    if (!order) {
      console.log(`[MOCK_PAYMENT] Order not found: ${orderId}`);
      return new NextResponse('Order not found', { status: 404 })
    }

    // Если заказ уже оплачен, вернуть ошибку
    if (order.paymentIntentId) {
      console.log(`[MOCK_PAYMENT] Order already paid: ${orderId}`);
      return new NextResponse('Order is already paid', { status: 400 })
    }

    // Генерируем фиктивный ID платежа
    const mockPaymentIntentId = `mock_payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    console.log(`[MOCK_PAYMENT] Generated payment intent ID: ${mockPaymentIntentId}`);

    // Обновляем заказ с ID платежа и устанавливаем статус PROCESSING
    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentIntentId: mockPaymentIntentId,
        status: 'PROCESSING',
      },
      include: {
        items: true,
        Address: true,
      },
    })

    // Преобразуем Decimal в number для клиентской стороны
    const orderForClient = {
      ...updatedOrder,
      total: Number(updatedOrder.total),
      items: updatedOrder.items.map(item => ({
        ...item,
        price: Number(item.price)
      }))
    }

    // Отправляем подтверждение по электронной почте
    if (session.user.email) {
      try {
        console.log(`[MOCK_PAYMENT] Sending order confirmation email to: ${session.user.email}`);
        const result = await sendOrderConfirmationEmail(
          session.user.email,
          session.user.name || 'Customer',
          order.id,
          order.items,
          order.Address,
          Number(order.total)
        );
        console.log(`[MOCK_PAYMENT] Email send result:`, result);
      } catch (emailError) {
        console.error('[MOCK_PAYMENT] Failed to send email:', emailError);
        // Не прерываем выполнение, даже если письмо не отправилось
      }
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: mockPaymentIntentId,
      order: orderForClient,
    })
  } catch (error) {
    console.error('[MOCK_PAYMENT_ERROR]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 