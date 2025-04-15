import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Получаем публичный ключ из env
    const publishableKey = process.env.STRIPE_PUBLIC_KEY || 'pk_test_dummy_key'
    
    // Определяем, работаем ли в тестовом режиме
    const isTestMode = !process.env.STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY === 'pk_test_dummy_key'

    return NextResponse.json({
      publishableKey,
      isTestMode,
    })
  } catch (error) {
    console.error('[STRIPE_KEYS_ERROR]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 