import { Skeleton } from '@/components/ui/skeleton'

export default function UpgradeRequestsLoading() {
  return (
    <div className="space-y-7 pb-10">
      <div className="space-y-3">
        <Skeleton className="h-6 w-52 rounded-full" />
        <Skeleton className="h-10 w-80 max-w-full rounded-xl" />
        <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-3xl" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-96 rounded-3xl" />
        ))}
      </div>
    </div>
  )
}
