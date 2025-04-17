import { Skeleton } from "@/components/ui/skeleton"
import ProductCardSkeleton from "@/app/components/ProductCardSkeleton"

export default function ProductsLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar skeleton */}
        <div className="md:w-1/4 lg:w-1/5">
          <Skeleton className="h-10 w-3/4 mb-6" />
          <Skeleton className="h-5 w-1/2 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-5 w-1/2 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-4" />
        </div>
        
        {/* Main content skeleton */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-40" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(12).fill(0).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <Skeleton className="h-10 w-72" />
          </div>
        </div>
      </div>
    </div>
  )
} 