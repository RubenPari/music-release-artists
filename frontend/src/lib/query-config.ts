import { QueryClient } from '@tanstack/react-query'
import { STALE_TIME, GC_TIME } from '@/lib/constants'

/**
 * Query Client Configuration
 *
 * Default options optimized for this application
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

/**
 * Hydration state for SSR
 *
 * Use this to pass pre-fetched data from server to client
 */
export interface DehydratedState {
  queries: Array<{
    queryKey: unknown[]
    data?: unknown
    updatedAt?: number
  }>
}
