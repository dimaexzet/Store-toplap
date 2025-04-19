'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Trash,
  Edit,
  Copy,
  AlertCircle,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

type Product = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  featured: boolean
  createdAt: Date
  updatedAt: Date
  imageUrl: string | null
  category: {
    id: string
    name: string
  }
}

type Category = {
  value: string
  label: string
}

interface ProductsTableProps {
  products: Product[]
  categories: Category[]
  totalPages: number
  currentPage: number
  totalProducts: number
  search: string
  category: string
  sortBy: string
  sortOrder: string
}

export function ProductsTable({
  products,
  categories,
  totalPages,
  currentPage,
  totalProducts,
  search,
  category,
  sortBy,
  sortOrder,
}: ProductsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingFeatured, setIsUpdatingFeatured] = useState(false)
  
  // Create URL with updated search params
  const createQueryString = (params: Record<string, string | number | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    
    // Update or delete search params
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, String(value))
      }
    })
    
    return newSearchParams.toString()
  }

  const handleSearch = (term: string) => {
    router.push(`${pathname}?${createQueryString({ search: term || null, page: 1 })}`)
  }

  const handleCategoryFilter = (categoryId: string) => {
    router.push(`${pathname}?${createQueryString({ category: categoryId === 'all' ? null : categoryId, page: 1 })}`)
  }

  const handlePageChange = (page: number) => {
    router.push(`${pathname}?${createQueryString({ page })}`)
  }

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    router.push(`${pathname}?${createQueryString({ sort: column, order: newOrder })}`)
  }

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(product => product.id))
    }
  }

  const toggleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    } else {
      setSelectedProducts([...selectedProducts, productId])
    }
  }

  const handleDeleteSelected = async () => {
    if (!selectedProducts.length) return
    
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedProducts }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete products')
      }
      
      toast({
        title: 'Products deleted',
        description: `Successfully deleted ${selectedProducts.length} products`,
      })
      
      // Refresh the page to show updated data
      router.refresh()
      setSelectedProducts([])
    } catch (error) {
      console.error('Error deleting products:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete products. Please try again.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleFeatured = async () => {
    if (!selectedProducts.length) return
    
    setIsUpdatingFeatured(true)
    
    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedProducts,
          data: { featured: true }
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update products')
      }
      
      toast({
        title: 'Products updated',
        description: `Successfully updated ${selectedProducts.length} products`,
      })
      
      // Refresh the page to show updated data
      router.refresh()
      setSelectedProducts([])
    } catch (error) {
      console.error('Error updating products:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update products. Please try again.',
      })
    } finally {
      setIsUpdatingFeatured(false)
    }
  }

  // Render sort indicator icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Product Catalog</CardTitle>
          <div className="flex items-center gap-2">
            {selectedProducts.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleToggleFeatured}
                  disabled={isUpdatingFeatured}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Set Featured
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete {selectedProducts.length}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              defaultValue={search}
              onChange={(e) => {
                // Add debounce to prevent too many requests
                const timeoutId = setTimeout(() => {
                  handleSearch(e.target.value)
                }, 500)
                return () => clearTimeout(timeoutId)
              }}
            />
          </div>
          <Select 
            defaultValue={category || "all"} 
            onValueChange={handleCategoryFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={products.length > 0 && selectedProducts.length === products.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all products"
                  />
                </TableHead>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center">
                    Name
                    {renderSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                  <div className="flex items-center">
                    Price
                    {renderSortIcon('price')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('stock')}>
                  <div className="flex items-center">
                    Stock
                    {renderSortIcon('stock')}
                  </div>
                </TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      <div className="text-lg font-medium">No products found</div>
                      <div className="text-sm text-muted-foreground">
                        Try adjusting your search or filter to find what you're looking for.
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleSelectProduct(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                            No img
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {product.description}
                      </div>
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <div className={`${product.stock < 10 ? 'text-destructive' : ''}`}>
                        {product.stock}
                        {product.stock < 10 && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                            Low
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.featured ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Featured
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/${product.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/${product.id}/duplicate`}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${product.name}?`)) {
                                fetch(`/api/admin/products/${product.id}`, {
                                  method: 'DELETE',
                                }).then((res) => {
                                  if (res.ok) {
                                    toast({
                                      title: 'Product deleted',
                                      description: `${product.name} has been deleted.`,
                                    })
                                    router.refresh()
                                  } else {
                                    toast({
                                      variant: 'destructive',
                                      title: 'Error',
                                      description: 'Failed to delete product.',
                                    })
                                  }
                                })
                              }
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{products.length}</strong> of <strong>{totalProducts}</strong> products
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
} 