import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-12" aria-live="polite" aria-busy="true">
      {/* Hero Banner Skeleton */}
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-lg overflow-hidden bg-gray-200 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="sr-only">Загрузка баннера</span>
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-6 w-[80%]" />
              <Skeleton className="h-4 w-[60%]" />
              <Skeleton className="h-6 w-[40%]" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-[150px]" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-[120px] w-full rounded-full" />
              <Skeleton className="h-5 w-[70%] mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Popular Products Section */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-[220px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-6 w-[80%]" />
              <Skeleton className="h-4 w-[60%]" />
              <Skeleton className="h-6 w-[40%]" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 