'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

interface OrderRefundButtonProps {
  orderId: string
  total: number
  disabled?: boolean
}

export function OrderRefundButton({ orderId, total, disabled = false }: OrderRefundButtonProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRefund = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to process refund')
      }

      toast({
        title: 'Refund processed',
        description: `Successfully refunded ${formatCurrency(total)} for order #${orderId.substring(0, 8)}`,
      })
      
      // Close dialog and trigger page refresh
      setOpen(false)
      window.location.reload()
    } catch (error) {
      console.error('Error processing refund:', error)
      toast({
        title: 'Refund failed',
        description: error instanceof Error ? error.message : 'Failed to process refund',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button 
        variant="destructive" 
        disabled={disabled || isSubmitting} 
        onClick={() => setOpen(true)}
      >
        Issue Refund
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to issue a refund of {formatCurrency(total)} for this order? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault()
                handleRefund()
              }}
            >
              {isSubmitting ? 'Processing...' : 'Yes, Refund Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 