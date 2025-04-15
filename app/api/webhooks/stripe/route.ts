import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

// Для упрощения тестирования без настоящих ключей
const DUMMY_WEBHOOK_SECRET = 'whsec_testing123'
const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || DUMMY_WEBHOOK_SECRET
const stripe = new Stripe(stripeApiKey)

// Отключаем защиту CSRF для вебхуков
export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    // В Next.js 14 headers() возвращает объект, а не Promise
    const headerList = headers()
    const signature = headerList.get('stripe-signature') || ''

    // Используем заглушку для тестирования, если настоящие ключи отсутствуют
    let event
    let isTestMode = false

    // Проверяем, используются ли заглушки
    if (stripeApiKey === 'sk_test_dummy' || webhookSecret === DUMMY_WEBHOOK_SECRET) {
      console.log('[STRIPE WEBHOOK] Running in test mode')
      isTestMode = true
      
      // Парсим тело запроса для тестирования
      try {
        event = JSON.parse(body)
      } catch (err) {
        return new NextResponse('Invalid JSON', { status: 400 })
      }
    } else {
      // Реальная проверка подписи Stripe
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } catch (err) {
        console.error(`⚠️ Webhook signature verification failed:`, err)
        return new NextResponse(
          `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          { status: 400 }
        )
      }
    }

    // Обработка различных типов событий
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, isTestMode)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, isTestMode)
        break
        
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, isTestMode)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse(
      `Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  isTestMode: boolean
) {
  try {
    console.log(`💰 Payment intent succeeded: ${paymentIntent.id}`)
    
    if (isTestMode) {
      console.log('[TEST MODE] Would update order status to PAID')
      return
    }
    
    // Получаем ID заказа из метаданных
    const orderId = paymentIntent.metadata.orderId
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata')
      return
    }
    
    // Обновляем статус заказа
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        paymentIntentId: paymentIntent.id,
      },
    })
    
    console.log(`✅ Order ${orderId} marked as paid`)
  } catch (error) {
    console.error('Error processing payment success:', error)
  }
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  isTestMode: boolean
) {
  try {
    console.log(`❌ Payment intent failed: ${paymentIntent.id}`)
    
    if (isTestMode) {
      console.log('[TEST MODE] Would update order status to FAILED')
      return
    }
    
    // Получаем ID заказа из метаданных
    const orderId = paymentIntent.metadata.orderId
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata')
      return
    }
    
    // Обновляем статус заказа
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        paymentIntentId: paymentIntent.id,
      },
    })
    
    console.log(`❌ Order ${orderId} marked as failed`)
  } catch (error) {
    console.error('Error processing payment failure:', error)
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  isTestMode: boolean
) {
  try {
    console.log(`🛒 Checkout session completed: ${session.id}`)
    
    if (isTestMode) {
      console.log('[TEST MODE] Would create order from checkout session')
      return
    }
    
    // В реальном приложении здесь создаем заказ на основе данных из сессии
    // или обновляем существующий, если он был создан предварительно
    
    // Пример:
    // const customerId = session.customer
    // const orderId = session.metadata?.orderId
    // 
    // if (orderId) {
    //   await prisma.order.update({
    //     where: { id: orderId },
    //     data: { status: 'PROCESSING' }
    //   })
    // }
  } catch (error) {
    console.error('Error processing checkout session:', error)
  }
} 