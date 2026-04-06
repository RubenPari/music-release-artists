interface ReleaseSkeletonProps {
  count?: number
}

export function ReleaseSkeleton({ count = 1 }: ReleaseSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="aspect-square animate-pulse bg-surface" />
          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="h-5 w-3/4 animate-pulse rounded bg-surface" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-surface" />
            </div>
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ))}
    </>
  )
}
