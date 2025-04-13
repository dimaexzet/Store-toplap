import { Button } from "@/components/ui/button"
import { PlusCircle, Import, FileDown } from "lucide-react"
import { ProductsTable } from "@/components/admin/products/products-table"
import Link from "next/link"
import prisma from "@/lib/prisma"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await searchParams before accessing
  const params = await searchParams
  
  // Parse query parameters for filtering and pagination
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 10
  const search = typeof params.search === 'string' ? params.search : ''
  const category = typeof params.category === 'string' ? params.category : ''
  const sortBy = typeof params.sort === 'string' ? params.sort : 'createdAt'
  const sortOrder = typeof params.order === 'string' ? params.order : 'desc'

  // Get products with filters and pagination
  const where: any = {}
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  if (category) {
    where.categoryId = category
  }

  const [products, categoriesData, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
        Image: {
          select: {
            url: true,
          },
          take: 1,
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.count({ where }),
  ])

  // Format product data
  const formattedProducts = products.map(product => ({
    ...product,
    price: Number(product.price),
    imageUrl: product.Image[0]?.url || null,
  }))

  // Format categories for filter dropdown
  const categories = categoriesData.map(category => ({
    value: category.id,
    label: category.name,
  }))

  const totalPages = Math.ceil(totalProducts / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/admin/products/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Import className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <ProductsTable 
        products={formattedProducts}
        categories={categories} 
        totalPages={totalPages}
        currentPage={page}
        totalProducts={totalProducts}
        search={search}
        category={category}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
} 