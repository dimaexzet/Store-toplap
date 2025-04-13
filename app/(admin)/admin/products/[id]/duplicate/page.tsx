'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface DuplicateProductPageProps {
  params: { id: string }
}

export default function DuplicateProductPage({ params }: DuplicateProductPageProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const duplicateProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${params.id}/duplicate`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to duplicate product')
        }
        
        const data = await response.json()
        
        // Redirect to the edit page of the new duplicated product
        router.push(`/admin/products/${data.product.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        
        // Redirect back to products list after a delay if there's an error
        setTimeout(() => {
          router.push('/admin/products')
        }, 3000)
      }
    }
    
    duplicateProduct()
  }, [params.id, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {error ? (
            <div className="text-center space-y-2">
              <p className="text-destructive font-medium">Error</p>
              <p>{error}</p>
              <p className="text-sm text-muted-foreground">
                Redirecting back to product list...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-center">Duplicating product...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 