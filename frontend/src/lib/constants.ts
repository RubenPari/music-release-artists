import type { NotificationFrequency, ReleaseType } from '@/types'

export const API_BASE = '/api/v1'

export const CACHE_KEY = 'music-release-query-cache'

export const STALE_TIME = 5 * 60 * 1000 // 5 minutes
export const GC_TIME = 24 * 60 * 60 * 1000 // 24 hours

export const SEARCH_DEBOUNCE_MS = 300

export const TOAST_DISMISS_MS = 5000

export const RELEASE_TYPE_OPTIONS: { value: ReleaseType; label: string }[] = [
  { value: 'album', label: 'Album' },
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'compilation', label: 'Compilation' },
]

export const FREQUENCY_OPTIONS: { value: NotificationFrequency; label: string }[] = [
  { value: 'daily', label: 'Giornaliera' },
  { value: 'weekly', label: 'Settimanale' },
  { value: 'monthly', label: 'Mensile' },
]

export const FILTER_TYPE_OPTIONS = [
  { value: '', label: 'Tutti i tipi' },
  ...RELEASE_TYPE_OPTIONS,
]

export const SORT_OPTIONS = [
  { value: 'release_date_desc', label: 'Più recenti' },
  { value: 'release_date_asc', label: 'Meno recenti' },
]
