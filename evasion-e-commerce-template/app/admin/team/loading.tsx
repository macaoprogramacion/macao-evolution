import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-48 h-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6 space-y-3"><Skeleton className="w-full h-16" /></CardContent></Card>
        ))}
      </div>
      <Skeleton className="w-full h-96 rounded-md" />
    </div>
  )
}
