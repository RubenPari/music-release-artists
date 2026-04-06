import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import type { Release } from '@/types'
import { ReleaseCard } from './release-card'
import { ReleaseSkeleton } from './release-skeleton'

interface ReleaseGridProps {
  releases: Release[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => Promise<unknown>
}

export function ReleaseGrid({
  releases,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: ReleaseGridProps) {
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <ReleaseSkeleton count={8} />
      </div>
    )
  }

  if (releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-sm">
        <svg
          className="mb-4 h-16 w-16 text-muted/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Nessuna release trovata</h3>
        <p className="text-sm text-muted">Prova a modificare i filtri o sincronizza le tue uscite</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {releases.map((release) => (
          <ReleaseCard key={release.id} release={release} />
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <ReleaseSkeleton count={4} />
        </div>
      )}

      {hasNextPage && !isFetchingNextPage && (
        <div ref={ref} className="flex justify-center py-4">
          <span className="text-sm text-muted">Carica altre release...</span>
        </div>
      )}
    </div>
  )
}
