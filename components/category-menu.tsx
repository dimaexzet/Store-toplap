'use client'

import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

type Category = {
  id: string
  name: string
  productCount: number
}

export function CategoryMenu() {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Fetch categories when the sheet is opened
  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories?includeProductCount=true')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      
      // Filter categories to only show ones with products
      const categoriesWithProducts = data.filter(
        (category: Category) => category.productCount > 0
      )
      
      setCategories(categoriesWithProducts)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    setOpen(false)
    router.push(`/product?categoryId=${categoryId}`)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2 px-4 font-bold text-black hover:bg-gray-100 hover:text-black"
        >
          <Menu className="h-5 w-5 mr-2" />
          Products
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-xl">Product Categories</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-start text-left font-semibold"
            onClick={() => {
              setOpen(false)
              router.push('/product')
            }}
          >
            All Products
          </Button>
          
          {loading ? (
            // Loading skeletons
            Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
              ))
          ) : (
            // Actual categories
            categories.map((category) => (
              <div 
                key={category.id} 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                onClick={() => handleCategoryClick(category.id)}
              >
                <span className="font-medium">{category.name}</span>
                <Badge variant="outline">{category.productCount}</Badge>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 