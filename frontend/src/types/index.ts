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

export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface Artist {
  id: number
  spotifyArtistId: string
  name: string
  imageUrl: string | null
  genres: string[] | null
  followers: number
  lastSyncedAt: string | null
}

export interface Release {
  id: number
  spotifyReleaseId: string
  title: string
  type: 'album' | 'single' | 'ep' | 'compilation'
  coverUrl: string | null
  releaseDate: string
  spotifyUrl: string
  firstSeenAt: string
  artist: Artist
}

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
