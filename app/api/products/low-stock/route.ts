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
    const threshold = Number(url.searchParams.get('threshold') || '5')
    
    if (isNaN(threshold)) {
      return NextResponse.json(
        { error: 'Invalid threshold parameter' },
        { status: 400 }
      )
    }

    // Получаем товары с низким запасом
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: threshold,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        categoryId: true,
        featured: true,
        Image: {
          take: 1,
          select: {
            id: true,
            url: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        stock: 'asc',
      },
    })

    // Преобразуем данные для клиента
    const formattedProducts = lowStockProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      categoryId: product.categoryId,
      category: product.category,
      featured: product.featured,
      Image: product.Image,
      imageUrl: product.Image.length > 0 ? product.Image[0].url : null,
    }))

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    )
  }
} 