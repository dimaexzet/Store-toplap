import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { orderId, paymentDetails } = body

    if (!orderId) {
      return new NextResponse('Order ID is required', { status: 400 })
    }

    // Получаем заказ
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
      return new NextResponse('Order not found', { status: 404 })
    }

    // Если заказ уже оплачен, вернуть ошибку
    if (order.paymentIntentId) {
      return new NextResponse('Order is already paid', { status: 400 })
    }

    // Генерируем фиктивный ID платежа
    const mockPaymentIntentId = `mock_payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

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

    // Здесь можно отправить подтверждение по электронной почте
    // (в реальном приложении)

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