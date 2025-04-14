'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { AlignJustify, ChevronRight, Loader2, Menu, ShoppingBag } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Category {
  id: string
  name: string
  productCount?: number
}

export function CategoryMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/categories?includeProductCount=true')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        // Фильтруем категории, в которых есть товары
        const categoriesWithProducts = data.filter((cat: any) => 
          cat.productCount && cat.productCount > 0
        )
        setCategories(categoriesWithProducts)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/products?category=${categoryId}`)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 font-semibold hover:bg-slate-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
          Products
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-6 w-6" />
            Categories
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <div className="mt-6 flex flex-col space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                No categories found
              </div>
            ) : (
              categories.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  className="justify-between px-2"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <span className="flex-1 text-left">
                    {category.name}
                    {category.productCount && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({category.productCount})
                      </span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ))
            )}
          </div>

          <div className="mt-6">
            <Link href="/products" onClick={() => setIsOpen(false)}>
              <Button className="w-full" variant="outline">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 