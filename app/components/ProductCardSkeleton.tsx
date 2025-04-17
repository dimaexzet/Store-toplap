import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border hover:shadow-lg transition-shadow duration-300">
      {/* Image placeholder */}
      <Skeleton className="aspect-square w-full bg-gray-200" />
      
      {/* Content placeholders */}
      <div className="p-4 flex flex-col space-y-3">
        {/* Category */}
        <Skeleton className="h-4 w-24" />
        
        {/* Title */}
        <Skeleton className="h-6 w-full" />
        
        {/* Description */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        
        {/* Price and button */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  )
} 