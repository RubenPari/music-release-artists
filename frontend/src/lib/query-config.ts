import { QueryClient } from '@tanstack/react-query'

/**
 * Query Client Configuration
 *
 * Default options optimized for this application
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (was cacheTime)
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
