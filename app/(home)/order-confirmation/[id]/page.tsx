import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'
import { Order, OrderItem, Product, Address } from '@prisma/client'

type OrderParams = Promise<{ id: string }>

interface PageProps {
  params: OrderParams
}

interface OrderWithRelations extends Order {
  items: (OrderItem & {
    product: Product
  })[]
  Address: Address
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  const order = (await prisma.order.findUnique({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      Address: true,
    },
  })) as OrderWithRelations | null

  if (!order) {
    redirect('/')
  }

  // Convert Decimal to number for calculations
  const orderTotal = Number(order.total)

  return (
    <div className='min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4'>
      <div className='w-full max-w-2xl'>
        <div className='rounded-lg border p-8 space-y-6 bg-white shadow-sm'>
          <div className='flex items-center space-x-4'>
            <CheckCircle className='h-8 w-8 text-green-500' />
            <div>
              <h1 className='text-2xl font-bold'>Order Confirmed!</h1>
              <p className='text-gray-500'>Order #{id}</p>
            </div>
          </div>

          <div className='space-y-4'>
            <h2 className='text-lg font-semibold'>Order Summary</h2>
            <div className='divide-y'>
              {order.items.map((item) => (
                <div key={item.id} className='flex justify-between py-4'>
                  <div>
                    <p className='font-medium'>{item.product.name}</p>
                    <p className='text-sm text-gray-500'>
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className='font-medium'>
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span>Subtotal</span>
              <span>{formatPrice(orderTotal)}</span>
            </div>
            <div className='flex justify-between'>
              <span>Shipping</span>
              <span>{formatPrice(10)}</span>
            </div>
            <div className='flex justify-between'>
              <span>Tax</span>
              <span>{formatPrice(orderTotal * 0.1)}</span>
            </div>
            <div className='flex justify-between font-bold'>
              <span>Total</span>
              <span>{formatPrice(orderTotal + 10 + orderTotal * 0.1)}</span>
            </div>
          </div>

          <div className='space-y-2'>
            <h2 className='text-lg font-semibold'>Shipping Address</h2>
            <div className='text-gray-500'>
              {order.Address.street}
              <br />
              {order.Address.city}, {order.Address.state}{' '}
              {order.Address.postalCode}
              <br />
              {order.Address.country}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
