import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LowStockTable } from '@/components/dashboard/low-stock-table'

// Define the threshold for low stock levels
const LOW_STOCK_THRESHOLD = 10

export default async function InventoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  })

  if (user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Get low stock products
  const lowStockProducts = await prisma.product.findMany({
    where: {
      stock: {
        lte: LOW_STOCK_THRESHOLD,
      },
    },
    orderBy: {
      stock: 'asc',
    },
    include: {
      category: true,
      Image: true,
    },
  })

  // Format products for the component (convert Decimal to number)
  const formattedLowStockProducts = lowStockProducts.map(product => ({
    ...product,
    price: Number(product.price)
  }))

  // Get count of all products
  const totalProducts = await prisma.product.count()
  
  // Get count of products in stock
  const inStockProducts = await prisma.product.count({
    where: {
      stock: {
        gt: 0,
      },
    },
  })
  
  // Get count of out of stock products
  const outOfStockProducts = await prisma.product.count({
    where: {
      stock: 0,
    },
  })

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Inventory Management</h2>
        <p className='text-muted-foreground'>
          Monitor your product inventory and stock levels
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Products</CardTitle>
            <PackageOpen className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>In Stock</CardTitle>
            <Badge variant='outline' className='bg-green-50'>
              {Math.round((inStockProducts / totalProducts) * 100)}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{inStockProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Out of Stock</CardTitle>
            <Badge variant='destructive'>
              {outOfStockProducts}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {outOfStockProducts > 0 ? 
                <span className='text-red-500'>{outOfStockProducts}</span> : 
                outOfStockProducts
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div className='space-y-1'>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-500' />
              Low Stock Alerts
            </CardTitle>
            <p className='text-sm text-muted-foreground'>
              Products with stock levels below the threshold of {LOW_STOCK_THRESHOLD} units
            </p>
          </div>
          <Button variant='outline'>Export Report</Button>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <PackageOpen className='h-12 w-12 text-muted-foreground' />
              <h3 className='mt-4 text-lg font-semibold'>All products are well-stocked</h3>
              <p className='text-muted-foreground'>
                There are no products with low stock levels at this time.
              </p>
            </div>
          ) : (
            <LowStockTable products={formattedLowStockProducts} threshold={LOW_STOCK_THRESHOLD} />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 