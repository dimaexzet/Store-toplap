'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCart } from '@/store/use-cart'
import { useToast } from '@/hooks/use-toast'

const shippingFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
})

type ShippingFormValues = z.infer<typeof shippingFormSchema>

export function ShippingForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const cart = useCart()
  const { toast } = useToast()

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  })

  async function onSubmit(data: ShippingFormValues) {
    try {
      setLoading(true)

      // Проверяем наличие товаров в корзине
      if (!cart.items.length) {
        toast({
          variant: 'destructive',
          title: 'Cart is empty',
          description: 'Please add some products to your cart before checkout.',
        })
        return
      }

      // Явно преобразуем все цены в числа
      const cartItems = cart.items.map(item => ({
        ...item,
        price: Number(item.price)
      }))

      // Расчет с проверкой на NaN и преобразованием в числа
      const subtotal = cartItems.reduce((total, item) => {
        const itemPrice = Number(item.price)
        const itemQuantity = Number(item.quantity)
        
        if (isNaN(itemPrice) || isNaN(itemQuantity)) {
          console.error('Invalid price or quantity', { item })
          return total
        }
        
        return total + (itemPrice * itemQuantity)
      }, 0)

      const shipping = 10 // Fixed shipping cost
      const tax = subtotal * 0.1 // 10% tax
      const total = subtotal + shipping + tax

      console.log('Order data:', {
        items: cartItems,
        shippingInfo: data,
        subtotal,
        tax,
        shipping,
        total,
      })

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems,
          shippingInfo: data,
          subtotal,
          tax,
          shipping,
          total,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Response error:', response.status, errorData)
        throw new Error(`Failed to create order: ${errorData}`)
      }

      const { orderId } = await response.json()

      // Clear cart after successful order creation
      cart.clearCart()

      // Redirect to payment page
      router.push(`/payment/${orderId}`)
    } catch (error) {
      console.error('[SHIPPING_FORM]', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create order. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='fullName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder='John Doe' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='john@example.com' type='email' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='address'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder='123 Main St' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='city'
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder='New York' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='state'
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder='NY' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='zipCode'
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder='10001' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='country'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder='United States' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Creating Order...' : 'Continue to Payment'}
        </Button>
      </form>
    </Form>
  )
}
