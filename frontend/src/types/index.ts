/**
 * Shared TypeScript Types
 * 
 * @description These types mirror the backend types in `backend/app/types/api.ts`
 * for end-to-end type safety.
 */

// ============================================
// Core Types
// ============================================

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

// ============================================
// User & Auth Types
// ============================================

export interface User {
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

export interface AuthResponse {
  user: User
  token: string
}

export interface SignupResponse {
  message: string
  email: string
}

export interface MessageResponse {
  message: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  fullName?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
  passwordConfirmation: string
}

export interface ResendVerificationEmailPayload {
  email: string
}

// ============================================
// Artist Types
// ============================================

export interface Artist {
  id: number
  spotifyArtistId: string
  name: string
  imageUrl: string | null
  genres: string[] | null
  followers: number
  lastSyncedAt: string | null
}

// ============================================
// Release Types
// ============================================

export type ReleaseType = 'album' | 'single' | 'ep' | 'compilation'

export interface Release {
  id: string
  spotifyReleaseId: string
  title: string
  type: ReleaseType
  coverUrl: string | null
  releaseDate: string
  spotifyUrl: string
  artist: Artist
}

export type ReleaseSortOption = 'release_date_desc' | 'release_date_asc'

export interface ReleasesFilters {
  type?: ReleaseType
  artistId?: string
  sort?: ReleaseSortOption
  q?: string
  fromDate?: string
  toDate?: string
}

// ============================================
// Pagination Types
// ============================================

export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ============================================
// Notification Settings Types
// ============================================

export type NotificationFrequency = 'daily' | 'weekly' | 'monthly'

export interface NotificationSettings {
  notificationsEnabled: boolean
  notificationFrequency: NotificationFrequency
  notificationTypes: ReleaseType[]
  notificationEmail: string
}

export interface UpdateNotificationSettingsPayload {
  enabled?: boolean
  frequency?: NotificationFrequency
  types?: ReleaseType[]
  email?: string
}