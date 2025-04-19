import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const includeProductCount = url.searchParams.get('includeProductCount') === 'true'

    // Get all categories
    let categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    // If we need to include product count
    if (includeProductCount) {
      // Get count of products for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const productCount = await prisma.product.count({
            where: {
              categoryId: category.id,
            },
          })
          return {
            ...category,
            productCount,
          }
        })
      )
      
      categories = categoriesWithCount
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
