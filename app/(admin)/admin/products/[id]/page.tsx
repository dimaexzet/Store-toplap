import { ProductForm } from '@/components/admin/products/product-form'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default async function EditProductPage({ params }: Props) {
  const productId = params.id
  
  // Get product data
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      Image: true,
    },
  })
  
  // If product not found, show 404
  if (!product) {
    notFound()
  }
  
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
  
  // Format product data for the form
  const productData = {
    name: product.name,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    categoryId: product.categoryId,
    featured: product.featured,
    images: product.Image,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground">
          Update product information and images
        </p>
      </div>

      <ProductForm 
        productId={productId}
        initialData={productData}
        categories={formattedCategories}
      />
    </div>
  )
} 