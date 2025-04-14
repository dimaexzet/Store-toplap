import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: Request) {
  try {
    // Проверяем аутентификацию
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем параметры запроса
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') || '5')
    
    if (isNaN(limit)) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      )
    }

    // Так как на данном этапе у нас нет таблицы истории изменений запасов,
    // создадим имитацию последних обновлений на базе последних измененных товаров
    const recentlyUpdatedProducts = await prisma.product.findMany({
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        stock: true,
        categoryId: true,
        price: true,
        featured: true,
        description: true,
        Image: {
          take: 1,
          select: {
            id: true,
            url: true,
          },
        },
      },
    })

    // Преобразуем данные для клиента, имитируя обновления запасов
    // В реальном приложении здесь будут реальные данные из таблицы истории изменений
    const mockStockUpdates = recentlyUpdatedProducts.map((product) => ({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        stock: product.stock,
        categoryId: product.categoryId,
        price: Number(product.price),
        featured: product.featured,
        imageUrl: product.Image.length > 0 ? product.Image[0].url : null,
      },
      previousStock: Math.max(product.stock + Math.floor(Math.random() * 5), 0), // Имитация предыдущего значения
      newStock: product.stock,
      timestamp: new Date(),
    }))

    return NextResponse.json(mockStockUpdates)
  } catch (error) {
    console.error('Error fetching stock updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock updates' },
      { status: 500 }
    )
  }
} 