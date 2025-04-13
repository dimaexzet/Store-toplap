import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllOrders } from '@/lib/analytics'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eye, Download } from 'lucide-react'

// Helper function to get status style
function getStatusStyle(status: string) {
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

export default async function OrdersPage() {
  const orders = await getAllOrders(20)

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Order Management</h2>
        <p className='text-muted-foreground'>
          View and manage customer orders
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Orders</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No orders found
            </p>
          ) :
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-4">Order ID</th>
                      <th className="text-left font-medium p-4">Customer</th>
                      <th className="text-left font-medium p-4">Date</th>
                      <th className="text-left font-medium p-4">Status</th>
                      <th className="text-left font-medium p-4">Total</th>
                      <th className="text-left font-medium p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="p-4">
                          <span className="font-mono text-sm">{order.id.substring(0, 8)}</span>
                        </td>
                        <td className="p-4">
                          <div>
                            <div>{order.user?.name || 'Guest'}</div>
                            <div className="text-sm text-muted-foreground">{order.user?.email || 'No email'}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">{formatCurrency(order.total)}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button size="sm" variant="outline" className="h-8">
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          }
        </CardContent>
      </Card>
    </div>
  )
} 