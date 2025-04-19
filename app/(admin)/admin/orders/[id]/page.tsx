import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Image from 'next/image'
import { OrderStatusControl } from '@/components/admin/orders/order-status-control'
import { OrderRefundButton } from '@/components/admin/orders/order-refund-button'
import { OrderActions } from '@/components/admin/orders/order-actions'
import { OrderStatus } from '@prisma/client'

type tParams = Promise<{ id: string }>

interface OrderPageProps {
  params: tParams
}

async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              Image: true,
            },
          },
        },
      },
      user: true,
      Address: true,
    },
  })

  if (!order) {
    notFound()
  }

  return {
    ...order,
    total: Number(order.total),
    items: order.items.map(item => ({
      ...item,
      price: Number(item.price)
    })),
    trackingNumber: order.trackingNumber || undefined
  }
}

export default async function OrderPage(props: OrderPageProps) {
  const { id } = await props.params
  const order = await getOrder(id)

  // Calculate order summary
  const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const tax = subtotal * 0.1 // 10% tax
  const shipping = 10 // $10 flat shipping
  const total = order.total

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Order Details</h2>
          <p className="text-muted-foreground">
            Order ID: {order.id.substring(0, 8)}
          </p>
        </div>
        <OrderActions order={{
          id: order.id,
          status: order.status,
          user: order.user
        }} />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>
              Created on {format(new Date(order.createdAt), 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Customer</h3>
              <p>{order.user?.name || 'Guest'}</p>
              <p className="text-sm text-muted-foreground">{order.user?.email}</p>
            </div>
            <div>
              <h3 className="font-medium">Payment Method</h3>
              <p>{order.paymentMethod || 'Credit Card'}</p>
              {order.paymentIntentId && (
                <p className="text-sm text-muted-foreground">
                  Payment ID: {order.paymentIntentId.substring(0, 8)}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-medium">Shipping Address</h3>
              {order.Address ? (
                <div>
                  <p>{order.Address.street}</p>
                  <p>
                    {order.Address.city}, {order.Address.state} {order.Address.postalCode}
                  </p>
                  <p>{order.Address.country}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No address provided</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <OrderStatusControl 
              orderId={order.id} 
              currentStatus={order.status} 
              trackingNumber={order.trackingNumber}
            />
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Refund Management</h3>
              <OrderRefundButton 
                orderId={order.id} 
                total={total} 
                disabled={String(order.status) === 'CANCELLED' || String(order.status) === 'REFUNDED'} 
              />
              {String(order.status) === 'REFUNDED' && (
                <p className="text-sm text-muted-foreground mt-2">
                  This order has been refunded.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                <div className="h-20 w-20 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                  {item.product.Image && item.product.Image[0] ? (
                    <Image
                      src={item.product.Image[0].url}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-secondary flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.quantity * item.price)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{formatCurrency(shipping)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 