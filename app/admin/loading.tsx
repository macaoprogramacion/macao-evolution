import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <div className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-32 h-4" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-80 h-9 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar skeleton */}
        <div className="w-60 border-r border-gray-200 bg-white p-4 space-y-4">
          <Skeleton className="w-full h-9 rounded-md" />
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-8 rounded-md" />
            ))}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-8 bg-gray-50 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-32 h-9 rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-gray-200">
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                  <Skeleton className="w-24 h-7" />
                  <Skeleton className="w-32 h-4" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-gray-200">
            <CardHeader>
              <Skeleton className="w-48 h-5" />
              <Skeleton className="w-64 h-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="w-full h-64 rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
