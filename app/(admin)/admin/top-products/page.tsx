import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTopProducts } from '@/lib/analytics'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'

export default async function TopProductsPage() {
  const topProducts = await getTopProducts(10)

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Top Products</h2>
        <p className='text-muted-foreground'>
          View and analyze your best-selling products
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No product data available
            </p>
          ) : (
            <div className="space-y-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-4">Product</th>
                      <th className="text-left font-medium p-4">Price</th>
                      <th className="text-left font-medium p-4">Units Sold</th>
                      <th className="text-left font-medium p-4">Revenue</th>
                      <th className="text-left font-medium p-4">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product) => (
                      <tr key={product.id} className="border-b">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                              {product.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name || 'Product'}
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500">
                                  No img
                                </div>
                              )}
                            </div>
                            <span>{product.name}</span>
                          </div>
                        </td>
                        <td className="p-4">{formatCurrency(Number(product.price))}</td>
                        <td className="p-4">{product.totalSold}</td>
                        <td className="p-4">{formatCurrency(product.revenue)}</td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <span className={product.stock && product.stock < 10 ? 'text-red-500' : ''}>{product.stock || 0}</span>
                            {product.stock && product.stock < 10 && (
                              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">
                                Low stock
                              </span>
                            )}
                          </div>
                        </td>
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