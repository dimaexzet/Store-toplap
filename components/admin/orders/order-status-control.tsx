'use client'

import { useState } from 'react'
import { OrderStatus } from '@prisma/client'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'

interface OrderStatusControlProps {
  orderId: string
  currentStatus: OrderStatus
  trackingNumber?: string
}

export function OrderStatusControl({ 
  orderId, 
  currentStatus,
  trackingNumber 
}: OrderStatusControlProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [tracking, setTracking] = useState<string>(trackingNumber || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const statusOptions = [
    { value: OrderStatus.PENDING, label: 'Pending', description: 'Order received, awaiting processing' },
    { value: OrderStatus.PROCESSING, label: 'Processing', description: 'Order is being prepared' },
    { value: OrderStatus.SHIPPED, label: 'Shipped', description: 'Order has been shipped' },
    { value: OrderStatus.DELIVERED, label: 'Delivered', description: 'Order has been delivered' },
    { value: OrderStatus.CANCELLED, label: 'Cancelled', description: 'Order has been cancelled' },
  ]

  const handleSubmit = async () => {
    if (status === currentStatus && (status !== OrderStatus.SHIPPED || tracking === trackingNumber)) {
      toast({
        title: 'No changes',
        description: 'No changes detected to update',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          // Only include tracking number if status is SHIPPED
          ...(status === OrderStatus.SHIPPED ? { trackingNumber: tracking } : {})
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      toast({
        title: 'Status updated',
        description: `Order status has been updated to ${status}`,
      })
    } catch (error) {
      console.error('Error updating order status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Current Status: <span className="capitalize">{currentStatus.toLowerCase()}</span></h3>
      </div>
      
      <RadioGroup value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <div key={option.value} className="flex items-start space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <div className="grid gap-1">
                <Label htmlFor={option.value} className="font-medium">
                  {option.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>
      
      {/* Show tracking number input if status is SHIPPED */}
      {status === OrderStatus.SHIPPED && (
        <div className="space-y-2">
          <Label htmlFor="tracking-number">Tracking Number</Label>
          <Input
            id="tracking-number"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Enter tracking number"
          />
        </div>
      )}
      
      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting || (status === currentStatus && (status !== OrderStatus.SHIPPED || tracking === trackingNumber))}
        className="w-full"
      >
        {isSubmitting ? 'Updating...' : 'Update Status'}
      </Button>
    </div>
  )
} 