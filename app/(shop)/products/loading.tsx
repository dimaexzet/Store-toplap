import { Skeleton } from "@/components/ui/skeleton"
import { ProductCardSkeleton } from "@/app/components/ProductCardSkeleton"

export default function ProductsLoading() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar skeleton */}
        <aside className="md:col-span-1 space-y-6">
          {/* Categories skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-3/4" />
              ))}
            </div>
          </div>
          
          {/* Filters skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-5/6" />
              ))}
            </div>
          </div>
          
          {/* Price range skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content skeleton */}
        <div className="md:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
      </div>
    </div>
  )
} 