'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'

interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
}

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: CartItem | null
}

export function CartSheet({ open, onOpenChange, item }: CartSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Added to Cart
          </SheetTitle>
          <SheetDescription>
            Item has been added to your shopping cart.
          </SheetDescription>
        </SheetHeader>
        
        {item && (
          <div className="py-6">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-md overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-muted-foreground">€{item.price.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
              </div>
            </div>
            
            {/* Показываем итоговую сумму */}
            <div className="mt-6 flex justify-between items-center border-t pt-4">
              <span className="font-medium">Subtotal:</span>
              <span className="font-bold">€{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        )}
        
        <SheetFooter className="mt-auto flex flex-col gap-2">
          <Button variant="default" size="lg" asChild>
            <Link href="/cart">Checkout Now</Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Continue Shopping
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 