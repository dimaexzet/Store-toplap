'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useCart } from '@/store/use-cart'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { CartSheet } from '@/components/ui/cart-sheet'

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    Image?: {
      id: string
      url: string
    }[]
    reviews?: {
      rating: number
    }[]
    nameHighlighted?: string
    descriptionHighlighted?: string
    imageUrl?: string
  }
  className?: string
  showHighlights?: boolean
  priority?: boolean
  index?: number
}

export function ProductCard({ 
  product, 
  className,
  showHighlights = false,
  priority = false,
  index = 0
}: ProductCardProps) {
  const cart = useCart()
  const { toast } = useToast()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [addedItem, setAddedItem] = React.useState<any>(null)
  
  const averageRating =
    product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
        product.reviews.length
      : 0
  
  // Get the first image URL or use a placeholder if no images
  const imageUrl = product.imageUrl || 
    (product.Image && product.Image.length > 0
      ? product.Image[0].url
      : '/images/placeholder.jpg')

  // Determine if this image should load with priority
  // First 4 images in a grid should be prioritized for LCP optimization
  const shouldPrioritize = priority || index < 4

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when clicking the button
    
    const item = {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: imageUrl,
      quantity: 1,
    }
    
    cart.addItem(item)
    setAddedItem(item)
    setSheetOpen(true)
  }

  // Format price properly with currency symbol
  const formattedPrice = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(Number(product.price))
  
  // Create a more descriptive alt text for the product image
  const imageAltText = `${product.name} - ${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}`

  // Determine if we should show highlighted content
  const hasHighlightedName = showHighlights && product.nameHighlighted;
  const hasHighlightedDescription = showHighlights && product.descriptionHighlighted;

  return (
    <>
      <Card className={cn('overflow-hidden group h-full flex flex-col', className)}>
        <Link 
          href={`/products/${product.id}`}
          className="flex flex-col h-full"
          aria-label={`Просмотреть товар: ${product.name}`}
        >
          <div className='aspect-square overflow-hidden relative bg-gray-100 dark:bg-gray-800'>
            <Image
              src={imageUrl}
              alt={imageAltText}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
              className='object-cover transition-transform duration-300 group-hover:scale-105'
              priority={shouldPrioritize}
              loading={shouldPrioritize ? 'eager' : 'lazy'}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjwvc3ZnPg=="
            />
          </div>
          <CardHeader className='p-4'>
            <CardTitle className='line-clamp-1'>
              {hasHighlightedName ? (
                <span dangerouslySetInnerHTML={{ __html: product.nameHighlighted! }} />
              ) : (
                product.name
              )}
            </CardTitle>
            <CardDescription className='line-clamp-2'>
              {hasHighlightedDescription ? (
                <span dangerouslySetInnerHTML={{ __html: product.descriptionHighlighted! }} />
              ) : (
                product.description
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className='p-4 pt-0 flex-grow'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center' aria-label={`Рейтинг: ${averageRating.toFixed(1)} из 5`}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      i < Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    )}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className='text-sm text-gray-600' aria-label={`${product.reviews?.length || 0} отзывов`}>
                ({product.reviews?.length || 0})
              </span>
            </div>
            <div className='mt-2 text-xl font-bold' aria-label={`Цена: ${formattedPrice}`}>
              {formattedPrice}
            </div>
          </CardContent>
        </Link>
        <CardFooter className='p-4 pt-0 mt-auto'>
          <Button 
            className='w-full' 
            onClick={handleAddToCart}
            aria-label={`Добавить ${product.name} в корзину`}
          >
            Добавить в корзину
          </Button>
        </CardFooter>
      </Card>
      
      {/* Используем общий компонент для отображения товара в корзине */}
      <CartSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        item={addedItem} 
      />
    </>
  )
}
