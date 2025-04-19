'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  AlertCircle, 
  PackageOpen, 
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  stock: number
  price: number | string
  category: {
    name: string
  }
  Image?: {
    id: string
    url: string
  }[]
}

interface LowStockTableProps {
  products: Product[]
  threshold: number
}

export function LowStockTable({ products, threshold }: LowStockTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({})

  // Initialize stock updates with current stock values
  useEffect(() => {
    const initialValues: Record<string, number> = {}
    products.forEach(product => {
      initialValues[product.id] = product.stock
    })
    setStockUpdates(initialValues)
  }, [products])

  const handleStockChange = (productId: string, value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setStockUpdates(prev => ({
        ...prev,
        [productId]: numValue
      }))
    }
  }

  const handleRestock = async (productId: string) => {
    try {
      setIsUpdating(productId)
      
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          stock: stockUpdates[productId] 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update stock')
      }

      toast({
        title: 'Stock updated',
        description: 'Product stock has been updated successfully.',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(null)
    }
  }

  // Function to get appropriate color based on stock level
  const getStockLevelColor = (stock: number) => {
    if (stock === 0) return 'text-red-500'
    if (stock <= threshold / 2) return 'text-amber-500'
    return 'text-amber-400'
  }

  // Function to get appropriate icon based on stock level
  const getStockLevelIcon = (stock: number) => {
    if (stock === 0) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (stock <= threshold / 2) return <AlertCircle className="h-4 w-4 text-amber-500" />
    return <PackageOpen className="h-4 w-4 text-amber-400" />
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>New Stock</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const imageUrl = product.Image && product.Image.length > 0
              ? product.Image[0].url
              : '/images/placeholder.jpg';
              
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 relative overflow-hidden rounded">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="truncate max-w-[200px]">{product.name}</span>
                  </div>
                </TableCell>
                <TableCell>{product.category.name}</TableCell>
                <TableCell>€{Number(product.price).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getStockLevelIcon(product.stock)}
                    <span className={getStockLevelColor(product.stock)}>
                      {product.stock}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={stockUpdates[product.id] || product.stock}
                    onChange={(e) => handleStockChange(product.id, e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestock(product.id)}
                    disabled={isUpdating === product.id || (stockUpdates[product.id] || 0) === product.stock}
                  >
                    {isUpdating === product.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Update
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  )
} 