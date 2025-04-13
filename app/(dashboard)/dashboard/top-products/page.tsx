import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopProductsTable } from '@/components/dashboard/top-products-table'
import { TrendingUp, DollarSign, BarChart3 } from 'lucide-react'

export default async function TopProductsPage() {
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

  // Find products with their order items to calculate sales metrics
  const products = await prisma.product.findMany({
    include: {
      orderItems: true,
      category: true,
      Image: true,
    },
  })

  // Calculate sales metrics for each product
  const productsWithMetrics = products.map(product => {
    // Total quantity sold
    const totalQuantitySold = product.orderItems.reduce(
      (sum, item) => sum + item.quantity, 
      0
    )
    
    // Total revenue
    const totalRevenue = product.orderItems.reduce(
      (sum, item) => sum + (Number(item.price) * item.quantity), 
      0
    )

    return {
      ...product,
      totalQuantitySold,
      totalRevenue,
    }
  })

  // Sort products by quantity sold (descending)
  const topSellingProducts = [...productsWithMetrics]
    .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
    .slice(0, 10) // Get top 10
  
  // Sort products by revenue (descending)
  const topRevenueProducts = [...productsWithMetrics]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10) // Get top 10

  // Format products for the table component
  const formatProductsForTable = (products: typeof productsWithMetrics) => products.map(product => ({
    id: product.id,
    name: product.name,
    stock: product.stock,
    price: Number(product.price),
    totalQuantitySold: product.totalQuantitySold,
    totalRevenue: product.totalRevenue,
    category: {
      name: product.category.name
    },
    Image: product.Image
  }))

  const formattedTopSellingProducts = formatProductsForTable(topSellingProducts)
  const formattedTopRevenueProducts = formatProductsForTable(topRevenueProducts)

  // Calculate total revenue and total items sold
  const totalRevenue = productsWithMetrics.reduce(
    (sum, product) => sum + product.totalRevenue, 
    0
  )
  
  const totalItemsSold = productsWithMetrics.reduce(
    (sum, product) => sum + product.totalQuantitySold, 
    0
  )
  
  // Calculate number of products generating revenue
  const productsWithSales = productsWithMetrics.filter(
    product => product.totalQuantitySold > 0
  ).length

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Top Products</h2>
        <p className='text-muted-foreground'>
          Analysis of your best-selling products and revenue generators
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Items Sold</CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalItemsSold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Products With Sales</CardTitle>
            <Badge variant='outline' className='bg-green-50'>
              {productsWithSales} of {products.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {Math.round((productsWithSales / products.length) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-green-500' />
            Top Products by Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSellingProducts.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>No sales data available</div>
          ) : (
            <TopProductsTable 
              products={formattedTopSellingProducts} 
              metric="quantity" 
              title="Best-Selling Products"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5 text-green-500' />
            Top Products by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topRevenueProducts.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>No revenue data available</div>
          ) : (
            <TopProductsTable 
              products={formattedTopRevenueProducts} 
              metric="revenue" 
              title="Highest Revenue Products"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 