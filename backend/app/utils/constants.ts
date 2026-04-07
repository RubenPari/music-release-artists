/**
 * Centralized application constants
 *
 * @module app/utils/constants
 */

export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
} as const

export const RELEASE_TYPES = ['album', 'single', 'ep', 'compilation'] as const

export const NOTIFICATION_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const

export const SORT_OPTIONS = {
  RELEASE_DATE_DESC: 'release_date_desc',
  RELEASE_DATE_ASC: 'release_date_asc',
} as const

const FRONTEND_BASE = process.env.FRONTEND_URL || 'http://127.0.0.1:5173'

export const REDIRECTS = {
  SPOTIFY_ERROR: (error: string) => `${FRONTEND_BASE}/settings?spotify_error=${error}`,
  SPOTIFY_SUCCESS: `${FRONTEND_BASE}/settings?spotify=connected`,
  DASHBOARD_SUCCESS: `${FRONTEND_BASE}/?spotify=connected`,
  DASHBOARD_ERROR: (error: string) => `${FRONTEND_BASE}/?error=${error}`,
} as const

export const APP_URLS = {
  FRONTEND_BASE,
  REDIRECTS,
} as const

export const RATE_LIMITS = {
  AUTH: { requests: 10, period: '1 minute' as const },
  FORGOT_PASSWORD: { requests: 3, period: '5 minutes' as const },
  RESEND_VERIFICATION: { requests: 3, period: '5 minutes' as const },
  SPOTIFY_SYNC: { requests: 5, period: '1 minute' as const },
} as const

export const SPOTIFY_PAGINATION_LIMIT = 50

export const SPOTIFY_SCOPES = ['user-read-private', 'user-read-email', 'user-follow-read'].join(' ')

export const SPOTIFY_ENDPOINTS = {
  AUTHORIZE: 'https://accounts.spotify.com/authorize',
  TOKEN: 'https://accounts.spotify.com/api/token',
  API_BASE: 'https://api.spotify.com/v1',
} as const
