'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'
import { ChevronDown, Mail, Printer, RefreshCw } from 'lucide-react'
import { OrderStatus } from '@prisma/client'

interface OrderActionsProps {
  order: {
    id: string
    status: OrderStatus
    user?: {
      email?: string | null
    } | null
  }
}

export function OrderActions({ order }: OrderActionsProps) {
  const handleEmailCustomer = async () => {
    if (!order.user?.email) {
      toast({
        title: 'Error',
        description: 'No customer email available',
        variant: 'destructive',
      })
      return
    }

    // In a real app, this would connect to an email API
    toast({
      title: 'Email notification',
      description: `Email would be sent to ${order.user.email}`,
    })
  }

  const handlePrintInvoice = () => {
    // In a real app, this would generate a PDF and trigger print
    window.print()
    toast({
      title: 'Print triggered',
      description: 'Printing invoice...',
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Actions <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleEmailCustomer}>
          <Mail className="mr-2 h-4 w-4" />
          Email Customer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrintInvoice}>
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 