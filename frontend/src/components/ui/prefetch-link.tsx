import { useCallback, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { queryClient } from '@/lib/query-config.js'
import type { QueryKey } from '@tanstack/react-query'

interface PrefetchLinkProps extends Omit<LinkProps, 'to'> {
  to: string
  prefetchQueries?: Array<{
    queryKey: QueryKey
    queryFn: () => Promise<unknown>
  }>
  children: ReactNode
}

/**
 * Link component with strategic prefetching on hover
 *
 * @description Prefetches data when user hovers over the link,
 * improving perceived performance for navigation.
 */
export function PrefetchLink({
  to,
  prefetchQueries = [],
  children,
  onMouseEnter,
  ...props
}: PrefetchLinkProps) {
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      prefetchQueries.forEach(({ queryKey, queryFn }) => {
        void queryClient.prefetchQuery({
          queryKey,
          queryFn: queryFn as () => Promise<unknown>,
          staleTime: 5 * 60 * 1000,
        })
      })

      onMouseEnter?.(event)
    },
    [prefetchQueries, onMouseEnter]
  )

  return (
    <Link to={to} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </Link>
  )
}
