import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Artist, PaginatedResponse } from '@/types'

export function useArtists() {
  return useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Artist>>('/artists')
      return response.data
    },
  })
}
