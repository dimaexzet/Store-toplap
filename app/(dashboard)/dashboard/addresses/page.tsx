import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressForm } from '@/components/dashboard/address-form'
import { AddressList } from '@/components/dashboard/address-list'

export default async function AddressesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  // Get addresses from orders that belong to the current user
  const userOrders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      Address: true,
    },
  })
  
  // Extract unique addresses from orders and filter out nulls
  const addresses = userOrders
    .map(order => order.Address)
    .filter((address): address is NonNullable<typeof address> => address !== null)
    .filter((address, index, self) => 
      index === self.findIndex(a => a.id === address.id)
    );

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>
          Shipping Addresses
        </h2>
        <p className='text-muted-foreground'>Manage your shipping addresses</p>
      </div>
      <div className='grid gap-8'>
        <Card>
          <CardHeader>
            <CardTitle>Add New Address</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressList addresses={addresses} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
