import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomers } from '@/lib/analytics'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Image from 'next/image'

export default async function CustomersPage() {
  const customers = await getCustomers(20)

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Customer Management</h2>
        <p className='text-muted-foreground'>
          View and manage your customers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No customers found
            </p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-4">Customer</th>
                      <th className="text-left font-medium p-4">Email</th>
                      <th className="text-left font-medium p-4">Joined</th>
                      <th className="text-left font-medium p-4">Orders</th>
                      <th className="text-left font-medium p-4">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                              {customer.image ? (
                                <Image
                                  src={customer.image}
                                  alt={customer.name || 'Customer'}
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                  {getInitials(customer.name || 'User')}
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{customer.name || 'Anonymous User'}</span>
                          </div>
                        </td>
                        <td className="p-4">{customer.email}</td>
                        <td className="p-4">
                          {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="p-4">{customer.orderCount}</td>
                        <td className="p-4">{formatCurrency(customer.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
} 