/**
 * TanStack Query hooks for artists
 * 
 * @description Provides typed React Query hooks for artist operations
 * with automatic type inference from the API client.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Artist, PaginatedResponse } from '@/types'

/**
 * Query key factory for artists
 */
export const artistKeys = {
  all: ['artists'] as const,
  lists: () => [...artistKeys.all, 'list'] as const,
  list: (filters: { page?: number; limit?: number }) => 
    [...artistKeys.lists(), filters] as const,
  sync: () => [...artistKeys.all, 'sync'] as const,
} as const

/**
 * Fetch artists with pagination
 */
async function fetchArtists(
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Artist>> {
  return api.artists.index(params)
}

/**
 * Hook for fetching artists
 */
export function useArtists(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: artistKeys.list(params ?? {}),
    queryFn: () => fetchArtists(params),
  })
}

/**
 * Hook for syncing artists from Spotify
 */
export function useSyncArtists() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.artists.sync(),
    onSuccess: () => {
      // Invalidate all artist queries
      queryClient.invalidateQueries({ queryKey: artistKeys.all })
    },
  })
}
