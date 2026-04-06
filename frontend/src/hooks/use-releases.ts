/**
 * TanStack Query hooks for releases
 * 
 * @description Provides typed React Query hooks for release operations
 * with automatic type inference from the API client.
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { artistKeys } from './use-artists.js'
import type { Release, PaginatedResponse, ReleasesFilters, ReleaseType, ReleaseSortOption } from '@/types'

/**
 * Query key factory for releases
 */
export const releaseKeys = {
  all: ['releases'] as const,
  lists: () => [...releaseKeys.all, 'list'] as const,
  list: (filters: ReleasesFilters) => [...releaseKeys.lists(), filters] as const,
  latest: (days?: number) => [...releaseKeys.all, 'latest', { days }] as const,
  sync: () => [...releaseKeys.all, 'sync'] as const,
} as const

/**
 * Fetch releases with filters
 */
async function fetchReleases(
  params: ReleasesFilters & { page?: number; limit?: number }
): Promise<PaginatedResponse<Release>> {
  return api.releases.live(params)
}

/**
 * Hook for fetching paginated releases
 */
export function useReleases(filters: {
  type?: ReleaseType;
  artistId?: string;
  sort?: ReleaseSortOption;
  q?: string;
  fromDate?: string;
  toDate?: string;
}) {
  return useInfiniteQuery({
    queryKey: releaseKeys.list(filters),
    queryFn: ({ pageParam = 1 }) => fetchReleases({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (page) => {
      const { currentPage, lastPage } = page.meta
      return currentPage < lastPage ? currentPage + 1 : undefined
    },
  })
}
/**
 * Hook for syncing releases from Spotify
 */
export function useSyncReleases() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.artists.sync()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: releaseKeys.all })
      void queryClient.invalidateQueries({ queryKey: artistKeys.all })
    },
  })
}


