/**
 * TanStack Query hooks for authentication
 * 
 * @description Provides typed React Query hooks for auth operations
 * with automatic type inference and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, setToken, removeToken } from '@/lib/api'
import type { User, LoginCredentials, SignupCredentials } from '@/types'

/**
 * Query key factory for auth
 */
export const authKeys = {
  all: ['auth'] as const,
  user: ['auth', 'user'] as const,
} as const

/**
 * Fetch current user profile
 */
async function fetchUser(): Promise<User> {
  return api.account.getProfile()
}

/**
 * Login mutation
 */
async function login(credentials: LoginCredentials) {
  const response = await api.auth.login(credentials)
  setToken(response.token)
  return response
}

/**
 * Signup mutation
 */
async function signup(credentials: SignupCredentials) {
  const response = await api.auth.signup(credentials)
  setToken(response.token)
  return response
}

/**
 * Logout mutation
 */
async function logout() {
  await api.auth.logout()
  removeToken()
}

/**
 * Hook for getting current authenticated user
 */
export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading, error } = useQuery({
    queryKey: authKeys.user,
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user, data.user)
    },
  })

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user, data.user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear()
    },
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isSpotifyConnected: user?.isSpotifyConnected ?? false,
    error,
    
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    
    loginError: loginMutation.error,
    signupError: signupMutation.error,
  }
}
