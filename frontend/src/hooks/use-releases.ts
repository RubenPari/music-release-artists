import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Release, PaginatedResponse } from '@/types'

interface ReleasesFilters {
  type?: string
  artistId?: string
  sort?: string
  q?: string
}

interface ReleasesParams extends ReleasesFilters {
  page?: number
  limit?: number
}

async function fetchReleases(params: ReleasesParams): Promise<PaginatedResponse<Release>> {
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.type) searchParams.set('type', params.type)
  if (params.artistId) searchParams.set('artist_id', params.artistId)
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.q) searchParams.set('q', params.q)

  const queryString = searchParams.toString()
  const endpoint = `/releases${queryString ? `?${queryString}` : ''}`
  
  const response = await api.get<PaginatedResponse<Release>>(endpoint)
  return response.data
}

export function useReleases(filters: ReleasesFilters) {
  return useInfiniteQuery({
    queryKey: ['releases', filters],
    queryFn: ({ pageParam = 1 }) => fetchReleases({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (page) => {
      const { currentPage, lastPage: totalPages } = page.meta
      return currentPage < totalPages ? currentPage + 1 : undefined
    },
  })
}

export function useSyncReleases() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post('/releases/sync')
      await api.post('/artists/sync')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] })
      queryClient.invalidateQueries({ queryKey: ['artists'] })
    },
  })
}
