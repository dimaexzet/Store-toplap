'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/store/use-cart'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function OrderSummary() {
  const cart = useCart()
  const [isClient, setIsClient] = useState(false)
  
  // Отметка о том, что компонент работает на клиенте
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Расчёт суммарной стоимости с безопасным преобразованием типов
  const subtotal = cart.items.reduce((total, item) => {
    const price = Number(item.price)
    const quantity = Number(item.quantity)
    if (isNaN(price) || isNaN(quantity)) return total
    return total + (price * quantity)
  }, 0)

  const shipping = 10 // Fixed shipping cost
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + shipping + tax

  // Если на сервере или нет товаров, показываем пустую корзину
  if (!isClient || cart.items.length === 0) {
    return (
      <div className='text-center py-4 text-muted-foreground'>
        Your cart is empty
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <ScrollArea className='h-[300px] pr-4'>
        {cart.items.map((item) => (
          <div key={item.id} className='flex items-start space-x-4 py-4'>
            <div className='relative h-16 w-16 overflow-hidden rounded-lg'>
              <Image
                src={item.image}
                alt={item.name}
                fill
                className='object-cover'
              />
            </div>
            <div className='flex-1 space-y-1'>
              <h3 className='font-medium'>{item.name}</h3>
              <p className='text-sm text-gray-500'>Qty: {item.quantity}</p>
              <p className='text-sm font-medium'>
                {formatPrice(Number(item.price) * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </ScrollArea>

      <Separator />

      <div className='space-y-4'>
        <div className='flex justify-between text-sm'>
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className='flex justify-between text-sm'>
          <span>Shipping</span>
          <span>{formatPrice(shipping)}</span>
        </div>
        <div className='flex justify-between text-sm'>
          <span>Tax</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <Separator />
        <div className='flex justify-between font-medium'>
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}
