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
