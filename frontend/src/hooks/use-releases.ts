/**
 * TanStack Query hooks for releases
 * 
 * @description Provides typed React Query hooks for release operations
 * with automatic type inference from the API client.
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Release, PaginatedResponse, ReleasesFilters } from '@/types'

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
  return api.releases.index(params)
}

/**
 * Fetch latest releases
 */
async function fetchLatestReleases(days?: number): Promise<Release[]> {
  return api.releases.latest({ days })
}

/**
 * Hook for fetching paginated releases
 */
export function useReleases(filters: ReleasesFilters) {
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
 * Hook for fetching latest releases
 */
export function useLatestReleases(days?: number) {
  return useInfiniteQuery({
    queryKey: releaseKeys.latest(days),
    queryFn: ({ pageParam = 1 }) => fetchLatestReleases(days),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // For latest, we return all in one page
      return undefined
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
      // Sync both artists and releases
      await api.releases.sync()
      await api.artists.sync()
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: releaseKeys.all })
      queryClient.invalidateQueries({ queryKey: artistKeys.all })
    },
  })
}

/**
 * Query key factory for artists (shared)
 */
export const artistKeys = {
  all: ['artists'] as const,
  lists: () => [...artistKeys.all, 'list'] as const,
} as const
