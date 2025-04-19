import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInventoryData } from '@/lib/analytics'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'

export default async function InventoryPage() {
  const inventory = await getInventoryData()

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Inventory Management</h2>
        <p className='text-muted-foreground'>
          Manage your product inventory and stock levels
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md">
              Add Product
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No inventory data available
            </p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-4">Product</th>
                      <th className="text-left font-medium p-4">Category</th>
                      <th className="text-left font-medium p-4">Price</th>
                      <th className="text-left font-medium p-4">Stock</th>
                      <th className="text-left font-medium p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((product) => (
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
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{product.category?.name || 'Uncategorized'}</td>
                        <td className="p-4">{formatCurrency(product.price)}</td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <span className={product.stock < 10 ? 'text-red-500' : ''}>{product.stock}</span>
                            {product.stock < 10 && (
                              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">
                                Low stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded">
                              Edit
                            </button>
                            <button className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded">
                              Delete
                            </button>
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