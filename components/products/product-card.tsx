'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ShoppingCart } from 'lucide-react'
import useCart from '@/hooks/use-cart'

interface ProductCardProps {
  id: string
  name: string
  price: number
  imageUrl: string | null
  category?: string
}

export function ProductCard({ id, name, price, imageUrl, category }: ProductCardProps) {
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      image: imageUrl || '',
      stock: 10 // Default stock value, replace with actual stock if available
    })
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <Link href={`/products/${id}`} className="relative aspect-square">
        <div className="h-[200px] relative">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              priority={false}
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400">Нет изображения</span>
            </div>
          )}
        </div>
        {category && (
          <span className="absolute top-2 left-2 bg-white/80 text-black text-xs px-2 py-1 rounded-full">
            {category}
          </span>
        )}
      </Link>
      <CardContent className="flex-1 py-4">
        <Link href={`/products/${id}`} className="text-lg font-medium hover:underline line-clamp-2">
          {name}
        </Link>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-0 pb-4">
        <div className="font-bold">{formatPrice(price)}</div>
        <Button
          onClick={handleAddToCart}
          variant="secondary"
          size="sm"
          className="flex items-center gap-1"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:inline-block">В корзину</span>
        </Button>
      </CardFooter>
    </Card>
  )
} 