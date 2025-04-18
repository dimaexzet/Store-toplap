import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PackageSearch, MapPin, Heart } from 'lucide-react'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  const [orders, user] = await Promise.all([
    prisma.order.count({
      where: {
        userId: session.user.id,
      },
    }),
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          include: {
            Address: true,
          },
        },
      },
    }),
  ])

  // Get unique addresses from user orders
  const userOrdersWithAddresses = user?.orders || []
  const uniqueAddressIds = new Set()
  const addresses = userOrdersWithAddresses
    .filter(order => order.Address !== null)
    .filter(order => {
      // Only keep unique addresses
      if (order.Address && !uniqueAddressIds.has(order.Address.id)) {
        uniqueAddressIds.add(order.Address.id)
        return true
      }
      return false
    })
    .map(order => order.Address)
    .length

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>
          Welcome back, {user?.name}
        </h2>
        <p className='text-muted-foreground'>
          Here&apos;s a summary of your account
        </p>
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Orders</CardTitle>
            <PackageSearch className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{orders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Saved Addresses
            </CardTitle>
            <MapPin className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{addresses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Wishlist Items
            </CardTitle>
            <Heart className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
          </CardContent>
        </Card>
      </div>
      <div className='space-y-4'>
        <h3 className='text-xl font-semibold'>Recent Orders</h3>
        {user?.orders.length === 0 ? (
          <p className='text-muted-foreground'>No orders yet</p>
        ) : (
          <div className='grid gap-4'>
            {user?.orders.map((order) => (
              <Card key={order.id}>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Order #{order.id.slice(-8)}</p>
                      <p className='text-sm text-muted-foreground'>
                        {format(new Date(order.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium'>€{Number(order.total).toFixed(2)}</p>
                      <p className='text-sm capitalize text-muted-foreground'>
                        {order.status.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
