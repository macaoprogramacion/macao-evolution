import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function RepresentativesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-80 h-4" />
        </div>
        <Skeleton className="w-28 h-9 rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="w-20 h-5 rounded-full" />
              </div>
              <Skeleton className="w-24 h-7" />
              <Skeleton className="w-36 h-4" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
  )
}
