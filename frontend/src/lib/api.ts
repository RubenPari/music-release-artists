/**
 * Type-Safe API Client
 * 
 * @description Wrapper around fetch with full type safety.
 * Provides end-to-end type inference from backend to frontend.
 */

import type {
  Artist,
  AuthResponse,
  LoginCredentials,
  NotificationSettings,
  PaginatedResponse,
  Release,
  ReleasesFilters,
  SignupCredentials,
  UpdateNotificationSettingsPayload,
  User,
} from '@/types'

const API_BASE = '/api/v1'

/**
 * Get authentication token from storage
 */
function getToken(): string | null {
  return localStorage.getItem('token')
}

/**
 * Store authentication token
 */
export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  localStorage.removeItem('token')
}

/**
 * Generic request function with type inference
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw {
      message: data.message || 'An error occurred',
      errors: data.errors,
    }
  }

  return data as T
}

/**
 * Type-safe API client with strongly typed methods
 */
export const api = {
  // ============================================
  // Auth Endpoints
  // ============================================
  
  auth: {
    login: (credentials: LoginCredentials): Promise<AuthResponse> =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    signup: (credentials: SignupCredentials): Promise<AuthResponse> =>
      request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    logout: (): Promise<{ message: string }> =>
      request<{ message: string }>('/auth/logout', { method: 'POST' }),
  },

  // ============================================
  // Account Endpoints
  // ============================================
  
  account: {
    getProfile: async (): Promise<User> => {
      const response = await request<{ data: User }>('/account/profile')
      return response.data
    },
  },

  // ============================================
  // Releases Endpoints
  // ============================================
  
  releases: {
    index: async (params?: ReleasesFilters & { page?: number; limit?: number }): Promise<PaginatedResponse<Release>> => {
      const searchParams = new URLSearchParams()

      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.type) searchParams.set('type', params.type)
      if (params?.artistId) searchParams.set('artist_id', params.artistId)
      if (params?.sort) searchParams.set('sort', params.sort)
      if (params?.q) searchParams.set('q', params.q)

      const queryString = searchParams.toString()
      const endpoint = `/releases${queryString ? `?${queryString}` : ''}`

      const response = await request<{ data: PaginatedResponse<Release> }>(endpoint)
      return response.data
    },

    latest: async (params?: { days?: number }): Promise<Release[]> => {
      const searchParams = new URLSearchParams()
      if (params?.days) searchParams.set('days', params.days.toString())

      const queryString = searchParams.toString()
      const endpoint = `/releases/latest${queryString ? `?${queryString}` : ''}`

      const response = await request<{ data: Release[] }>(endpoint)
      return response.data
    },

    sync: async (): Promise<{ message: string }> => {
      const response = await request<{ data: { message: string } }>('/releases/sync', { method: 'POST' })
      return response.data
    },
  },

  // ============================================
  // Artists Endpoints
  // ============================================
  
  artists: {
    index: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Artist>> => {
      const searchParams = new URLSearchParams()

      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())

      const queryString = searchParams.toString()
      const endpoint = `/artists${queryString ? `?${queryString}` : ''}`

      const response = await request<{ data: PaginatedResponse<Artist> }>(endpoint)
      return response.data
    },

    sync: async (): Promise<{ message: string }> => {
      const response = await request<{ data: { message: string } }>('/artists/sync', { method: 'POST' })
      return response.data
    },
  },

  // ============================================
  // Settings Endpoints
  // ============================================
  
  settings: {
    getNotifications: (): Promise<NotificationSettings> =>
      request<NotificationSettings>('/settings/notifications'),

    updateNotifications: (payload: UpdateNotificationSettingsPayload): Promise<NotificationSettings> =>
      request<NotificationSettings>('/settings/notifications', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },

  // ============================================
  // Spotify Endpoints
  // ============================================

  spotify: {
    getRedirectUrl: (): Promise<{ data: { url: string } }> =>
      request<{ data: { url: string } }>('/spotify/redirect'),

    disconnect: (): Promise<{ message: string }> =>
      request<{ message: string }>('/spotify/disconnect', { method: 'POST' }),
  }
} as const
