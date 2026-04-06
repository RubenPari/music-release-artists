/**
 * Type-Safe API Client
 * 
 * @description Wrapper around fetch with full type safety.
 * Provides end-to-end type inference from backend to frontend.
 */

import type {
  Artist,
  AuthResponse,
  ForgotPasswordPayload,
  LoginCredentials,
  MessageResponse,
  NotificationSettings,
  PaginatedResponse,
  Release,
  ReleasesFilters,
  SignupResponse,
  SignupCredentials,
  ResendVerificationEmailPayload,
  ResetPasswordPayload,
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

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  if (!response.ok && !isJson) {
    throw new Error(
      response.status >= 502
        ? 'Servizio temporaneamente non disponibile. Riprova tra poco.'
        : 'Errore dal server. Riprova.'
    )
  }

  let data: { message?: string; errors?: unknown; [key: string]: unknown }
  try {
    data = (await response.json()) as { message?: string; errors?: unknown; [key: string]: unknown }
  } catch {
    throw new Error('Servizio temporaneamente non disponibile. Riprova tra poco.')
  }

  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred') as Error & Record<string, unknown>
    Object.assign(error, data)
    throw error
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

    signup: (credentials: SignupCredentials): Promise<SignupResponse> =>
      request<SignupResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    logout: (): Promise<{ message: string }> =>
      request<{ message: string }>('/auth/logout', { method: 'POST' }),

    forgotPassword: (payload: ForgotPasswordPayload): Promise<MessageResponse> =>
      request<MessageResponse>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    resetPassword: (payload: ResetPasswordPayload): Promise<MessageResponse> =>
      request<MessageResponse>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    resendVerificationEmail: (payload: ResendVerificationEmailPayload): Promise<MessageResponse> =>
      request<MessageResponse>('/auth/verify-email/resend', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
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
    live: async (params?: ReleasesFilters & { page?: number; limit?: number }): Promise<PaginatedResponse<Release>> => {
      const searchParams = new URLSearchParams()

      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.type) searchParams.set('type', params.type)
      if (params?.artistId) searchParams.set('artist_id', params.artistId)
      if (params?.sort) searchParams.set('sort', params.sort)
      if (params?.q) searchParams.set('q', params.q)
      if (params?.fromDate) searchParams.set('from_date', params.fromDate)
      if (params?.toDate) searchParams.set('to_date', params.toDate)

      const queryString = searchParams.toString()
      const endpoint = `/releases/live${queryString ? `?${queryString}` : ''}`

      const response = await request<{ data: PaginatedResponse<Release> }>(endpoint)
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
