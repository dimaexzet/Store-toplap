'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProductGrid } from '@/components/products/product-grid'
import { ProductSidebar } from '@/components/products/product-sidebar'

// Define enhanced product type with highlighting
interface ProductWithHighlights {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  stock: number
  categoryId: string
  featured: boolean
  category?: {
    id: string
    name: string
  }
  nameHighlighted?: string
  descriptionHighlighted?: string
  relevanceScore?: number
}

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<ProductWithHighlights[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const sort = searchParams.get('sort')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          ...(category && { category }),
          ...(search && { search }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(sort && { sort }),
          // Request highlighted results when there's a search term
          ...(search && { highlights: 'true' }),
        })

        const response = await fetch(`/api/products?${queryParams}`)
        const data = await response.json()

        setProducts(data.products)
        setTotalPages(Math.ceil(data.total / data.perPage))
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category, search, minPrice, maxPrice, sort, currentPage])

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex flex-col md:flex-row gap-8'>
        <aside className='w-full md:w-64'>
          <ProductSidebar />
        </aside>
        <main className='flex-1'>
          <ProductGrid
            products={products}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showHighlights={!!search}
            searchQuery={search}
          />
        </main>
      </div>
    </div>
  )
}
