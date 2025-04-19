'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

interface TopProductsTableProps {
  products: {
    id: string
    name: string
    stock: number
    price: number | string
    totalQuantitySold: number
    totalRevenue: number
    category: {
      name: string
    }
    Image?: {
      id: string
      url: string
    }[]
  }[]
  metric: 'quantity' | 'revenue'
  title: string
}

export function TopProductsTable({ products, metric, title }: TopProductsTableProps) {
  // Find the maximum value for relative comparison
  const maxValue = Math.max(
    ...products.map(product => 
      metric === 'quantity' ? product.totalQuantitySold : product.totalRevenue
    )
  )

  // Function to get stock status label and color
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'destructive' }
    if (stock < 10) return { label: 'Low Stock', color: 'warning' }
    return { label: 'In Stock', color: 'success' as const }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>{metric === 'quantity' ? 'Units Sold' : 'Revenue'}</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const imageUrl = product.Image && product.Image.length > 0
              ? product.Image[0].url
              : '/images/placeholder.jpg';
              
            const value = metric === 'quantity' 
              ? product.totalQuantitySold 
              : product.totalRevenue;
              
            const percentage = Math.round((value / maxValue) * 100);
            const stockStatus = getStockStatus(product.stock);
            
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
                <TableCell>
                  <div className="w-full space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {metric === 'quantity' 
                          ? value 
                          : `€${value.toFixed(2)}`}
                      </span>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                </TableCell>
                <TableCell>€{Number(product.price).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge 
                    variant={stockStatus.color === 'destructive' ? 'destructive' : 'outline'}
                    className={stockStatus.color === 'warning' 
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' 
                      : stockStatus.color === 'success' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                        : ''}
                  >
                    {stockStatus.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <Link href={`/dashboard/inventory?id=${product.id}`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
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