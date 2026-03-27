import type { ApiResponse, ApiError } from '@/types'

const API_BASE = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
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
    const error: ApiError = {
      message: data.message || 'An error occurred',
      errors: data.errors,
    }
    throw error
  }

  return { data: data as T }
}

export const api = {
  get<T>(endpoint: string) {
    return request<T>(endpoint, { method: 'GET' })
  },

  post<T>(endpoint: string, body?: unknown) {
    return request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  put<T>(endpoint: string, body?: unknown) {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  patch<T>(endpoint: string, body?: unknown) {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  delete<T>(endpoint: string) {
    return request<T>(endpoint, { method: 'DELETE' })
  },
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function removeToken() {
  localStorage.removeItem('token')
}
