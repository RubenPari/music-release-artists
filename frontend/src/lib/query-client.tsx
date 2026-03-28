import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import type { Query } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { queryClient } from './query-config.js'

/**
 * Storage persister for offline support
 *
 * Persists query cache to localStorage
 */
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'music-release-query-cache',
})

/**
 * Check if a query should be dehydrated (persisted)
 */
const shouldPersistQuery = (query: Query<unknown, Error, unknown, readonly unknown[]>) => {
  const persistableKeys = ['releases', 'artists', 'profile']
  return persistableKeys.some(
    (key) => Array.isArray(query.queryKey) && query.queryKey.includes(key)
  )
}

/**
 * QueryProvider with persistence
 *
 * Wraps the app with QueryClientProvider and persistence layer
 * for offline support.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => queryClient)

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        dehydrateOptions: {
          shouldDehydrateQuery: shouldPersistQuery,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
