import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, setToken, removeToken } from '@/lib/api'
import type { AuthResponse, User } from '@/types'

const USER_QUERY_KEY = ['user']

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<User>('/account/profile')
      return response.data
    },
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await api.post<AuthResponse>('/auth/login', credentials)
      return response.data
    },
    onSuccess: (data) => {
      setToken(data.token)
      queryClient.setQueryData(USER_QUERY_KEY, data.user)
    },
  })

  const signupMutation = useMutation({
    mutationFn: async (data: {
      fullName: string
      email: string
      password: string
      passwordConfirmation: string
    }) => {
      const response = await api.post<AuthResponse>('/auth/signup', data)
      return response.data
    },
    onSuccess: (data) => {
      setToken(data.token)
      queryClient.setQueryData(USER_QUERY_KEY, data.user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSettled: () => {
      removeToken()
      queryClient.clear()
    },
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isSpotifyConnected: user?.isSpotifyConnected ?? false,
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
