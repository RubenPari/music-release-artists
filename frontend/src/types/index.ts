/**
 * Shared TypeScript Types
 * 
 * @description These types mirror the backend types in `backend/app/types/api.ts`
 * for end-to-end type safety. When using Tuyau, these can be auto-generated.
 */

// ============================================
// Core Types
// ============================================

export interface ApiResponse<T> {
  data: T
}

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

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  fullName?: string
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
  id: number
  spotifyReleaseId: string
  title: string
  type: ReleaseType
  coverUrl: string | null
  releaseDate: string
  spotifyUrl: string
  firstSeenAt: string
  artist: Artist
}

export type ReleaseSortOption = 'release_date_desc' | 'release_date_asc'

export interface ReleasesFilters {
  type?: ReleaseType
  artistId?: string
  sort?: ReleaseSortOption
  q?: string
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
}

export interface UpdateNotificationSettingsPayload {
  enabled?: boolean
  frequency?: NotificationFrequency
  types?: ReleaseType[]
}

// ============================================
// API Actions (for Tuyau/TRPC client)
// ============================================

export interface ApiActions {
  // Auth
  'auth/signup': {
    body: SignupCredentials
    response: AuthResponse
  }
  'auth/login': {
    body: LoginCredentials
    response: AuthResponse
  }
  'auth/logout': {
    response: { message: string }
  }

  // Profile
  'account/profile': {
    response: User
  }

  // Releases
  releases: {
    index: {
      query: ReleasesFilters & { page?: number; limit?: number }
      response: PaginatedResponse<Release>
    }
    latest: {
      query: { days?: number }
      response: Release[]
    }
    sync: {
      response: { message: string }
    }
  }

  // Artists
  artists: {
    index: {
      query: { page?: number; limit?: number }
      response: PaginatedResponse<Artist>
    }
    sync: {
      response: { message: string }
    }
  }

  // Settings
  settings: {
    notifications: {
      show: {
        response: NotificationSettings
      }
      update: {
        body: UpdateNotificationSettingsPayload
        response: NotificationSettings
      }
    }
  }

  // Spotify
  spotify: {
    redirect: {
      response: { url: string }
    }
    disconnect: {
      response: { message: string }
    }
  }
}
