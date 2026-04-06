/**
 * Shared API Types for Type-Safe End-to-End Communication
 *
 * @description These types are used by both the backend (AdonisJS)
 * and frontend (React) to ensure type safety across the API boundary.
 */

// ============================================
// API Response Types
// ============================================

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export interface ApiResponse<T> {
  data: T
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface ApiMessageResponse {
  message: string
}

// ============================================
// Release Types
// ============================================

export type ReleaseType = 'album' | 'single' | 'ep' | 'compilation'

export interface ReleaseDTO {
  id: string
  spotifyReleaseId: string
  title: string
  type: ReleaseType
  coverUrl: string | null
  releaseDate: string
  spotifyUrl: string
  artist: ArtistDTO
}

export interface ReleaseIndexDTO {
  page?: number
  limit?: number
  type?: ReleaseType
  artist_id?: number
  sort?: 'release_date_desc' | 'release_date_asc'
  q?: string
}

export interface ReleaseLiveIndexDTO extends ReleaseIndexDTO {}

// ============================================
// Artist Types
// ============================================

export interface ArtistDTO {
  id: number
  spotifyArtistId: string
  name: string
  imageUrl: string | null
  genres: string[] | null
  followers: number
  lastSyncedAt: string | null
}

export interface ArtistSyncResponse {
  message: string
}

// ============================================
// User & Auth Types
// ============================================

export interface UserDTO {
  id: number
  fullName: string | null
  email: string
  createdAt: string
  updatedAt: string
  initials: string
  spotifyId: string | null
  displayName: string | null
  avatarUrl: string | null
  country: string | null
  isSpotifyConnected: boolean
  notificationsEnabled: boolean | null
  notificationFrequency: string | null
  notificationTypes: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  fullName?: string
}

export interface AuthResponse {
  user: UserDTO
  token: string
}

// ============================================
// Notification Settings Types
// ============================================

export interface NotificationSettingsDTO {
  notificationsEnabled: boolean
  notificationFrequency: NotificationFrequency
  notificationTypes: ReleaseType[]
}

export type NotificationFrequency = 'daily' | 'weekly' | 'monthly'

export interface UpdateNotificationSettingsRequest {
  enabled?: boolean
  frequency?: NotificationFrequency
  types?: ReleaseType[]
}

// ============================================
// Spotify Types
// ============================================

export interface SpotifyRedirectResponse {
  url: string
}

export interface SpotifyDisconnectResponse {
  message: string
}

// ============================================
// Pagination Types
// ============================================

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface SortParams {
  sort?: string
}

export interface SearchParams {
  q?: string
}

export type ReleaseSortOption = 'release_date_desc' | 'release_date_asc'
