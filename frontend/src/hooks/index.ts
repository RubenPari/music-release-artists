// Auth hooks
export { useAuth, useLogout } from './use-auth.js'

// Data fetching hooks
export { useArtists, useArtist, useArtistReleases } from './use-artists.js'
export { useReleases, useRelease, useLatestReleases, useReleaseFilters } from './use-releases.js'
export {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from './use-notification-settings.js'

// Utility hooks
export { useDebounce } from './use-debounce.js'
export { useToast } from './use-toast.js'

// React 19 hooks
export {
  useResource,
  useDeferredResource,
  useResourcePrefetch,
} from './use-resource.js'
