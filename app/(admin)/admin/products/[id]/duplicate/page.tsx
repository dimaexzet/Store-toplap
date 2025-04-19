import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

type tParams = Promise<{ id: string }>

interface DuplicateProductPageProps {
  params: tParams
}

export default async function DuplicateProductPage({ params }: DuplicateProductPageProps) {
  const { id } = await params

  try {
    // Find the product to duplicate
    const originalProduct = await prisma.product.findUnique({
      where: { id },
      include: { 
        Image: true 
      }
    })

    if (!originalProduct) {
      redirect('/admin/products')
    }

    // Create new product with data from original
    const newProduct = await prisma.product.create({
      data: {
        name: `${originalProduct.name} (Copy)`,
        description: originalProduct.description,
        price: originalProduct.price,
        stock: originalProduct.stock,
        categoryId: originalProduct.categoryId,
        featured: originalProduct.featured,
      },
    })

    // Duplicate images if any
    if (originalProduct.Image && originalProduct.Image.length > 0) {
      await prisma.image.createMany({
        data: originalProduct.Image.map(img => ({
          id: crypto.randomUUID(),
          url: img.url,
          productId: newProduct.id
        }))
      })
    }

    // Redirect to the edit page of the duplicated product
    redirect(`/admin/products/${newProduct.id}`)
  } catch (error) {
    // If something goes wrong, redirect back to products list
    redirect('/admin/products')
  }
} 