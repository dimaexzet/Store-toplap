'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/store/use-cart'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function CartPage() {
  const cart = useCart()
  const [isClient, setIsClient] = useState(false)

  // Отметка о том, что компонент работает на клиенте
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Если компонент на сервере, показываем загрузку
  if (!isClient) {
    return (
      <div className='container mx-auto px-4 py-16'>
        <Card>
          <CardHeader>
            <CardTitle>Загрузка корзины...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Загрузка данных о корзине...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className='container mx-auto px-4 py-16'>
        <Card>
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Add some products to your cart to see them here.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href='/products'>Continue Shopping</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Рассчитываем общую сумму напрямую в компоненте с безопасным преобразованием
  const totalSum = cart.items.reduce(
    (sum, item) => {
      const price = Number(item.price)
      const quantity = Number(item.quantity)
      if (isNaN(price) || isNaN(quantity)) return sum
      return sum + (price * quantity)
    },
    0
  )

  return (
    <div className='container mx-auto px-4 py-16'>
      <Card>
        <CardHeader>
          <CardTitle>Shopping Cart ({cart.items.length} items)</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {cart.items.map((item) => (
            <div
              key={item.id}
              className='flex items-center gap-4 py-4 border-b last:border-0'
            >
              <div className='relative aspect-square h-24 w-24 flex-shrink-0 overflow-hidden rounded-md'>
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className='object-cover'
                />
              </div>
              <div className='flex flex-1 flex-col'>
                <Link
                  href={`/products/${item.productId}`}
                  className='font-medium hover:underline'
                >
                  {item.name}
                </Link>
                <span className='text-muted-foreground'>
                  €{Number(item.price).toFixed(2)}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  min='1'
                  value={item.quantity}
                  onChange={(e) =>
                    cart.updateQuantity(
                      item.productId,
                      parseInt(e.target.value)
                    )
                  }
                  className='w-20'
                />
                <Button
                  variant='destructive'
                  size='icon'
                  onClick={() => cart.removeItem(item.productId)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
              <div className='text-right min-w-[100px]'>
                <div className='font-medium'>
                  €{(Number(item.price) * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className='flex justify-between'>
          <div className='text-lg font-bold'>
            Total: €{totalSum.toFixed(2)}
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' asChild>
              <Link href='/products'>Continue Shopping</Link>
            </Button>
            <Button asChild>
              <Link href='/checkout'>Proceed to Checkout</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
