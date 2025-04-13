'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/ui/product-card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

interface ProductRelatedProps {
  categoryId: string
  currentProductId: string
}

// Define a type for the product format expected by ProductCard
interface FormattedProduct {
  id: string
  name: string
  description: string
  price: number
  Image?: {
    id: string
    url: string
  }[]
  stock: number
  categoryId: string
  featured: boolean
}

export function ProductRelated({
  categoryId,
  currentProductId,
}: ProductRelatedProps) {
  const [products, setProducts] = useState<FormattedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const response = await fetch(
          `/api/products/related?categoryId=${categoryId}&currentProductId=${currentProductId}`
        )
        const data = await response.json()
        
        // Format the product data to ensure price is a number
        const formattedProducts = data.map((product: any) => ({
          ...product,
          price: Number(product.price)
        }))
        
        setProducts(formattedProducts)
      } catch (error) {
        console.error('Error fetching related products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [categoryId, currentProductId])

  if (loading) {
    return <div>Loading related products...</div>
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-2xl font-bold'>Related Products</h2>
      <Carousel className='w-full'>
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className='md:basis-1/2 lg:basis-1/3'
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}
