import { ProductForm } from '@/components/admin/products/product-form'
import prisma from '@/lib/prisma'

export default async function NewProductPage() {
  // Get categories for the form
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // Format categories for the form component
  const formattedCategories = categories.map(category => ({
    value: category.id,
    label: category.name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-muted-foreground">
          Create a new product in your catalog
        </p>
      </div>

      <ProductForm categories={formattedCategories} />
    </div>
  )
} 