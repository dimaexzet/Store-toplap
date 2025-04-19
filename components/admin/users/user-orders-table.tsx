'use client'

import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { OrderStatus } from '@prisma/client'
import { Eye } from 'lucide-react'

// Type for the order with number for price (instead of Decimal)
interface Order {
  id: string
  status: OrderStatus
  total: number
  createdAt: Date
  items: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
    }
  }[]
}

interface UserOrdersTableProps {
  orders: Order[]
}

// Define status colors
const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800'
    case 'SHIPPED':
      return 'bg-purple-100 text-purple-800'
    case 'DELIVERED':
      return 'bg-green-100 text-green-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    case 'REFUNDED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function UserOrdersTable({ orders }: UserOrdersTableProps) {
  const router = useRouter()

  // If no orders, show a message
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        This user hasn&apos;t placed any orders yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                {order.id.substring(0, 8)}
              </TableCell>
              <TableCell>
                {format(new Date(order.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline"
                  className={getStatusColor(order.status)}
                >
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                <div className="text-xs text-muted-foreground mt-1">
                  {order.items.slice(0, 2).map((item) => (
                    <div key={item.id} className="truncate max-w-[200px]">
                      {item.quantity}x {item.product.name}
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <div>+{order.items.length - 2} more...</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(order.total)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 