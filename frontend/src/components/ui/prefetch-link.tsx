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

/**
 * PrefetchLinkToSettings - Link to settings with prefetched notification settings
 */
export function PrefetchLinkToSettings({
  children,
  ...props
}: Omit<PrefetchLinkProps, 'to' | 'prefetchQueries'>) {
  return (
    <PrefetchLink
      to="/settings"
      prefetchQueries={[
        {
          queryKey: ['notificationSettings'],
          queryFn: () => fetch('/api/v1/settings/notifications').then((r) => r.json()),
        },
      ]}
      {...props}
    >
      {children}
    </PrefetchLink>
  )
}

/**
 * PrefetchLinkToDashboard - Link to dashboard with prefetched releases
 */
export function PrefetchLinkToDashboard({
  children,
  ...props
}: Omit<PrefetchLinkProps, 'to' | 'prefetchQueries'>) {
  return (
    <PrefetchLink
      to="/dashboard"
      prefetchQueries={[
        {
          queryKey: ['releases'],
          queryFn: () => fetch('/api/v1/releases').then((r) => r.json()),
        },
        {
          queryKey: ['artists'],
          queryFn: () => fetch('/api/v1/artists').then((r) => r.json()),
        },
      ]}
      {...props}
    >
      {children}
    </PrefetchLink>
  )
}
